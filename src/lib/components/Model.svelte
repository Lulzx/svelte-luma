<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Model as LumaModel, type ModelProps } from '@luma.gl/engine';
	import { getLumaContext, getRenderContext } from '../context.js';
	import type { ModelComponentProps } from '../types.js';

	interface Props extends ModelComponentProps {
		draw?: boolean;
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
		draw = true,
		onmodelcreated
	}: Props = $props();

	const lumaContext = getLumaContext();
	const renderContext = getRenderContext();

	let model: LumaModel | null = $state(null);

	function renderCallback() {
		if (!model || !draw) return;

		const device = lumaContext.getDevice();
		if (!device) return;

		const renderPass = device.beginRenderPass({ clearColor: [0, 0, 0, 0] });
		model.draw(renderPass);
		renderPass.end();
	}

	onMount(() => {
		const device = lumaContext.getDevice();
		if (!device) return;

		const modelProps: ModelProps = {
			device,
			topology,
			vertexCount,
			instanceCount,
			parameters: {
				depthFormat: 'depth24plus',
				...parameters
			}
		};

		if (source) {
			modelProps.source = source;
		}
		if (vs) {
			modelProps.vs = vs;
		}
		if (fs) {
			modelProps.fs = fs;
		}
		if (geometry) {
			modelProps.geometry = geometry;
		}
		if (shaderLayout) {
			modelProps.shaderLayout = shaderLayout;
		}

		model = new LumaModel(device, modelProps);

		if (Object.keys(uniforms).length > 0) {
			model.setUniforms(uniforms);
		}
		if (Object.keys(bindings).length > 0) {
			model.setBindings(bindings);
		}

		if (onmodelcreated) {
			onmodelcreated(model);
		}

		renderContext.addRenderCallback(renderCallback);
	});

	onDestroy(() => {
		renderContext.removeRenderCallback(renderCallback);
		if (model) {
			model.destroy();
		}
	});

	$effect(() => {
		if (model && Object.keys(uniforms).length > 0) {
			model.setUniforms(uniforms);
		}
	});

	$effect(() => {
		if (model && Object.keys(bindings).length > 0) {
			model.setBindings(bindings);
		}
	});

	export function getModel(): LumaModel | null {
		return model;
	}
</script>
