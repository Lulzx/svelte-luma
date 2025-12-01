<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Device } from '@luma.gl/core';
	import { LumaState, setLumaState } from '../state.svelte.js';
	import { resetMatrixPool } from '../math.js';
	import type { Backend } from '../types.js';

	interface Props {
		width?: number;
		height?: number;
		pixelRatio?: number;
		backend?: Backend;
		clearColor?: [number, number, number, number];
		autoClear?: boolean;
		antialias?: boolean;
		class?: string;
		style?: string;
		children?: Snippet;
		ondevicecreated?: (device: Device) => void;
		onframe?: (ctx: { time: number; deltaTime: number; device: Device }) => void;
		onerror?: (error: Error) => void;
	}

	let {
		width = $bindable(800),
		height = $bindable(600),
		pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1,
		backend = 'best',
		clearColor = [0, 0, 0, 1],
		autoClear = true,
		antialias = true,
		class: className = '',
		style = '',
		children,
		ondevicecreated,
		onframe,
		onerror
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let animationFrameId: number;

	const lumaState = new LumaState();
	setLumaState(lumaState);

	async function createDeviceInternal(
		canvasEl: HTMLCanvasElement,
		backend: Backend
	): Promise<Device> {
		if (backend === 'webgpu' || backend === 'best') {
			try {
				const { webgpuAdapter } = await import('@luma.gl/webgpu');
				const device = await webgpuAdapter.create({ canvas: canvasEl } as any);
				return device;
			} catch (e) {
				if (backend === 'webgpu') {
					throw new Error('WebGPU not supported in this browser');
				}
			}
		}

		const { webgl2Adapter } = await import('@luma.gl/webgl');
		const device = await webgl2Adapter.create({ canvas: canvasEl } as any);
		return device;
	}

	function render(time: number) {
		if (!lumaState.device || !lumaState.ready) return;

		resetMatrixPool();
		lumaState.updateFrame(time);

		if (autoClear) {
			const canvasContext = lumaState.device.canvasContext;
			if (canvasContext) {
				const renderPass = lumaState.device.beginRenderPass({
					clearColor,
					clearDepth: 1
				});
				renderPass.end();
			}
		}

		lumaState.executeRenderCallbacks();

		if (onframe && lumaState.device) {
			onframe({
				time,
				deltaTime: lumaState.frame.deltaTime,
				device: lumaState.device
			});
		}

		animationFrameId = requestAnimationFrame(render);
	}

	function handleMouseMove(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		lumaState.updateMousePosition(e.clientX, e.clientY, rect);
	}

	function handleMouseDown(e: MouseEvent) {
		lumaState.updateMouseButtons(e.buttons);
	}

	function handleMouseUp(e: MouseEvent) {
		lumaState.updateMouseButtons(e.buttons);
	}

	function handleMouseEnter() {
		lumaState.setMouseOver(true);
	}

	function handleMouseLeave() {
		lumaState.setMouseOver(false);
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
	}

	onMount(async () => {
		try {
			canvas.width = width * pixelRatio;
			canvas.height = height * pixelRatio;

			const device = await createDeviceInternal(canvas, backend);
			lumaState.setDevice(device);
			lumaState.setViewport(width, height, pixelRatio);

			if (ondevicecreated) {
				ondevicecreated(device);
			}

			animationFrameId = requestAnimationFrame(render);
		} catch (e) {
			const error = e instanceof Error ? e : new Error(String(e));
			lumaState.setError(error);
			if (onerror) {
				onerror(error);
			}
		}
	});

	onDestroy(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		lumaState.destroy();
	});

	$effect(() => {
		if (canvas) {
			canvas.width = width * pixelRatio;
			canvas.height = height * pixelRatio;
			lumaState.setViewport(width, height, pixelRatio);
		}
	});
</script>

<canvas
	bind:this={canvas}
	{width}
	{height}
	class={className}
	{style}
	onmousemove={handleMouseMove}
	onmousedown={handleMouseDown}
	onmouseup={handleMouseUp}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onwheel={handleWheel}
	oncontextmenu={handleContextMenu}
>
	{#if lumaState.ready && children}
		{@render children()}
	{/if}
</canvas>

{#if lumaState.error}
	<div class="luma-error">
		<p>Failed to initialize WebGL/WebGPU: {lumaState.error.message}</p>
	</div>
{/if}

<style>
	canvas {
		display: block;
		touch-action: none;
	}

	.luma-error {
		color: red;
		padding: 1rem;
		background: #fee;
		border: 1px solid #f00;
		border-radius: 4px;
	}
</style>
