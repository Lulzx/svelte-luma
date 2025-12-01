<script lang="ts">
	import { onMount, onDestroy, setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Device } from '@luma.gl/core';
	import { createDevice } from '../utils.js';
	import { setLumaContext, setRenderContext } from '../context.js';
	import { createFrameStore, createViewportStore, createMouseStore } from '../stores.js';
	import type { Backend } from '../types.js';

	interface Props {
		width?: number;
		height?: number;
		pixelRatio?: number;
		backend?: Backend;
		clearColor?: [number, number, number, number];
		autoClear?: boolean;
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
		class: className = '',
		style = '',
		children,
		ondevicecreated,
		onframe,
		onerror
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let device: Device | null = $state(null);
	let ready = $state(false);
	let error: Error | null = $state(null);
	let animationFrameId: number;

	const frameStore = createFrameStore();
	const viewportStore = createViewportStore(width, height, pixelRatio);
	const mouseStore = createMouseStore();

	const renderCallbacks = new Set<() => void>();

	setLumaContext({
		getDevice: () => device,
		isReady: () => ready
	});

	setRenderContext({
		addRenderCallback: (cb) => renderCallbacks.add(cb),
		removeRenderCallback: (cb) => renderCallbacks.delete(cb)
	});

	setContext('luma:frame', frameStore);
	setContext('luma:viewport', viewportStore);
	setContext('luma:mouse', mouseStore);
	setContext('luma:device', {
		get: () => device,
		subscribe: (fn: (d: Device | null) => void) => {
			fn(device);
			return () => {};
		}
	});

	function render(time: number) {
		if (!device || !ready) return;

		frameStore.update(time);

		if (autoClear) {
			const canvasContext = device.canvasContext;
			if (canvasContext) {
				const renderPass = device.beginRenderPass({
					clearColor,
					clearDepth: 1
				});
				renderPass.end();
			}
		}

		for (const callback of renderCallbacks) {
			callback();
		}

		if (onframe) {
			const state = { time, deltaTime: 0, device };
			onframe(state);
		}

		animationFrameId = requestAnimationFrame(render);
	}

	function handleMouseMove(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		mouseStore.updatePosition(e.clientX - rect.left, e.clientY - rect.top, width, height);
	}

	function handleMouseDown(e: MouseEvent) {
		mouseStore.updateButtons(e.buttons);
	}

	function handleMouseUp(e: MouseEvent) {
		mouseStore.updateButtons(e.buttons);
	}

	function handleMouseEnter() {
		mouseStore.setOver(true);
	}

	function handleMouseLeave() {
		mouseStore.setOver(false);
	}

	onMount(async () => {
		try {
			canvas.width = width * pixelRatio;
			canvas.height = height * pixelRatio;

			device = await createDevice(canvas, backend);
			ready = true;

			if (ondevicecreated) {
				ondevicecreated(device);
			}

			animationFrameId = requestAnimationFrame(render);
		} catch (e) {
			error = e instanceof Error ? e : new Error(String(e));
			if (onerror) {
				onerror(error);
			}
		}
	});

	onDestroy(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		if (device) {
			device.destroy();
		}
	});

	$effect(() => {
		if (canvas) {
			canvas.width = width * pixelRatio;
			canvas.height = height * pixelRatio;
			viewportStore.setSize(width, height);
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
>
	{#if ready && children}
		{@render children()}
	{/if}
</canvas>

{#if error}
	<div class="luma-error">
		<p>Failed to initialize WebGL/WebGPU: {error.message}</p>
	</div>
{/if}

<style>
	canvas {
		display: block;
	}

	.luma-error {
		color: red;
		padding: 1rem;
		background: #fee;
		border: 1px solid #f00;
		border-radius: 4px;
	}
</style>
