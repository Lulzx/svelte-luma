<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Model as LumaModel, Geometry } from '@luma.gl/engine';
	import { getLumaState, RenderLayers, type RenderPriority } from '../state.svelte.js';
	import { mat4Compose, mat4Multiply } from '../math.js';
	import type { GeometryData } from '../types.js';

	interface InstanceData {
		position?: [number, number, number];
		rotation?: [number, number, number];
		scale?: [number, number, number];
		color?: [number, number, number, number];
	}

	interface Props {
		geometry: GeometryData;
		vs: string;
		fs: string;
		source?: string;
		count: number;
		instances?: InstanceData[];
		uniforms?: Record<string, unknown>;
		parameters?: Record<string, unknown>;
		visible?: boolean;
		renderOrder?: RenderPriority;
		frustumCulled?: boolean;
		oninstancescreated?: (model: LumaModel) => void;
	}

	let {
		geometry,
		vs,
		fs,
		source,
		count,
		instances = [],
		uniforms = {},
		parameters = {},
		visible = true,
		renderOrder = RenderLayers.OPAQUE,
		frustumCulled = true,
		oninstancescreated
	}: Props = $props();

	const lumaState = getLumaState();

	let model: LumaModel | null = $state(null);
	let callbackId: symbol | null = null;

	// Instance buffers
	let instanceMatrices: Float32Array = $state(new Float32Array(count * 16));
	let instanceColors: Float32Array = $state(new Float32Array(count * 4));
	let instanceMatrixBuffer: any = null;
	let instanceColorBuffer: any = null;

	function updateInstanceData(): void {
		for (let i = 0; i < count; i++) {
			const instance = instances[i] || {};
			const position = instance.position || [0, 0, 0];
			const rotation = instance.rotation || [0, 0, 0];
			const scale = instance.scale || [1, 1, 1];
			const color = instance.color || [1, 1, 1, 1];

			// Compute instance matrix
			const matrix = mat4Compose(position, rotation, scale);

			// Apply parent transform if in a Group
			if (lumaState.parentTransform) {
				const worldMatrix = mat4Multiply(lumaState.parentTransform, matrix);
				instanceMatrices.set(worldMatrix, i * 16);
			} else {
				instanceMatrices.set(matrix, i * 16);
			}

			// Set instance color
			instanceColors[i * 4] = color[0];
			instanceColors[i * 4 + 1] = color[1];
			instanceColors[i * 4 + 2] = color[2];
			instanceColors[i * 4 + 3] = color[3];
		}

		// Update GPU buffers
		if (instanceMatrixBuffer) {
			instanceMatrixBuffer.write(instanceMatrices);
		}
		if (instanceColorBuffer) {
			instanceColorBuffer.write(instanceColors);
		}
	}

	function renderCallback(): void {
		if (!model || !visible) return;

		const device = lumaState.device;
		if (!device) return;

		updateInstanceData();

		// Build uniforms
		const combinedUniforms: Record<string, unknown> = {
			...uniforms
		};

		// Add scene matrices
		if (lumaState.scene) {
			combinedUniforms.uProjectionMatrix = lumaState.scene.projectionMatrix;
			combinedUniforms.uViewMatrix = lumaState.scene.viewMatrix;
			combinedUniforms.uCameraPosition = lumaState.scene.cameraPosition;
		}

		(model as any).setUniforms(combinedUniforms);

		const renderPass = device.beginRenderPass({ clearColor: [0, 0, 0, 0] });
		model.draw(renderPass);
		renderPass.end();
	}

	onMount(() => {
		const device = lumaState.device;
		if (!device) return;

		// Initialize instance buffers
		instanceMatrices = new Float32Array(count * 16);
		instanceColors = new Float32Array(count * 4);

		// Fill with default identity matrices and white colors
		for (let i = 0; i < count; i++) {
			// Identity matrix
			instanceMatrices[i * 16] = 1;
			instanceMatrices[i * 16 + 5] = 1;
			instanceMatrices[i * 16 + 10] = 1;
			instanceMatrices[i * 16 + 15] = 1;
			// White color
			instanceColors[i * 4] = 1;
			instanceColors[i * 4 + 1] = 1;
			instanceColors[i * 4 + 2] = 1;
			instanceColors[i * 4 + 3] = 1;
		}

		// Create GPU buffers
		instanceMatrixBuffer = device.createBuffer({
			data: instanceMatrices,
			usage: 0x0040 // COPY_DST
		});

		instanceColorBuffer = device.createBuffer({
			data: instanceColors,
			usage: 0x0040
		});

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

		// Build attributes object
		const attributes: Record<string, any> = {
			instanceModelMatrix: {
				size: 16,
				value: instanceMatrices,
				divisor: 1
			},
			instanceColor: {
				size: 4,
				value: instanceColors,
				divisor: 1
			}
		};
		if (positions) attributes.positions = { size: 3, value: positions };
		if (normals) attributes.normals = { size: 3, value: normals };

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
			instanceCount: count,
			parameters: {
				depthFormat: 'depth24plus',
				...parameters
			}
		} as any);

		if (oninstancescreated) {
			oninstancescreated(model);
		}

		// Initial data update
		updateInstanceData();

		callbackId = lumaState.addRenderCallback(renderCallback, renderOrder);
	});

	onDestroy(() => {
		if (callbackId) {
			lumaState.removeRenderCallback(callbackId);
		}
		if (model) {
			model.destroy();
		}
		if (instanceMatrixBuffer) {
			instanceMatrixBuffer.destroy();
		}
		if (instanceColorBuffer) {
			instanceColorBuffer.destroy();
		}
	});

	// Update instance count
	$effect(() => {
		if (model && count !== instanceMatrices.length / 16) {
			// Resize buffers
			instanceMatrices = new Float32Array(count * 16);
			instanceColors = new Float32Array(count * 4);
			// Note: In production, you'd recreate the GPU buffers here
		}
	});

	export function getModel(): LumaModel | null {
		return model;
	}

	export function setInstanceTransform(
		index: number,
		position: [number, number, number],
		rotation: [number, number, number] = [0, 0, 0],
		scale: [number, number, number] = [1, 1, 1]
	): void {
		if (index < 0 || index >= count) return;

		const matrix = mat4Compose(position, rotation, scale);
		instanceMatrices.set(matrix, index * 16);

		if (instanceMatrixBuffer) {
			instanceMatrixBuffer.write(instanceMatrices);
		}
	}

	export function setInstanceColor(index: number, color: [number, number, number, number]): void {
		if (index < 0 || index >= count) return;

		instanceColors[index * 4] = color[0];
		instanceColors[index * 4 + 1] = color[1];
		instanceColors[index * 4 + 2] = color[2];
		instanceColors[index * 4 + 3] = color[3];

		if (instanceColorBuffer) {
			instanceColorBuffer.write(instanceColors);
		}
	}
</script>
