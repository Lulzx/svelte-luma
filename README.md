# svelte-luma

High-performance WebGL2/WebGPU bindings for Svelte 5, powered by [luma.gl](https://luma.gl).

## Features

- **Declarative 3D** - Build GPU-accelerated scenes with Svelte components
- **Svelte 5** - Built with runes (`$state`, `$derived`, `$effect`)
- **Dual Backend** - WebGPU when available, WebGL2 fallback
- **Reactive** - Uniforms and bindings update automatically
- **Batteries Included** - Geometries, shaders, and math utilities
- **TypeScript** - Fully typed

## Installation

```bash
npm install svelte-luma
```

WebGPU support (`@luma.gl/webgpu`) is included as an optional dependency and will be used automatically when available.

## Quick Start

```svelte
<script lang="ts">
  import { Canvas, Model } from 'svelte-luma';

  const VS = `#version 300 es
  const vec2 pos[3] = vec2[3](vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));
  void main() {
    gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
  }`;

  const FS = `#version 300 es
  precision highp float;
  out vec4 fragColor;
  void main() {
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }`;
</script>

<Canvas width={800} height={600} clearColor={[0.1, 0.1, 0.1, 1]}>
  <Model
    vs={VS}
    fs={FS}
    topology="triangle-list"
    vertexCount={3}
    shaderLayout={{ attributes: [], bindings: [] }}
  />
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
  ondevicecreated={(device) => {}}
  onframe={(ctx) => {}}
  onerror={(err) => {}}
>
  {children}
</Canvas>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `800` | Canvas width |
| `height` | `number` | `600` | Canvas height |
| `pixelRatio` | `number` | `devicePixelRatio` | Pixel density |
| `backend` | `'webgl' \| 'webgpu' \| 'best'` | `'best'` | Rendering backend |
| `clearColor` | `[r, g, b, a]` | `[0,0,0,1]` | Background color |
| `autoClear` | `boolean` | `true` | Clear each frame |

### Model

Low-level component for rendering with shaders.

```svelte
<Model
  vs={vertexShader}
  fs={fragmentShader}
  topology="triangle-list"
  vertexCount={3}
  uniforms={{ uColor: [1, 0, 0, 1] }}
/>
```

### Mesh

Higher-level component with transform support.

```svelte
<Mesh
  geometry={createCubeGeometry()}
  vs={VS}
  fs={FS}
  position={[0, 0, 0]}
  rotation={[0, Math.PI / 4, 0]}
  scale={[1, 1, 1]}
/>
```

### Scene

Container that provides projection/view matrices to children.

```svelte
<Scene projectionMatrix={projection} viewMatrix={view}>
  <Mesh ... />
</Scene>
```

### OrbitCamera

Interactive camera with drag and zoom.

```svelte
<OrbitCamera
  distance={5}
  rotationX={0}
  rotationY={0}
  target={[0, 0, 0]}
  fov={60}
  enableDrag={true}
  enableZoom={true}
>
  <Mesh ... />
</OrbitCamera>
```

### Buffer / Texture

GPU resource components.

```svelte
<Buffer data={new Float32Array([...])} onbuffercreated={(buf) => {}} />
<Texture src="/image.png" ontextureloaded={(tex) => {}} />
```

## Hooks

```typescript
import { useDevice, useFrame, useRender, useViewport, useMouse } from 'svelte-luma';

const getDevice = useDevice();

useFrame((time, deltaTime) => {
  // Called every frame
});

useRender(() => {
  // Custom render callback
});

const getViewport = useViewport();  // { width, height, pixelRatio }
const getMouse = useMouse();        // { x, y, normalizedX, normalizedY, buttons, isOver }
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
```

Returns `GeometryData`:

```typescript
interface GeometryData {
  positions: Float32Array;
  normals?: Float32Array;
  texCoords?: Float32Array;
  indices?: Uint16Array;
  colors?: Float32Array;
}
```

## Shaders

Pre-built GLSL shaders:

```typescript
import {
  BASIC_VS_GLSL, BASIC_FS_GLSL,
  TEXTURED_VS_GLSL, TEXTURED_FS_GLSL,
  PHONG_VS_GLSL, PHONG_FS_GLSL,
  GRADIENT_VS_GLSL, GRADIENT_FS_GLSL,
  INSTANCED_VS_GLSL, INSTANCED_FS_GLSL,
  SIMPLE_TRIANGLE_WGSL
} from 'svelte-luma';
```

## Math Utilities

```typescript
import {
  degToRad, radToDeg, clamp, lerp,
  createIdentityMatrix,
  createPerspectiveMatrix,
  createOrthographicMatrix,
  createLookAtMatrix,
  createRotationMatrixX,
  createRotationMatrixY,
  createRotationMatrixZ,
  createTranslationMatrix,
  createScaleMatrix,
  multiplyMatrices
} from 'svelte-luma';

const projection = createPerspectiveMatrix(degToRad(60), aspect, 0.1, 1000);
const view = createLookAtMatrix([0, 5, 10], [0, 0, 0], [0, 1, 0]);
```

## Examples

### Animated Color

```svelte
<script lang="ts">
  import { Canvas, Model, SIMPLE_TRIANGLE_VS_GLSL, SIMPLE_TRIANGLE_FS_GLSL } from 'svelte-luma';

  let time = $state(0);
  const color = $derived([
    Math.sin(time * 0.001) * 0.5 + 0.5,
    Math.cos(time * 0.002) * 0.5 + 0.5,
    Math.sin(time * 0.003) * 0.5 + 0.5,
    1.0
  ]);
</script>

<Canvas onframe={(ctx) => time = ctx.time}>
  <Model
    vs={SIMPLE_TRIANGLE_VS_GLSL}
    fs={SIMPLE_TRIANGLE_FS_GLSL}
    vertexCount={3}
    uniforms={{ uColor: color }}
  />
</Canvas>
```

### Spinning Cube

```svelte
<script lang="ts">
  import { Canvas, Scene, Mesh, OrbitCamera, createCubeGeometry } from 'svelte-luma';

  const cube = createCubeGeometry(1);
  let rotation = $state([0, 0, 0]);
</script>

<Canvas onframe={(ctx) => rotation = [0, ctx.time * 0.001, 0]}>
  <Scene>
    <OrbitCamera distance={5}>
      <Mesh geometry={cube} vs={VS} fs={FS} rotation={rotation} />
    </OrbitCamera>
  </Scene>
</Canvas>
```

### GPU Instancing

```svelte
<script lang="ts">
  import { Canvas } from 'svelte-luma';
  import { Model, Geometry } from '@luma.gl/engine';

  const INSTANCE_COUNT = 1000;
  const instancePositions = new Float32Array(INSTANCE_COUNT * 3);
  const instanceColors = new Float32Array(INSTANCE_COUNT * 4);

  let model;

  function handleDeviceCreated(device) {
    const geometry = new Geometry({
      attributes: {
        positions: { size: 3, value: positions },
        instancePositions: { size: 3, value: instancePositions, divisor: 1 },
        instanceColors: { size: 4, value: instanceColors, divisor: 1 }
      }
    });

    model = new Model(device, { vs, fs, geometry, instanceCount: INSTANCE_COUNT });
  }
</script>

<Canvas ondevicecreated={handleDeviceCreated} onframe={render} />
```

## Types

```typescript
import type {
  Backend,
  CanvasProps,
  ModelComponentProps,
  GeometryData,
  AnimationContext,
  RenderCallback
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
