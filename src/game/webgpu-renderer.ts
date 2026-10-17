// WebGPU Renderer for ATHERIA: VOID BREAKER
// Renders game particles on a dedicated transparent overlay canvas using
// instanced quads. Physics integration stays on the CPU (single source of
// truth for positions); the GPU accelerates the rendering of up to 10k
// particles.
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
// [0]=x [1]=y [2]=vx [3]=vy [4]=life [5]=maxLife [6]=size [7]=pad
// [8]=r [9]=g [10]=b [11]=a   -> 48 bytes per particle
const FLOATS_PER_PARTICLE = 12;
const BYTES_PER_PARTICLE = FLOATS_PER_PARTICLE * 4;

export class WebGPURenderer {
  private canvas: HTMLCanvasElement;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = 'bgra8unorm';

  private particlePipeline: GPURenderPipeline | null = null;

  private quadVertexBuffer: GPUBuffer | null = null;
  private particleStagingBuffer: GPUBuffer | null = null;
  private particleInstanceBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;

  private particleBindGroup: GPUBindGroup | null = null;

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

    // Vertex shader for instanced particle quads
    const vertexShader = `
      struct VertexInput {
        @location(0) corner: vec2<f32>,
        @location(1) position: vec2<f32>,
        @location(2) size: f32,
        @location(3) color: vec4<f32>,
      }

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) color: vec4<f32>,
      }

      struct Uniforms {
        resolution: vec2<f32>,
        time: f32,
        pad: f32,
      }

      @group(0) @binding(0) var<uniform> uniforms: Uniforms;

      @vertex
      fn main(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;

        let worldPos = input.position + input.corner * input.size;
        let clipPos = vec2<f32>(
          (worldPos.x / uniforms.resolution.x) * 2.0 - 1.0,
          1.0 - (worldPos.y / uniforms.resolution.y) * 2.0
        );

        output.position = vec4<f32>(clipPos, 0.0, 1.0);
        // Fade out as life runs out; premultiplied alpha
        let a = input.color.a;
        output.color = vec4<f32>(input.color.rgb * a, a);

        return output;
      }
    `;

    const fragmentShader = `
      struct FragmentInput {
        @location(0) color: vec4<f32>,
      }

      @fragment
      fn main(input: FragmentInput) -> @location(0) vec4<f32> {
        return input.color;
      }
    `;

    this.particlePipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.device.createShaderModule({ code: vertexShader }),
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
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 1, offset: 0, format: 'float32x2' },   // position
              { shaderLocation: 2, offset: 24, format: 'float32' },    // size
              { shaderLocation: 3, offset: 32, format: 'float32x4' }   // color
            ]
          }
        ]
      },
      fragment: {
        module: this.device.createShaderModule({ code: fragmentShader }),
        entryPoint: 'main',
        targets: [{
          format: this.format,
          blend: {
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
          }
        }]
      },
      primitive: {
        topology: 'triangle-list'
      }
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

    this.particleBindGroup = this.device.createBindGroup({
      layout: this.particlePipeline!.getBindGroupLayout(0),
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

    if (count > 0) {
      // Pack particle data on the CPU and upload via staging buffer
      const cpuData = new Float32Array(count * FLOATS_PER_PARTICLE);
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        const o = i * FLOATS_PER_PARTICLE;
        const [r, g, b] = this.packColor(p.color);
        cpuData[o] = p.x;
        cpuData[o + 1] = p.y;
        cpuData[o + 2] = p.vx;
        cpuData[o + 3] = p.vy;
        cpuData[o + 4] = p.life;
        cpuData[o + 5] = p.maxLife;
        cpuData[o + 6] = p.size;
        cpuData[o + 7] = 0; // WGSL struct padding
        cpuData[o + 8] = r;
        cpuData[o + 9] = g;
        cpuData[o + 10] = b;
        cpuData[o + 11] = Math.max(0, Math.min(1, p.life / (p.maxLife || 1)));
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
      renderPass.setPipeline(this.particlePipeline!);
      renderPass.setBindGroup(0, this.particleBindGroup!);
      renderPass.setVertexBuffer(0, this.quadVertexBuffer!);
      renderPass.setVertexBuffer(1, this.particleInstanceBuffer!);
      renderPass.draw(6, count, 0, 0);
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
