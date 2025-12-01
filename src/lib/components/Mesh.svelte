<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Model as LumaModel, Geometry } from '@luma.gl/engine';
	import { getLumaState, RenderLayers, type RenderPriority } from '../state.svelte.js';
	import { mat4Compose, mat4Multiply, mat4Clone } from '../math.js';
	import type { GeometryData } from '../types.js';

	interface Props {
		geometry: GeometryData;
		vs: string;
		fs: string;
		source?: string;
		position?: [number, number, number];
		rotation?: [number, number, number];
		scale?: [number, number, number];
		uniforms?: Record<string, unknown>;
		parameters?: Record<string, unknown>;
		visible?: boolean;
		renderOrder?: RenderPriority;
		castShadow?: boolean;
		receiveShadow?: boolean;
		onmeshcreated?: (model: LumaModel) => void;
	}

	let {
		geometry,
		vs,
		fs,
		source,
		position = [0, 0, 0],
		rotation = [0, 0, 0],
		scale = [1, 1, 1],
		uniforms = {},
		parameters = {},
		visible = true,
		renderOrder = RenderLayers.OPAQUE,
		castShadow = false,
		receiveShadow = false,
		onmeshcreated
	}: Props = $props();

	const lumaState = getLumaState();

	let model: LumaModel | null = $state(null);
	let callbackId: symbol | null = null;

	// Cached matrices - only recompute when transforms change
	let cachedModelMatrix: Float32Array = $state(new Float32Array(16));
	let lastPosition: [number, number, number] = $state([...position]);
	let lastRotation: [number, number, number] = $state([...rotation]);
	let lastScale: [number, number, number] = $state([...scale]);
	let matrixDirty = true;

	// Check if transforms changed
	function checkTransformDirty(): boolean {
		if (
			position[0] !== lastPosition[0] ||
			position[1] !== lastPosition[1] ||
			position[2] !== lastPosition[2] ||
			rotation[0] !== lastRotation[0] ||
			rotation[1] !== lastRotation[1] ||
			rotation[2] !== lastRotation[2] ||
			scale[0] !== lastScale[0] ||
			scale[1] !== lastScale[1] ||
			scale[2] !== lastScale[2]
		) {
			lastPosition = [...position];
			lastRotation = [...rotation];
			lastScale = [...scale];
			return true;
		}
		return false;
	}

	function updateModelMatrix(): void {
		if (!checkTransformDirty() && !matrixDirty) return;

		// Compute local transform
		const localMatrix = mat4Compose(position, rotation, scale);

		// Apply parent transform if in a Group
		if (lumaState.parentTransform) {
			mat4Multiply(lumaState.parentTransform, localMatrix, cachedModelMatrix);
		} else {
			cachedModelMatrix.set(localMatrix);
		}

		matrixDirty = false;
	}

	function renderCallback(): void {
		if (!model || !visible) return;

		const device = lumaState.device;
		if (!device) return;

		updateModelMatrix();

		// Build uniforms
		const combinedUniforms: Record<string, unknown> = {
			...uniforms,
			uModelMatrix: cachedModelMatrix
		};

		// Add scene matrices if available (no subscribe/unsubscribe!)
		if (lumaState.scene) {
			combinedUniforms.uProjectionMatrix = lumaState.scene.projectionMatrix;
			combinedUniforms.uViewMatrix = lumaState.scene.viewMatrix;
			combinedUniforms.uCameraPosition = lumaState.scene.cameraPosition;
		}

		// Add lights if material supports them
		const lights = lumaState.getLightsArray();
		if (lights.length > 0) {
			combinedUniforms.uLightCount = lights.length;
			combinedUniforms.uLights = lights;
		}

		(model as any).setUniforms(combinedUniforms);

		const renderPass = device.beginRenderPass({ clearColor: [0, 0, 0, 0] });
		model.draw(renderPass);
		renderPass.end();
	}

	onMount(() => {
		const device = lumaState.device;
		if (!device) return;

		// Normalize geometry data
		const positions = geometry.positions
			? geometry.positions instanceof Float32Array
				? geometry.positions
				: new Float32Array(geometry.positions)
			: undefined;

		const normals = geometry.normals
			? geometry.normals instanceof Float32Array
				? geometry.normals
				: new Float32Array(geometry.normals)
			: undefined;

		const texCoords = geometry.texCoords
			? geometry.texCoords instanceof Float32Array
				? geometry.texCoords
				: new Float32Array(geometry.texCoords)
			: undefined;

		const colors = geometry.colors
			? geometry.colors instanceof Float32Array
				? geometry.colors
				: new Float32Array(geometry.colors)
			: undefined;

		// Build attributes object, only including defined attributes
		const attributes: Record<string, any> = {};
		if (positions) attributes.positions = { size: 3, value: positions };
		if (normals) attributes.normals = { size: 3, value: normals };
		if (texCoords) attributes.texCoords = { size: 2, value: texCoords };
		if (colors) attributes.colors = { size: 4, value: colors };

		// Normalize indices if provided
		const indices = geometry.indices
			? Array.isArray(geometry.indices)
				? new Uint16Array(geometry.indices)
				: geometry.indices
			: undefined;

		const lumaGeometry = new Geometry({
			topology: 'triangle-list',
			attributes,
			indices
		});

		model = new LumaModel(device, {
			vs,
			fs,
			source,
			geometry: lumaGeometry,
			parameters: {
				depthFormat: 'depth24plus',
				...parameters
			}
		} as any);

		if (onmeshcreated) {
			onmeshcreated(model);
		}

		// Register with priority-based render system
		callbackId = lumaState.addRenderCallback(renderCallback, renderOrder);
	});

	onDestroy(() => {
		if (callbackId) {
			lumaState.removeRenderCallback(callbackId);
		}
		if (model) {
			model.destroy();
		}
	});

	// Re-register if render order changes
	$effect(() => {
		if (callbackId && model) {
			lumaState.removeRenderCallback(callbackId);
			callbackId = lumaState.addRenderCallback(renderCallback, renderOrder);
		}
	});

	export function getModel(): LumaModel | null {
		return model;
	}

	export function setVisible(v: boolean): void {
		visible = v;
	}
</script>
