// WebGPU Renderer for ATHERIA: VOID BREAKER
// Type declarations for WebGPU API
declare const GPUBufferUsage: any;
declare const GPUMapMode: any;

type GPUDevice = any;
type GPUCanvasContext = any;
type GPUTextureFormat = string;
type GPURenderPipeline = any;
type GPUComputePipeline = any;
type GPUBuffer = any;
type GPUBindGroup = any;

export class WebGPURenderer {
  private canvas: HTMLCanvasElement;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = 'bgra8unorm';
  
  // Pipelines
  private particlePipeline: GPURenderPipeline | null = null;
  private computePipeline: GPUComputePipeline | null = null;
  
  // Buffers
  private particleVertexBuffer: GPUBuffer | null = null;
  private particleStorageBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  
  // Bind groups
  private particleBindGroup: GPUBindGroup | null = null;
  private computeBindGroup: GPUBindGroup | null = null;
  
  // State
  private maxParticles = 10000;
  private particleCount = 0;
  private isInitialized = false;

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

      await this.createPipelines();
      await this.createBuffers();
      
      this.isInitialized = true;
      console.log('WebGPU initialized successfully');
      return true;
    } catch (e) {
      console.error('WebGPU initialization failed:', e);
      return false;
    }
  }

  private async createPipelines() {
    if (!this.device) return;

    // Vertex shader for particles
    const vertexShader = `
      struct VertexInput {
        @location(0) position: vec2<f32>,
        @location(1) offset: vec2<f32>,
        @location(2) size: f32,
        @location(3) color: vec4<f32>,
      }

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) color: vec4<f32>,
      }

      @group(0) @binding(0) var<uniform> uniforms: Uniforms;

      struct Uniforms {
        resolution: vec2<f32>,
        time: f32,
      }

      @vertex
      fn main(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        
        // Convert particle position to clip space
        let worldPos = input.offset + input.position * input.size;
        let clipPos = vec2<f32>(
          (worldPos.x / uniforms.resolution.x) * 2.0 - 1.0,
          1.0 - (worldPos.y / uniforms.resolution.y) * 2.0
        );
        
        output.position = vec4<f32>(clipPos, 0.0, 1.0);
        output.color = input.color;
        
        return output;
      }
    `;

    // Fragment shader for particles
    const fragmentShader = `
      struct FragmentInput {
        @location(0) color: vec4<f32>,
      }

      @fragment
      fn main(input: FragmentInput) -> @location(0) vec4<f32> {
        return input.color;
      }
    `;

    // Particle render pipeline
    this.particlePipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.device.createShaderModule({ code: vertexShader }),
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 8, // position
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }]
          },
          {
            arrayStride: 32, // offset + size + color
            attributes: [
              { shaderLocation: 1, offset: 0, format: 'float32x2' },
              { shaderLocation: 2, offset: 8, format: 'float32' },
              { shaderLocation: 3, offset: 12, format: 'float32x4' }
            ]
          }
        ]
      },
      fragment: {
        module: this.device.createShaderModule({ code: fragmentShader }),
        entryPoint: 'main',
        targets: [{ format: this.format }]
      },
      primitive: {
        topology: 'triangle-list'
      }
    });

    // Compute shader for particle physics
    const computeShader = `
      struct Particle {
        position: vec2<f32>,
        velocity: vec2<f32>,
        life: f32,
        maxLife: f32,
        size: f32,
        color: vec4<f32>,
      }

      struct ParticleSystem {
        deltaTime: f32,
        gravity: vec2<f32>,
        friction: f32,
      }

      @group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
      @group(0) @binding(1) var<uniform> system: ParticleSystem;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let index = id.x;
        if (index >= arrayLength(&particles)) {
          return;
        }

        var particle = particles[index];
        
        // Update life
        particle.life -= system.deltaTime;
        if (particle.life <= 0.0) {
          return;
        }

        // Apply gravity
        particle.velocity += system.gravity * system.deltaTime;
        
        // Apply friction
        particle.velocity *= system.friction;
        
        // Update position
        particle.position += particle.velocity * system.deltaTime;

        particles[index] = particle;
      }
    `;

    this.computePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({ code: computeShader }),
        entryPoint: 'main'
      }
    });
  }

  private async createBuffers() {
    if (!this.device) return;

    // Particle vertex buffer (quad vertices)
    const quadVertices = new Float32Array([
      -1, -1,  // bottom left
       1, -1,  // bottom right
       1,  1,  // top right
      -1, -1,  // bottom left
       1,  1,  // top right
      -1,  1,  // top left
    ]);

    this.particleVertexBuffer = this.device.createBuffer({
      size: quadVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.particleVertexBuffer, 0, quadVertices);

    // Particle storage buffer
    const particleDataSize = 48; // 2 + 2 + 4 + 4 + 4 * 4 bytes per particle
    this.particleStorageBuffer = this.device.createBuffer({
      size: this.maxParticles * particleDataSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Uniform buffer
    this.uniformBuffer = this.device.createBuffer({
      size: 16, // vec2<f32> + f32 + padding
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create bind groups
    this.particleBindGroup = this.device.createBindGroup({
      layout: this.particlePipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } }
      ]
    });

    this.computeBindGroup = this.device.createBindGroup({
      layout: this.computePipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleStorageBuffer } },
        { binding: 1, resource: { buffer: this.uniformBuffer } }
      ]
    });
  }

  render(particles: any[], time: number) {
    if (!this.isInitialized || !this.device || !this.context) return;

    const commandEncoder = this.device.createCommandEncoder();

    // Update uniforms
    const uniformData = new Float32Array([
      this.canvas.width,
      this.canvas.height,
      time,
      0 // padding
    ]);
    this.device.queue.writeBuffer(this.uniformBuffer!, 0, uniformData);

    // Update particle data
    if (particles.length > 0) {
      const particleData = new Float32Array(particles.length * 12);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const offset = i * 12;
        particleData[offset] = p.x;
        particleData[offset + 1] = p.y;
        particleData[offset + 2] = p.vx;
        particleData[offset + 3] = p.vy;
        particleData[offset + 4] = p.life;
        particleData[offset + 5] = p.maxLife;
        particleData[offset + 6] = p.size;
        // Color (simplified)
        particleData[offset + 7] = 1;
        particleData[offset + 8] = 1;
        particleData[offset + 9] = 1;
        particleData[offset + 10] = p.life / p.maxLife;
      }
      this.device.queue.writeBuffer(this.particleStorageBuffer!, 0, particleData);

      // Compute pass
      const computePass = commandEncoder.beginComputePass();
      computePass.setPipeline(this.computePipeline!);
      computePass.setBindGroup(0, this.computeBindGroup!);
      computePass.dispatchWorkgroups(Math.ceil(particles.length / 64));
      computePass.end();
    }

    // Render pass
    const textureView = this.context.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });

    if (particles.length > 0) {
      renderPass.setPipeline(this.particlePipeline!);
      renderPass.setBindGroup(0, this.particleBindGroup!);
      renderPass.setVertexBuffer(0, this.particleVertexBuffer!);
      renderPass.draw(6, particles.length, 0, 0);
    }

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  dispose() {
    this.particleVertexBuffer?.destroy();
    this.particleStorageBuffer?.destroy();
    this.uniformBuffer?.destroy();
    this.isInitialized = false;
  }
}
