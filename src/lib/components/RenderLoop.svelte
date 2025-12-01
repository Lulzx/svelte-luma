<script lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Device } from '@luma.gl/core';
	import { getLumaContext, getRenderContext } from '../context.js';

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

	const lumaContext = getLumaContext();
	const renderContext = getRenderContext();
	const frameStore = getContext<{ subscribe: (fn: (v: any) => void) => () => void }>('luma:frame');

	let currentFrame: FrameContext | null = $state(null);

	function renderCallback() {
		const device = lumaContext.getDevice();
		if (!device) return;

		if (onframe && currentFrame) {
			onframe({ ...currentFrame, device });
		}
	}

	onMount(() => {
		const unsubscribe = frameStore.subscribe((frame) => {
			const device = lumaContext.getDevice();
			if (device) {
				currentFrame = { ...frame, device };
			}
		});

		renderContext.addRenderCallback(renderCallback);

		return () => {
			unsubscribe();
		};
	});

	onDestroy(() => {
		renderContext.removeRenderCallback(renderCallback);
	});
</script>

{#if currentFrame && children}
	{@render children(currentFrame)}
{/if}
