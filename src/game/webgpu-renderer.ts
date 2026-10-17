// WebGPU Renderer for ATHERIA: VOID BREAKER
// Renders game particles on a dedicated transparent overlay canvas using
// instanced quads. Physics integration stays on the CPU (single source of
// truth for positions); the GPU accelerates the rendering of up to 10k
// particles.
//
// Visual quality (v2):
//  - soft radial particles with bright core + wide halo (no more flat squares)
//  - additive blending for sparks/glow (light adds up; bullets stay readable
//    through dense explosions — per "Anatomy of a Shmup" visibility rules)
//  - normal (premultiplied) blending for smoke/debris
//  - expanding shockwave rings for explosions
//  - subtle per-particle twinkle driven by a time uniform
declare const GPUBufferUsage: any;

type GPUDevice = any;
type GPUCanvasContext = any;
type GPUTextureFormat = string;
type GPURenderPipeline = any;
type GPUBuffer = any;
type GPUBindGroup = any;

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

export class WebGPURenderer {
  private canvas: HTMLCanvasElement;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = 'bgra8unorm';

  private normalPipeline: GPURenderPipeline | null = null;
  private additivePipeline: GPURenderPipeline | null = null;

  private quadVertexBuffer: GPUBuffer | null = null;
  private particleStagingBuffer: GPUBuffer | null = null;
  private particleInstanceBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;

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
      console.log('WebGPU initialized successfully');
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

    const makePipeline = (blend: any) => this.device.createRenderPipeline({
      layout: 'auto',
      vertex,
      fragment: {
        module: shaderModule,
        entryPoint: 'main',
        targets: [{ format: this.format, blend }]
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
    });

    // Pure additive blending for sparks/glow/rings: light accumulates, so
    // enemy bullets and ships stay readable through dense explosions.
    this.additivePipeline = makePipeline({
      color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
      alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' }
    });
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

    // Render pass - transparent clear so the 2D game canvas shows through
    const textureView = this.context.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
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
    this.device.queue.submit([commandEncoder.finish()]);
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  dispose() {
    this.quadVertexBuffer?.destroy();
    this.particleStagingBuffer?.destroy();
    this.particleInstanceBuffer?.destroy();
    this.uniformBuffer?.destroy();
    this.isInitialized = false;
  }
}
