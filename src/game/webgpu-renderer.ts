// WebGPU Renderer for ATHERIA: VOID BREAKER
// Renders game particles on a dedicated transparent overlay canvas using
// instanced quads. Physics integration stays on the CPU (single source of
// truth for positions); the GPU accelerates the rendering of up to 10k
// particles.
//
// Visual quality (v3 — real bloom post-processing):
//  - soft radial particles with bright core + wide halo (no more flat squares)
//  - additive blending for sparks/glow (light adds up; bullets stay readable
//    through dense explosions — per "Anatomy of a Shmup" visibility rules)
//  - normal (premultiplied) blending for smoke/debris
//  - expanding shockwave rings for explosions
//  - subtle per-particle twinkle driven by a time uniform
//  - TRUE BLOOM: particles render to an offscreen texture, a bright-pass
//    extracts highlights at half resolution, a separable Gaussian blur
//    (2 passes) spreads them, and a composite pass adds the glow back on
//    top. Falls back to direct rendering on any pipeline failure.
declare const GPUBufferUsage: any;
declare const GPUTextureUsage: any;

type GPUDevice = any;
type GPUCanvasContext = any;
type GPUTextureFormat = string;
type GPURenderPipeline = any;
type GPUBuffer = any;
type GPUBindGroup = any;
type GPUTexture = any;
type GPUSampler = any;

interface RenderParticle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  color: string; type: string;
}

// CPU-side particle layout (matches WGSL struct alignment):
// [0]=x [1]=y [2]=vx [3]=vy [4]=life [5]=maxLife [6]=size [7]=mode
// [8]=r [9]=g [10]=b [11]=a   -> 48 bytes per particle
const FLOATS_PER_PARTICLE = 12;
const BYTES_PER_PARTICLE = FLOATS_PER_PARTICLE * 4;

// Particle render modes (packed into float slot [7]):
const MODE_NORMAL_DOT = 0;   // soft dot, normal (premultiplied) blending — smoke/debris
const MODE_ADDITIVE_DOT = 1; // soft dot, additive blending — sparks/glow/energy
const MODE_RING = 2;         // expanding shockwave ring, additive blending

function modeForType(type: string): number {
  switch (type) {
    case 'spark':
    case 'energy':
    case 'glow':
    case 'trail':
      return MODE_ADDITIVE_DOT;
    case 'ring':
    case 'shockwave':
      return MODE_RING;
    default:
      return MODE_NORMAL_DOT;
  }
}

// Bloom tuning (per WebGPU post-processing research: threshold keeps only
// highlights, half-res blur is visually indistinguishable from full-res)
const BLOOM_THRESHOLD = 0.45;
const BLOOM_STRENGTH = 1.25;

export class WebGPURenderer {
  private canvas: HTMLCanvasElement;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = 'bgra8unorm';

  private normalPipeline: GPURenderPipeline | null = null;
  private additivePipeline: GPURenderPipeline | null = null;

  // Post-processing (bloom) pipelines
  private brightPipeline: GPURenderPipeline | null = null;
  private blurPipeline: GPURenderPipeline | null = null;
  private compositePipeline: GPURenderPipeline | null = null;

  private quadVertexBuffer: GPUBuffer | null = null;
  private fullscreenBuffer: GPUBuffer | null = null;
  private particleStagingBuffer: GPUBuffer | null = null;
  private particleInstanceBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;

  // Bloom resources
  private sampler: GPUSampler | null = null;
  private particleTex: GPUTexture | null = null;  // full-res particle target
  private bloomTexA: GPUTexture | null = null;    // half-res ping
  private bloomTexB: GPUTexture | null = null;    // half-res pong
  private brightUniform: GPUBuffer | null = null;
  private blurUniformH: GPUBuffer | null = null;
  private blurUniformV: GPUBuffer | null = null;
  private compUniform: GPUBuffer | null = null;
  private brightBG: GPUBindGroup | null = null;
  private blurBGH: GPUBindGroup | null = null;
  private blurBGV: GPUBindGroup | null = null;
  private compBG: GPUBindGroup | null = null;
  private bloomWanted = true;
  private bloomReady = false;

  private normalBindGroup: GPUBindGroup | null = null;
  private additiveBindGroup: GPUBindGroup | null = null;

  private maxParticles = 10000;
  private isInitialized = false;
  private colorCache = new Map<string, [number, number, number]>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initialize(): Promise<boolean> {
    try {
      const nav = navigator as any;
      if (!nav.gpu) {
        console.warn('WebGPU not supported');
        return false;
      }

      const adapter = await nav.gpu.requestAdapter();
      if (!adapter) {
        console.warn('No GPU adapter found');
        return false;
      }

      this.device = await adapter.requestDevice();
      if (!this.device) {
        console.warn('Failed to get GPU device');
        return false;
      }

      // NOTE: this must be called on a DEDICATED canvas that has never had a
      // 2D context acquired on it (a canvas can only have one context type).
      this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
      if (!this.context) {
        console.warn('Failed to get WebGPU context');
        return false;
      }

      this.format = nav.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: this.format,
        alphaMode: 'premultiplied'
      });

      this.createPipelines();
      this.createBuffers();
      this.resize(this.canvas.clientWidth || 300, this.canvas.clientHeight || 150);

      this.isInitialized = true;
      console.log('WebGPU initialized successfully (bloom ' + (this.bloomReady ? 'ON' : 'fallback') + ')');
      return true;
    } catch (e) {
      console.error('WebGPU initialization failed:', e);
      return false;
    }
  }

  resize(width: number, height: number) {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    if (this.isInitialized) this.createBloomTargets();
  }

  /** User setting toggle — bloom is skipped at 'low' particle quality. */
  setBloomEnabled(on: boolean) {
    this.bloomWanted = on;
  }

  private createPipelines() {
    if (!this.device) return;

    // Vertex shader for instanced particle quads.
    const shaderCode = `
      struct Uniforms {
        resolution: vec2<f32>,
        time: f32,
        pad: f32,
      }
      @group(0) @binding(0) var<uniform> uniforms: Uniforms;

      struct VertexInput {
        @location(0) corner: vec2<f32>,    // quad corner in [-1, 1]
        @location(1) position: vec2<f32>,  // world position (px)
        @location(2) size: f32,            // radius in px (max radius for rings)
        @location(3) lifeMax: vec2<f32>,   // (life, maxLife)
        @location(4) color: vec4<f32>,
        @location(5) mode: f32,
      }

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) uv: vec2<f32>,
        @location(1) color: vec4<f32>,
        @location(2) mode: f32,
        @location(3) progress: f32,
      }

      @vertex
      fn main(input: VertexInput) -> VertexOutput {
        var out: VertexOutput;

        let ratio = clamp(input.lifeMax.x / max(input.lifeMax.y, 0.0001), 0.0, 1.0);
        let progress = 1.0 - ratio;

        // Rings expand from a small seed to their full radius as they age.
        let radius = select(
          input.size,
          input.size * (0.15 + 0.85 * progress),
          input.mode == 2.0
        );

        let worldPos = input.position + input.corner * radius;
        let clipPos = vec2<f32>(
          (worldPos.x / uniforms.resolution.x) * 2.0 - 1.0,
          1.0 - (worldPos.y / uniforms.resolution.y) * 2.0
        );

        out.position = vec4<f32>(clipPos, 0.0, 1.0);
        out.uv = input.corner;
        out.mode = input.mode;
        out.progress = progress;

        // Dots fade with remaining life; rings fade as they expand.
        let fade = select(ratio, 1.0 - progress, input.mode == 2.0);
        out.color = vec4<f32>(input.color.rgb, input.color.a * fade);

        return out;
      }

      struct FragmentInput {
        @location(0) uv: vec2<f32>,
        @location(1) color: vec4<f32>,
        @location(2) mode: f32,
        @location(3) progress: f32,
      }

      @fragment
      fn main(input: FragmentInput) -> @location(0) vec4<f32> {
        let d = length(input.uv); // 0 at particle center, 1 at quad edge

        // Expanding shockwave ring: thin bright band that sharpens as it grows.
        if (input.mode == 2.0) {
          let ringR = 0.55 + 0.25 * input.progress;
          let width = mix(0.18, 0.06, input.progress);
          let band = 1.0 - smoothstep(0.0, width, abs(d - ringR));
          let ringA = input.color.a * band;
          return vec4<f32>(input.color.rgb * ringA, ringA);
        }

        // Soft glowing dot: bright core + wide halo.
        // NOTE: WGSL smoothstep is undefined when edge0 >= edge1, so all
        // falloffs are written as ascending-edge smoothsteps inverted by hand.
        var intensity = (1.0 - smoothstep(0.0, 1.0, d)) * 0.45; // halo
        intensity += 1.0 - smoothstep(0.0, 0.35, d);            // core

        // Subtle twinkle so dense particle fields shimmer instead of
        // looking like flat blobs.
        let twinkle = 0.9 + 0.1 * sin(uniforms.time * 12.0 + input.progress * 47.0);
        intensity *= twinkle;

        var alpha = input.color.a * intensity;
        if (input.mode == 0.0) {
          // Smoke/debris: cap density so clouds never wash out the playfield.
          alpha = min(alpha, input.color.a * 0.85);
        }

        return vec4<f32>(input.color.rgb * alpha, alpha);
      }
    `;

    const shaderModule = this.device.createShaderModule({ code: shaderCode });

    const vertex = {
      module: shaderModule,
      entryPoint: 'main',
      buffers: [
        {
          // Quad corner vertices (per-vertex)
          arrayStride: 8,
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }]
        },
        {
          // Per-instance particle data
          arrayStride: BYTES_PER_PARTICLE,
          stepMode: 'instance' as const,
          attributes: [
            { shaderLocation: 1, offset: 0, format: 'float32x2' },   // position
            { shaderLocation: 2, offset: 24, format: 'float32' },    // size
            { shaderLocation: 3, offset: 16, format: 'float32x2' },  // (life, maxLife)
            { shaderLocation: 4, offset: 32, format: 'float32x4' },  // color
            { shaderLocation: 5, offset: 28, format: 'float32' }     // mode
          ]
        }
      ]
    };

    const makePipeline = (blend: any, targetFormat: string) => this.device.createRenderPipeline({
      layout: 'auto',
      vertex,
      fragment: {
        module: shaderModule,
        entryPoint: 'main',
        targets: [{ format: targetFormat, blend }]
      },
      primitive: { topology: 'triangle-list' }
    });

    // Normal blending (premultiplied source-over) for smoke/debris.
    this.normalPipeline = makePipeline({
      color: {
        srcFactor: 'one',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add'
      },
      alpha: {
        srcFactor: 'one',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add'
      }
    }, 'rgba8unorm');

    // Pure additive blending for sparks/glow/rings: light accumulates, so
    // enemy bullets and ships stay readable through dense explosions.
    this.additivePipeline = makePipeline({
      color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
      alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' }
    }, 'rgba8unorm');

    this.createBloomPipelines();
  }

  /** Bloom post-processing pipelines (bright-pass, separable blur, composite). */
  private createBloomPipelines() {
    if (!this.device) return;
    try {
      const postCode = `
        struct Params {
          texel: vec2<f32>,
          dirOrThreshold: vec2<f32>,  // blur: (dirX, dirY) | bright: (threshold, 0)
        }
        @group(0) @binding(0) var<uniform> params: Params;
        @group(0) @binding(1) var samp: sampler;
        @group(0) @binding(2) var srcTex: texture_2d<f32>;

        struct VSOut {
          @builtin(position) pos: vec4<f32>,
          @location(0) uv: vec2<f32>,
        }

        // Fullscreen triangle-pair; corner already in clip space.
        @vertex fn vs_main(@location(0) corner: vec2<f32>) -> VSOut {
          var out: VSOut;
          out.pos = vec4<f32>(corner, 0.0, 1.0);
          out.uv = vec2<f32>(corner.x * 0.5 + 0.5, 0.5 - corner.y * 0.5);
          return out;
        }

        // Bright-pass: keep only pixels above the luminance threshold.
        @fragment fn fs_bright(input: VSOut) -> @location(0) vec4<f32> {
          let c = textureSample(srcTex, samp, input.uv);
          let l = dot(c.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));
          let f = max(l - params.dirOrThreshold.x, 0.0) / max(l, 0.0001);
          return vec4<f32>(c.rgb * f, c.a * f);
        }

        // Separable Gaussian blur (5-tap linear-sampler optimized kernel).
        @fragment fn fs_blur(input: VSOut) -> @location(0) vec4<f32> {
          let o = params.texel * params.dirOrThreshold;
          var color = textureSample(srcTex, samp, input.uv) * 0.2270270270;
          color += textureSample(srcTex, samp, input.uv + o * 1.3846153846) * 0.3162162162;
          color += textureSample(srcTex, samp, input.uv - o * 1.3846153846) * 0.3162162162;
          color += textureSample(srcTex, samp, input.uv + o * 3.2307692308) * 0.0702702703;
          color += textureSample(srcTex, samp, input.uv - o * 3.2307692308) * 0.0702702703;
          return color;
        }

        // Composite: particles + additive bloom glow. The output is
        // premultiplied so the 2D game canvas below shows through cleanly.
        struct CompParams { strength: vec4<f32> }
        @group(0) @binding(0) var<uniform> comp: CompParams;
        @group(0) @binding(1) var samp2: sampler;
        @group(0) @binding(2) var particleTex: texture_2d<f32>;
        @group(0) @binding(3) var bloomTex: texture_2d<f32>;

        @fragment fn fs_comp(input: VSOut) -> @location(0) vec4<f32> {
          let p = textureSample(particleTex, samp2, input.uv);
          let b = textureSample(bloomTex, samp2, input.uv);
          let glow = b.rgb * comp.strength.x;
          let glowA = max(glow.r, max(glow.g, glow.b));
          return vec4<f32>(p.rgb + glow, clamp(p.a + glowA, 0.0, 1.0));
        }
      `;

      const postModule = this.device.createShaderModule({ code: postCode });

      const fsVert = {
        module: postModule,
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 8,
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }]
        }]
      };

      const simpleBlend = {
        color: {
          srcFactor: 'one',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add'
        },
        alpha: {
          srcFactor: 'one',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add'
        }
      };

      this.brightPipeline = this.device.createRenderPipeline({
        layout: 'auto',
        vertex: fsVert,
        fragment: { module: postModule, entryPoint: 'fs_bright', targets: [{ format: 'rgba8unorm', blend: simpleBlend }] },
        primitive: { topology: 'triangle-list' }
      });

      this.blurPipeline = this.device.createRenderPipeline({
        layout: 'auto',
        vertex: fsVert,
        fragment: { module: postModule, entryPoint: 'fs_blur', targets: [{ format: 'rgba8unorm', blend: simpleBlend }] },
        primitive: { topology: 'triangle-list' }
      });

      // Composite writes to the canvas in its preferred format.
      this.compositePipeline = this.device.createRenderPipeline({
        layout: 'auto',
        vertex: fsVert,
        fragment: { module: postModule, entryPoint: 'fs_comp', targets: [{ format: this.format }] },
        primitive: { topology: 'triangle-list' }
      });

      this.sampler = this.device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
      });

      this.brightUniform = this.device.createBuffer({
        size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.blurUniformH = this.device.createBuffer({
        size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.blurUniformV = this.device.createBuffer({
        size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.compUniform = this.device.createBuffer({
        size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });

      this.bloomReady = true;
    } catch (e) {
      console.warn('Bloom pipelines unavailable, using direct rendering:', e);
      this.bloomReady = false;
    }
  }

  /** (Re)create offscreen render targets + their bind groups after resize. */
  private createBloomTargets() {
    if (!this.device || !this.bloomReady) return;
    try {
      this.particleTex?.destroy();
      this.bloomTexA?.destroy();
      this.bloomTexB?.destroy();

      const w = this.canvas.width;
      const h = this.canvas.height;
      const texUsage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;
      this.particleTex = this.device.createTexture({ size: { width: w, height: h }, format: 'rgba8unorm', usage: texUsage });
      const hw = Math.max(1, Math.ceil(w / 2));
      const hh = Math.max(1, Math.ceil(h / 2));
      this.bloomTexA = this.device.createTexture({ size: { width: hw, height: hh }, format: 'rgba8unorm', usage: texUsage });
      this.bloomTexB = this.device.createTexture({ size: { width: hw, height: hh }, format: 'rgba8unorm', usage: texUsage });

      // Bright-pass: threshold lives in dirOrThreshold.x
      const brightData = new Float32Array([1 / w, 1 / h, BLOOM_THRESHOLD, 0]);
      this.device.queue.writeBuffer(this.brightUniform!, 0, brightData);

      // Blur direction uniforms (texel size of the HALF-res target)
      const hx = 1 / hw, hy = 1 / hh;
      this.device.queue.writeBuffer(this.blurUniformH!, 0, new Float32Array([hx, hy, 1, 0]));
      this.device.queue.writeBuffer(this.blurUniformV!, 0, new Float32Array([hx, hy, 0, 1]));

      this.brightBG = this.device.createBindGroup({
        layout: this.brightPipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.brightUniform! } },
          { binding: 1, resource: this.sampler! },
          { binding: 2, resource: this.particleTex.createView() }
        ]
      });

      this.blurBGH = this.device.createBindGroup({
        layout: this.blurPipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.blurUniformH! } },
          { binding: 1, resource: this.sampler! },
          { binding: 2, resource: this.bloomTexA.createView() }
        ]
      });

      this.blurBGV = this.device.createBindGroup({
        layout: this.blurPipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.blurUniformV! } },
          { binding: 1, resource: this.sampler! },
          { binding: 2, resource: this.bloomTexB.createView() }
        ]
      });

      this.compBG = this.device.createBindGroup({
        layout: this.compositePipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.compUniform! } },
          { binding: 1, resource: this.sampler! },
          { binding: 2, resource: this.particleTex.createView() },
          { binding: 3, resource: this.bloomTexA.createView() }
        ]
      });
    } catch (e) {
      console.warn('Bloom targets unavailable, using direct rendering:', e);
      this.bloomReady = false;
    }
  }

  private createBuffers() {
    if (!this.device) return;

    // Quad corner vertices (two triangles)
    const quadVertices = new Float32Array([
      -1, -1,  // bottom left
       1, -1,  // bottom right
       1,  1,  // top right
      -1, -1,  // bottom left
       1,  1,  // top right
      -1,  1,  // top left
    ]);

    this.quadVertexBuffer = this.device.createBuffer({
      size: quadVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.quadVertexBuffer, 0, quadVertices);

    // Fullscreen quad for the post-processing passes (same layout, reused)
    this.fullscreenBuffer = this.device.createBuffer({
      size: quadVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.fullscreenBuffer, 0, quadVertices);

    // CPU staging buffer for uploading packed particle data
    this.particleStagingBuffer = this.device.createBuffer({
      size: this.maxParticles * BYTES_PER_PARTICLE,
      usage: GPUBufferUsage.COPY_DST,
    });

    // Instance vertex buffer (filled by copying from staging each frame)
    this.particleInstanceBuffer = this.device.createBuffer({
      size: this.maxParticles * BYTES_PER_PARTICLE,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // Uniform buffer: resolution(vec2) + time + pad (16 bytes)
    this.uniformBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.normalBindGroup = this.device.createBindGroup({
      layout: this.normalPipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } }
      ]
    });

    this.additiveBindGroup = this.device.createBindGroup({
      layout: this.additivePipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } }
      ]
    });
  }

  private packColor(color: string): [number, number, number] {
    const cached = this.colorCache.get(color);
    if (cached) return cached;

    let rgb: [number, number, number] = [255, 255, 255];
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        rgb = [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16)
        ];
      } else if (hex.length === 6) {
        rgb = [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }
    } else if (color.startsWith('rgb')) {
      const parts = color.replace(/rgba?\(|\)/g, '').split(',');
      rgb = [Number(parts[0]) || 255, Number(parts[1]) || 255, Number(parts[2]) || 255];
    }

    const normalized: [number, number, number] = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
    if (this.colorCache.size < 512) {
      this.colorCache.set(color, normalized);
    }
    return normalized;
  }

  private bloomActive(): boolean {
    return this.bloomWanted && this.bloomReady && !!this.particleTex && !!this.compBG;
  }

  render(particles: RenderParticle[], time: number) {
    if (!this.isInitialized || !this.device || !this.context) return;

    const count = Math.min(particles.length, this.maxParticles);
    const commandEncoder = this.device.createCommandEncoder();

    // Update uniforms: resolution.xy, time, pad
    const uniformData = new Float32Array([
      this.canvas.width,
      this.canvas.height,
      time,
      0
    ]);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

    let normalCount = 0;
    let additiveCount = 0;

    if (count > 0) {
      // Pack particle data on the CPU and upload via staging buffer.
      // Normal-blended particles are packed first, additive ones after, so
      // each pass can draw a contiguous range of the shared instance buffer.
      const cpuData = new Float32Array(count * FLOATS_PER_PARTICLE);
      const pack = (p: RenderParticle, o: number) => {
        const mode = modeForType(p.type);
        const [r, g, b] = this.packColor(p.color);
        cpuData[o] = p.x;
        cpuData[o + 1] = p.y;
        cpuData[o + 2] = p.vx;
        cpuData[o + 3] = p.vy;
        cpuData[o + 4] = p.life;
        cpuData[o + 5] = p.maxLife;
        cpuData[o + 6] = p.size;
        cpuData[o + 7] = mode;
        cpuData[o + 8] = r;
        cpuData[o + 9] = g;
        cpuData[o + 10] = b;
        // Rings drive their fade from life/maxLife in the shader, so their
        // base alpha stays 1; dots fade with remaining life.
        cpuData[o + 11] = mode === MODE_RING
          ? 1.0
          : Math.max(0, Math.min(1, p.life / (p.maxLife || 1)));
      };

      let writeIdx = 0;
      let n = 0;
      for (let i = 0; i < count; i++) {
        if (modeForType(particles[i].type) === MODE_NORMAL_DOT) n++;
      }
      normalCount = n;
      additiveCount = count - n;

      // Normal-blended particles first...
      for (let i = 0; i < count; i++) {
        if (modeForType(particles[i].type) === MODE_NORMAL_DOT) {
          pack(particles[i], writeIdx * FLOATS_PER_PARTICLE);
          writeIdx++;
        }
      }
      // ...then additive ones (sparks/glow/rings).
      for (let i = 0; i < count; i++) {
        if (modeForType(particles[i].type) !== MODE_NORMAL_DOT) {
          pack(particles[i], writeIdx * FLOATS_PER_PARTICLE);
          writeIdx++;
        }
      }

      this.device.queue.writeBuffer(this.particleStagingBuffer!, 0, cpuData.buffer, 0, cpuData.byteLength);
      commandEncoder.copyBufferToBuffer(
        this.particleStagingBuffer!, 0,
        this.particleInstanceBuffer!, 0,
        count * BYTES_PER_PARTICLE
      );
    }

    const useBloom = count > 0 && this.bloomActive();

    // Particle render pass — into the offscreen texture when bloom is on,
    // directly onto the canvas otherwise (transparent clear either way).
    const particleTarget = useBloom
      ? this.particleTex!.createView()
      : this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: particleTarget,
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });

    if (count > 0) {
      // Pass 1: normal-blended particles (smoke/debris) under the glow.
      if (normalCount > 0) {
        renderPass.setPipeline(this.normalPipeline!);
        renderPass.setBindGroup(0, this.normalBindGroup!);
        renderPass.setVertexBuffer(0, this.quadVertexBuffer!);
        renderPass.setVertexBuffer(1, this.particleInstanceBuffer!, 0);
        renderPass.draw(6, normalCount, 0, 0);
      }

      // Pass 2: additive particles (sparks/glow/rings) on top.
      if (additiveCount > 0) {
        renderPass.setPipeline(this.additivePipeline!);
        renderPass.setBindGroup(0, this.additiveBindGroup!);
        renderPass.setVertexBuffer(0, this.quadVertexBuffer!);
        renderPass.setVertexBuffer(
          1,
          this.particleInstanceBuffer!,
          normalCount * BYTES_PER_PARTICLE
        );
        renderPass.draw(6, additiveCount, 0, 0);
      }
    }

    renderPass.end();

    // Bloom chain: bright-pass -> horizontal blur -> vertical blur -> composite.
    if (useBloom) {
      // Bright-pass + downsample: full-res particles -> half-res ping.
      const brightPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: this.bloomTexA!.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store'
        }]
      });
      brightPass.setPipeline(this.brightPipeline!);
      brightPass.setBindGroup(0, this.brightBG!);
      brightPass.setVertexBuffer(0, this.fullscreenBuffer!);
      brightPass.draw(6, 1, 0, 0);
      brightPass.end();

      // Horizontal blur: ping -> pong.
      const blurHPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: this.bloomTexB!.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store'
        }]
      });
      blurHPass.setPipeline(this.blurPipeline!);
      blurHPass.setBindGroup(0, this.blurBGH!);
      blurHPass.setVertexBuffer(0, this.fullscreenBuffer!);
      blurHPass.draw(6, 1, 0, 0);
      blurHPass.end();

      // Vertical blur: pong -> ping (ping now holds the final glow).
      const blurVPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: this.bloomTexA!.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store'
        }]
      });
      blurVPass.setPipeline(this.blurPipeline!);
      blurVPass.setBindGroup(0, this.blurBGV!);
      blurVPass.setVertexBuffer(0, this.fullscreenBuffer!);
      blurVPass.draw(6, 1, 0, 0);
      blurVPass.end();

      // Composite particles + glow onto the visible canvas.
      this.device.queue.writeBuffer(this.compUniform!, 0, new Float32Array([BLOOM_STRENGTH, 0, 0, 0]));
      const compPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store'
        }]
      });
      compPass.setPipeline(this.compositePipeline!);
      compPass.setBindGroup(0, this.compBG!);
      compPass.setVertexBuffer(0, this.fullscreenBuffer!);
      compPass.draw(6, 1, 0, 0);
      compPass.end();
    }

    this.device.queue.submit([commandEncoder.finish()]);
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  dispose() {
    this.quadVertexBuffer?.destroy();
    this.fullscreenBuffer?.destroy();
    this.particleStagingBuffer?.destroy();
    this.particleInstanceBuffer?.destroy();
    this.uniformBuffer?.destroy();
    this.particleTex?.destroy();
    this.bloomTexA?.destroy();
    this.bloomTexB?.destroy();
    this.brightUniform?.destroy();
    this.blurUniformH?.destroy();
    this.blurUniformV?.destroy();
    this.compUniform?.destroy();
    this.isInitialized = false;
  }
}
