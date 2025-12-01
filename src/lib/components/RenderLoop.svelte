<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Device } from '@luma.gl/core';
	import { getLumaState, RenderLayers } from '../state.svelte.js';

	interface FrameContext {
		time: number;
		deltaTime: number;
		frameCount: number;
		device: Device;
	}

	interface Props {
		onframe?: (ctx: FrameContext) => void;
		children?: Snippet<[FrameContext]>;
	}

	let { onframe, children }: Props = $props();

	const lumaState = getLumaState();

	let currentFrame: FrameContext | null = $state(null);
	let callbackId: symbol | null = null;

	function renderCallback() {
		const device = lumaState.device;
		if (!device) return;

		currentFrame = {
			time: lumaState.frame.time,
			deltaTime: lumaState.frame.deltaTime,
			frameCount: lumaState.frame.frameCount,
			device
		};

		if (onframe && currentFrame) {
			onframe(currentFrame);
		}
	}

	onMount(() => {
		callbackId = lumaState.addRenderCallback(renderCallback, RenderLayers.OPAQUE);
	});

	onDestroy(() => {
		if (callbackId) {
			lumaState.removeRenderCallback(callbackId);
		}
	});
</script>

{#if currentFrame && children}
	{@render children(currentFrame)}
{/if}
