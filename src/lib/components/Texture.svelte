<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Texture as LumaTexture } from '@luma.gl/core';
	import { getLumaState } from '../state.svelte.js';

	interface Props {
		src?: string;
		data?: ArrayBufferView | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
		width?: number;
		height?: number;
		format?: string;
		ontexturecreated?: (texture: LumaTexture) => void;
		ontextureloaded?: (texture: LumaTexture) => void;
	}

	let {
		src,
		data,
		width = 1,
		height = 1,
		format = 'rgba8unorm',
		ontexturecreated,
		ontextureloaded
	}: Props = $props();

	const lumaState = getLumaState();
	let texture: LumaTexture | null = $state(null);

	async function loadImage(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = url;
		});
	}

	onMount(async () => {
		const device = lumaState.device;
		if (!device) return;

		if (src) {
			const img = await loadImage(src);
			texture = device.createTexture({
				data: img,
				width: img.width,
				height: img.height,
				format: format as any
			} as any);

			if (ontextureloaded) {
				ontextureloaded(texture);
			}
		} else if (data) {
			texture = device.createTexture({
				data: data as any,
				width,
				height,
				format: format as any
			} as any);
		}

		if (ontexturecreated && texture) {
			ontexturecreated(texture);
		}
	});

	onDestroy(() => {
		if (texture) {
			texture.destroy();
		}
	});

	export function getTexture(): LumaTexture | null {
		return texture;
	}
</script>
