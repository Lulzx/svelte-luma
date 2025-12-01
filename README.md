# svelte-luma

High-performance WebGL2/WebGPU bindings for Svelte 5, powered by [luma.gl](https://luma.gl).

## Features

- **Declarative 3D** - Build GPU-accelerated scenes with Svelte components
- **Svelte 5** - Built with runes (`$state`, `$effect`, `$props`)
- **Dual Backend** - WebGPU when available, WebGL2 fallback
- **Unified State** - Single reactive state system with priority-based rendering
- **Transform Hierarchy** - Group components for nested transforms
- **Lighting System** - Point, directional, ambient, and spot lights
- **GPU Instancing** - Efficient batch rendering with InstancedMesh
- **Material System** - Pre-built materials (Basic, Normal, Phong, Lambert)
- **Matrix Pooling** - Zero per-frame allocations for transforms
- **TypeScript** - Fully typed

## Installation

```bash
npm install svelte-luma
```

WebGPU support (`@luma.gl/webgpu`) is included as an optional dependency and will be used automatically when available.

## Quick Start

```svelte
<script lang="ts">
  import { Canvas, Mesh, OrbitCamera, createCubeGeometry, createPhongMaterial } from 'svelte-luma';

  const cube = createCubeGeometry(1);
  const { vs, fs } = createPhongMaterial({ color: [0.8, 0.2, 0.2] });

  let rotation = $state<[number, number, number]>([0, 0, 0]);
</script>

<Canvas
  width={800}
  height={600}
  clearColor={[0.1, 0.1, 0.1, 1]}
  onframe={(ctx) => rotation = [0, ctx.time * 0.001, 0]}
>
  <OrbitCamera distance={5}>
    <Mesh geometry={cube} vs={vs} fs={fs} {rotation} />
  </OrbitCamera>
</Canvas>
```

## Components

### Canvas

Root component that initializes the GPU device and render loop.

```svelte
<Canvas
  width={800}
  height={600}
  pixelRatio={window.devicePixelRatio}
  backend="best"
  clearColor={[0, 0, 0, 1]}
  autoClear={true}
  antialias={true}
  ondevicecreated={(device) => {}}
  onframe={(ctx) => {}}
  onerror={(err) => {}}
>
  {children}
</Canvas>
```

### Mesh

Renderable component with transforms and material support.

```svelte
<Mesh
  geometry={createCubeGeometry()}
  vs={vertexShader}
  fs={fragmentShader}
  position={[0, 0, 0]}
  rotation={[0, Math.PI / 4, 0]}
  scale={[1, 1, 1]}
  uniforms={{ uColor: [1, 0, 0, 1] }}
  visible={true}
  renderOrder={100}
/>
```

### Group

Transform hierarchy container. Children inherit the group's transform.

```svelte
<Group position={[0, 2, 0]} rotation={[0, time, 0]}>
  <Mesh geometry={cube} vs={vs} fs={fs} />
  <Group position={[2, 0, 0]}>
    <Mesh geometry={sphere} vs={vs} fs={fs} />
  </Group>
</Group>
```

### InstancedMesh

Efficient GPU instancing for rendering many objects.

```svelte
<script>
  const instances = Array.from({ length: 1000 }, (_, i) => ({
    position: [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5],
    rotation: [0, 0, 0],
    scale: [0.1, 0.1, 0.1],
    color: [Math.random(), Math.random(), Math.random(), 1]
  }));
</script>

<InstancedMesh
  geometry={createSphereGeometry(1)}
  vs={INSTANCED_MATERIAL_VS}
  fs={INSTANCED_MATERIAL_FS}
  count={1000}
  {instances}
/>
```

### OrbitCamera

Interactive camera with drag and zoom controls.

```svelte
<OrbitCamera
  distance={5}
  rotationX={0}
  rotationY={0}
  target={[0, 0, 0]}
  fov={60}
  near={0.1}
  far={1000}
  enableDrag={true}
  enableZoom={true}
  zoomSpeed={0.1}
  rotationSpeed={0.01}
  minDistance={1}
  maxDistance={100}
  damping={0}
>
  <Mesh ... />
</OrbitCamera>
```

### Lights

```svelte
<PointLight position={[5, 5, 5]} color={[1, 1, 1]} intensity={1} />
<DirectionalLight direction={[0, -1, 0]} color={[1, 1, 1]} intensity={0.5} />
<AmbientLight color={[0.2, 0.2, 0.2]} intensity={1} />
<SpotLight position={[0, 5, 0]} direction={[0, -1, 0]} angle={Math.PI / 6} />
```

### RenderLoop

Access frame timing in children.

```svelte
<RenderLoop onframe={(ctx) => console.log(ctx.time)}>
  {#snippet children(ctx)}
    <Mesh uniforms={{ uTime: ctx.time }} ... />
  {/snippet}
</RenderLoop>
```

### Buffer / Texture

GPU resource components.

```svelte
<Buffer data={new Float32Array([...])} onbuffercreated={(buf) => {}} />
<Texture src="/image.png" ontextureloaded={(tex) => {}} />
```

## Hooks

```typescript
import {
  useDevice,
  useReady,
  useFrame,
  useFrameCallback,
  useRender,
  useViewport,
  useMouse,
  useScene,
  useParentTransform,
  useLights,
  useBuffer,
  useTexture,
  useAnimatedValue,
  useSpring
} from 'svelte-luma';

// Get the GPU device
const device = useDevice();
console.log(device.current); // Device | null

// Check if ready
const ready = useReady();
if (ready.value) { ... }

// Frame timing
const frame = useFrame();
console.log(frame.time, frame.deltaTime, frame.frameCount);

// Register frame callback with priority
useFrameCallback((time, deltaTime) => {
  // Called every frame
}, { priority: 100 });

// Custom render callback
const { unregister } = useRender(() => {
  // Render something
}, priority);

// Viewport info
const viewport = useViewport();
console.log(viewport.width, viewport.height, viewport.aspect);

// Mouse state
const mouse = useMouse();
console.log(mouse.x, mouse.y, mouse.normalizedX, mouse.normalizedY);

// Scene matrices (when inside OrbitCamera/Scene)
const scene = useScene();
console.log(scene.projectionMatrix, scene.viewMatrix, scene.cameraPosition);

// Animation helpers
const animated = useAnimatedValue((time) => Math.sin(time * 0.001), 0);
const spring = useSpring(() => targetValue, { stiffness: 0.1, damping: 0.8 });
```

## Materials

Pre-built material factories:

```typescript
import {
  createBasicMaterial,
  createNormalMaterial,
  createPhongMaterial,
  createLambertMaterial,
  createInstancedMaterial
} from 'svelte-luma';

// Basic flat color
const basic = createBasicMaterial({ color: [1, 0, 0] });

// Normal visualization
const normal = createNormalMaterial();

// Phong lighting
const phong = createPhongMaterial({
  color: [0.8, 0.2, 0.2],
  ambient: [0.1, 0.1, 0.1],
  specular: [1, 1, 1],
  shininess: 32
});

// Lambert diffuse
const lambert = createLambertMaterial({ color: [0.5, 0.5, 0.8] });

// For instanced rendering
const instanced = createInstancedMaterial();

// Use in Mesh
<Mesh geometry={cube} vs={phong.vs} fs={phong.fs} />
```

## Geometries

```typescript
import {
  createTriangleGeometry,
  createQuadGeometry,
  createPlaneGeometry,
  createCubeGeometry,
  createSphereGeometry,
  createCircleGeometry,
  createCylinderGeometry,
  createTorusGeometry
} from 'svelte-luma';

const cube = createCubeGeometry(1);
const sphere = createSphereGeometry(1, 32, 16);
const torus = createTorusGeometry(1, 0.4, 32, 64);
const plane = createPlaneGeometry(10, 10, 10, 10);
const cylinder = createCylinderGeometry(0.5, 0.5, 2, 32);
```

## Math Utilities

```typescript
import {
  // Vector operations
  vec3, vec3Add, vec3Sub, vec3Scale, vec3Dot, vec3Cross,
  vec3Length, vec3Normalize, vec3Lerp,

  // Scalar utilities
  degToRad, radToDeg, clamp, lerp, smoothstep,

  // Matrix creation (uses internal pool - zero allocations)
  mat4Identity, mat4Perspective, mat4Orthographic, mat4LookAt,
  mat4Translation, mat4Scaling, mat4RotationX, mat4RotationY, mat4RotationZ,
  mat4FromEuler, mat4FromQuaternion, mat4Compose,

  // Matrix operations
  mat4Multiply, mat4Invert, mat4Transpose,
  mat4TransformPoint, mat4TransformDirection,

  // Create persistent copies (allocates new array)
  mat4Clone, mat4Copy
} from 'svelte-luma';

const projection = mat4Clone(mat4Perspective(degToRad(60), aspect, 0.1, 1000));
const view = mat4Clone(mat4LookAt([0, 5, 10], [0, 0, 0], [0, 1, 0]));
```

## Render Layers

Control render order with priority constants:

```typescript
import { RenderLayers } from 'svelte-luma';

// Built-in priorities
RenderLayers.BACKGROUND  // 0
RenderLayers.OPAQUE      // 100
RenderLayers.TRANSPARENT // 200
RenderLayers.OVERLAY     // 300
RenderLayers.UI          // 400

// Use in Mesh
<Mesh renderOrder={RenderLayers.TRANSPARENT} ... />
```

## State Management

Access the unified state directly:

```typescript
import { getLumaState, LumaState } from 'svelte-luma';

// Inside a component (must be child of Canvas)
const state = getLumaState();

// Read reactive state
state.device        // GPU device
state.ready         // boolean
state.frame         // { time, deltaTime, frameCount }
state.viewport      // { width, height, pixelRatio, aspect }
state.mouse         // { x, y, normalizedX, normalizedY, buttons, isOver, isDragging }
state.scene         // { projectionMatrix, viewMatrix, cameraPosition }
state.parentTransform // Parent group's world matrix

// Light management
state.addLight(id, lightData);
state.updateLight(id, partialData);
state.removeLight(id);
state.getLightsArray();

// Render callbacks
const id = state.addRenderCallback(callback, priority);
state.removeRenderCallback(id);
```

## Shaders

Pre-built GLSL shaders:

```typescript
import {
  BASIC_VS_GLSL, BASIC_FS_GLSL,
  TEXTURED_VS_GLSL, TEXTURED_FS_GLSL,
  NORMAL_VS_GLSL, NORMAL_FS_GLSL,
  PHONG_VS_GLSL, PHONG_FS_GLSL,
  GRADIENT_VS_GLSL, GRADIENT_FS_GLSL,
  INSTANCED_VS_GLSL, INSTANCED_FS_GLSL,
  SIMPLE_TRIANGLE_VS_GLSL, SIMPLE_TRIANGLE_FS_GLSL,
  SIMPLE_TRIANGLE_WGSL
} from 'svelte-luma';
```

## Types

```typescript
import type {
  Backend,
  CanvasProps,
  ModelComponentProps,
  GeometryData,
  AnimationContext,
  BufferProps,
  TextureProps,
  FrameState,
  ViewportState,
  MouseState,
  SceneState,
  LightState,
  RenderPriority,
  RenderCallback,
  Vec3, Vec4, Mat4
} from 'svelte-luma';
```

## Browser Support

| Backend | Support |
|---------|---------|
| WebGPU | Chrome 113+, Edge 113+, Firefox (flag) |
| WebGL2 | All modern browsers |

The library auto-selects the best backend.

## Development

```bash
npm install
npm run dev        # Start dev server
npm run package    # Build library
npm run check      # Type check
```

## License

MIT

## Credits

Built on [luma.gl](https://luma.gl) by vis.gl.
