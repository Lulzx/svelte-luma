// ============================================================================
// Components
// ============================================================================

export { default as Canvas } from './components/Canvas.svelte';
export { default as Model } from './components/Model.svelte';
export { default as Buffer } from './components/Buffer.svelte';
export { default as Texture } from './components/Texture.svelte';
export { default as Mesh } from './components/Mesh.svelte';
export { default as Scene } from './components/Scene.svelte';
export { default as RenderLoop } from './components/RenderLoop.svelte';
export { default as OrbitCamera } from './components/OrbitCamera.svelte';
export { default as Group } from './components/Group.svelte';
export { default as InstancedMesh } from './components/InstancedMesh.svelte';

// Lights
export { default as PointLight } from './components/lights/PointLight.svelte';
export { default as DirectionalLight } from './components/lights/DirectionalLight.svelte';
export { default as AmbientLight } from './components/lights/AmbientLight.svelte';
export { default as SpotLight } from './components/lights/SpotLight.svelte';

// ============================================================================
// State Management
// ============================================================================

export {
	LumaState,
	setLumaState,
	getLumaState,
	tryGetLumaState,
	RenderLayers,
	type FrameState,
	type ViewportState,
	type MouseState,
	type SceneState,
	type LightState,
	type RenderPriority,
	type RenderCallback
} from './state.svelte.js';

// ============================================================================
// Hooks
// ============================================================================

export {
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
} from './hooks.svelte.js';

// ============================================================================
// Materials
// ============================================================================

export {
	createBasicMaterial,
	createNormalMaterial,
	createPhongMaterial,
	createLambertMaterial,
	createInstancedMaterial,
	BASIC_MATERIAL_VS,
	BASIC_MATERIAL_FS,
	NORMAL_MATERIAL_VS,
	NORMAL_MATERIAL_FS,
	PHONG_MATERIAL_VS,
	PHONG_MATERIAL_FS,
	LAMBERT_MATERIAL_VS,
	LAMBERT_MATERIAL_FS,
	INSTANCED_MATERIAL_VS,
	INSTANCED_MATERIAL_FS,
	type MaterialOptions,
	type PhongMaterialOptions,
	type StandardMaterialOptions
} from './materials/index.js';

// ============================================================================
// Math Utilities
// ============================================================================

export {
	// Vector operations
	vec3,
	vec3Add,
	vec3Sub,
	vec3Scale,
	vec3Dot,
	vec3Cross,
	vec3Length,
	vec3Normalize,
	vec3Lerp,
	type Vec3,
	type Vec4,
	type Mat4,
	// Scalar utilities
	degToRad,
	radToDeg,
	clamp,
	lerp,
	smoothstep,
	// Matrix creation
	mat4Identity,
	mat4Clone,
	mat4Copy,
	mat4Perspective,
	mat4Orthographic,
	mat4LookAt,
	mat4Translation,
	mat4Scaling,
	mat4RotationX,
	mat4RotationY,
	mat4RotationZ,
	mat4FromEuler,
	mat4FromQuaternion,
	// Matrix operations
	mat4Multiply,
	mat4Invert,
	mat4Transpose,
	mat4Compose,
	mat4TransformPoint,
	mat4TransformDirection,
	// Pool management
	resetMatrixPool
} from './math.js';

// ============================================================================
// Geometries
// ============================================================================

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

// ============================================================================
// Shaders
// ============================================================================

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

// ============================================================================
// Types
// ============================================================================

export type {
	Backend,
	CanvasProps,
	ModelComponentProps,
	BufferProps,
	TextureProps,
	AnimationContext,
	GeometryData
} from './types.js';
