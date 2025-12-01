<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Model as LumaModel, type ModelProps } from '@luma.gl/engine';
	import { getLumaState, RenderLayers, type RenderPriority } from '../state.svelte.js';
	import type { ModelComponentProps } from '../types.js';

	interface Props extends ModelComponentProps {
		visible?: boolean;
		renderOrder?: RenderPriority;
		onmodelcreated?: (model: LumaModel) => void;
	}

	let {
		vs,
		fs,
		source,
		geometry,
		topology = 'triangle-list',
		vertexCount = 3,
		instanceCount = 1,
		uniforms = {},
		bindings = {},
		parameters = {},
		shaderLayout,
		visible = true,
		renderOrder = RenderLayers.OPAQUE,
		onmodelcreated
	}: Props = $props();

	const lumaState = getLumaState();

	let model: LumaModel | null = $state(null);
	let callbackId: symbol | null = null;

	function renderCallback() {
		if (!model || !visible) return;

		const device = lumaState.device;
		if (!device) return;

		if (lumaState.scene) {
			(model as any).setUniforms({
				...uniforms,
				uProjectionMatrix: lumaState.scene.projectionMatrix,
				uViewMatrix: lumaState.scene.viewMatrix,
				uCameraPosition: lumaState.scene.cameraPosition
			});
		} else if (Object.keys(uniforms).length > 0) {
			(model as any).setUniforms(uniforms);
		}

		const renderPass = device.beginRenderPass({ clearColor: [0, 0, 0, 0] });
		model.draw(renderPass);
		renderPass.end();
	}

	onMount(() => {
		const device = lumaState.device;
		if (!device) return;

		const modelProps: any = {
			device,
			topology,
			vertexCount,
			instanceCount,
			parameters: {
				depthFormat: 'depth24plus',
				...parameters
			}
		};

		if (source) modelProps.source = source;
		if (vs) modelProps.vs = vs;
		if (fs) modelProps.fs = fs;
		if (geometry) modelProps.geometry = geometry;
		if (shaderLayout) modelProps.shaderLayout = shaderLayout;

		model = new LumaModel(device, modelProps);

		if (Object.keys(uniforms).length > 0) {
			(model as any).setUniforms(uniforms);
		}
		if (Object.keys(bindings).length > 0) {
			(model as any).setBindings(bindings);
		}

		if (onmodelcreated) {
			onmodelcreated(model);
		}

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

	$effect(() => {
		if (model && Object.keys(uniforms).length > 0) {
			(model as any).setUniforms(uniforms);
		}
	});

	$effect(() => {
		if (model && Object.keys(bindings).length > 0) {
			(model as any).setBindings(bindings);
		}
	});

	export function getModel(): LumaModel | null {
		return model;
	}

	export function setVisible(v: boolean): void {
		visible = v;
	}
</script>
