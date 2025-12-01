<script lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import { Model as LumaModel, Geometry } from '@luma.gl/engine';
	import { getLumaContext, getRenderContext } from '../context.js';
	import type { GeometryData } from '../types.js';
	import {
		createIdentityMatrix,
		createTranslationMatrix,
		createRotationMatrixX,
		createRotationMatrixY,
		createRotationMatrixZ,
		createScaleMatrix,
		multiplyMatrices
	} from '../utils.js';

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
		draw?: boolean;
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
		draw = true,
		onmeshcreated
	}: Props = $props();

	const lumaContext = getLumaContext();
	const renderContext = getRenderContext();
	const sceneStore = getContext<{ subscribe: (fn: (v: any) => void) => () => void } | undefined>(
		'luma:scene'
	);

	let model: LumaModel | null = $state(null);
	let modelMatrix = $state(createIdentityMatrix());

	function updateModelMatrix() {
		const t = createTranslationMatrix(position[0], position[1], position[2]);
		const rx = createRotationMatrixX(rotation[0]);
		const ry = createRotationMatrixY(rotation[1]);
		const rz = createRotationMatrixZ(rotation[2]);
		const s = createScaleMatrix(scale[0], scale[1], scale[2]);

		let m = multiplyMatrices(t, rx);
		m = multiplyMatrices(m, ry);
		m = multiplyMatrices(m, rz);
		m = multiplyMatrices(m, s);
		modelMatrix = m;
	}

	function renderCallback() {
		if (!model || !draw) return;

		const device = lumaContext.getDevice();
		if (!device) return;

		updateModelMatrix();

		const combinedUniforms: Record<string, unknown> = {
			...uniforms,
			uModelMatrix: modelMatrix
		};

		if (sceneStore) {
			let sceneData: any;
			sceneStore.subscribe((v) => (sceneData = v))();
			if (sceneData) {
				combinedUniforms.uProjectionMatrix = sceneData.projectionMatrix;
				combinedUniforms.uViewMatrix = sceneData.viewMatrix;
			}
		}

		model.setUniforms(combinedUniforms);

		const renderPass = device.beginRenderPass({ clearColor: [0, 0, 0, 0] });
		model.draw(renderPass);
		renderPass.end();
	}

	onMount(() => {
		const device = lumaContext.getDevice();
		if (!device) return;

		const lumaGeometry = new Geometry({
			topology: 'triangle-list',
			attributes: {
				positions: geometry.positions ? { size: 3, value: geometry.positions } : undefined,
				normals: geometry.normals ? { size: 3, value: geometry.normals } : undefined,
				texCoords: geometry.texCoords ? { size: 2, value: geometry.texCoords } : undefined,
				colors: geometry.colors ? { size: 4, value: geometry.colors } : undefined
			},
			indices: geometry.indices
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
		});

		if (onmeshcreated) {
			onmeshcreated(model);
		}

		renderContext.addRenderCallback(renderCallback);
	});

	onDestroy(() => {
		renderContext.removeRenderCallback(renderCallback);
		if (model) {
			model.destroy();
		}
	});

	export function getModel(): LumaModel | null {
		return model;
	}
</script>
