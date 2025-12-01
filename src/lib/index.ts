// Components
export { default as Canvas } from './components/Canvas.svelte';
export { default as Model } from './components/Model.svelte';
export { default as Buffer } from './components/Buffer.svelte';
export { default as Texture } from './components/Texture.svelte';
export { default as Mesh } from './components/Mesh.svelte';
export { default as Scene } from './components/Scene.svelte';
export { default as RenderLoop } from './components/RenderLoop.svelte';
export { default as OrbitCamera } from './components/OrbitCamera.svelte';

// Context
export { getLumaContext, getRenderContext, setLumaContext, setRenderContext } from './context.js';

// Stores
export {
	createFrameStore,
	createDeviceStore,
	createViewportStore,
	createMouseStore,
	type FrameState,
	type ViewportState
} from './stores.js';

// Hooks
export { useDevice, useFrame, useRender, useViewport, useMouse, useBuffer, useTexture } from './hooks.js';

// Utilities
export {
	createDevice,
	degToRad,
	radToDeg,
	clamp,
	lerp,
	createIdentityMatrix,
	createPerspectiveMatrix,
	createOrthographicMatrix,
	createLookAtMatrix,
	multiplyMatrices,
	createRotationMatrixX,
	createRotationMatrixY,
	createRotationMatrixZ,
	createTranslationMatrix,
	createScaleMatrix
} from './utils.js';

// Geometries
export {
	createTriangleGeometry,
	createQuadGeometry,
	createPlaneGeometry,
	createCubeGeometry,
	createSphereGeometry,
	createCircleGeometry,
	createCylinderGeometry,
	createTorusGeometry
} from './geometries.js';

// Shaders
export {
	BASIC_VS_GLSL,
	BASIC_FS_GLSL,
	TEXTURED_VS_GLSL,
	TEXTURED_FS_GLSL,
	NORMAL_VS_GLSL,
	NORMAL_FS_GLSL,
	PHONG_VS_GLSL,
	PHONG_FS_GLSL,
	SIMPLE_TRIANGLE_VS_GLSL,
	SIMPLE_TRIANGLE_FS_GLSL,
	SIMPLE_TRIANGLE_WGSL,
	GRADIENT_VS_GLSL,
	GRADIENT_FS_GLSL,
	INSTANCED_VS_GLSL,
	INSTANCED_FS_GLSL
} from './shaders.js';

// Types
export type {
	Backend,
	LumaContextValue,
	CanvasProps,
	ModelComponentProps,
	BufferProps,
	TextureProps,
	AnimationContext,
	RenderCallback,
	GeometryData
} from './types.js';
