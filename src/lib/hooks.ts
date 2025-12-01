import { getContext, onMount, onDestroy } from 'svelte';
import type { Device, Buffer, Texture } from '@luma.gl/core';
import { getLumaContext, getRenderContext } from './context.js';

export function useDevice(): () => Device | null {
	const context = getLumaContext();
	return () => context.getDevice();
}

export function useFrame(callback: (time: number, deltaTime: number) => void): void {
	const frameStore = getContext<{ subscribe: (fn: (v: any) => void) => () => void }>('luma:frame');

	onMount(() => {
		const unsubscribe = frameStore.subscribe((frame) => {
			callback(frame.time, frame.deltaTime);
		});

		return unsubscribe;
	});
}

export function useRender(callback: () => void): void {
	const renderContext = getRenderContext();

	onMount(() => {
		renderContext.addRenderCallback(callback);
	});

	onDestroy(() => {
		renderContext.removeRenderCallback(callback);
	});
}

export function useViewport(): () => { width: number; height: number; pixelRatio: number } {
	const viewportStore = getContext<{ subscribe: (fn: (v: any) => void) => () => void }>(
		'luma:viewport'
	);

	let current = { width: 0, height: 0, pixelRatio: 1 };

	onMount(() => {
		const unsubscribe = viewportStore.subscribe((v) => {
			current = v;
		});
		return unsubscribe;
	});

	return () => current;
}

export function useMouse(): () => {
	x: number;
	y: number;
	normalizedX: number;
	normalizedY: number;
	buttons: number;
	isOver: boolean;
} {
	const mouseStore = getContext<{ subscribe: (fn: (v: any) => void) => () => void }>('luma:mouse');

	let current = { x: 0, y: 0, normalizedX: 0, normalizedY: 0, buttons: 0, isOver: false };

	onMount(() => {
		const unsubscribe = mouseStore.subscribe((v) => {
			current = v;
		});
		return unsubscribe;
	});

	return () => current;
}

export function useBuffer(
	data: ArrayBufferView | number[],
	options?: { usage?: number }
): () => Buffer | null {
	const context = getLumaContext();
	let buffer: Buffer | null = null;

	onMount(() => {
		const device = context.getDevice();
		if (!device) return;

		const bufferData = Array.isArray(data) ? new Float32Array(data) : data;
		buffer = device.createBuffer({
			data: bufferData,
			usage: options?.usage
		});
	});

	onDestroy(() => {
		if (buffer) {
			buffer.destroy();
		}
	});

	return () => buffer;
}

export function useTexture(
	src: string,
	options?: { format?: string; mipmaps?: boolean }
): () => Texture | null {
	const context = getLumaContext();
	let texture: Texture | null = null;

	onMount(async () => {
		const device = context.getDevice();
		if (!device) return;

		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const image = new Image();
			image.crossOrigin = 'anonymous';
			image.onload = () => resolve(image);
			image.onerror = reject;
			image.src = src;
		});

		texture = device.createTexture({
			data: img,
			width: img.width,
			height: img.height,
			format: (options?.format as any) ?? 'rgba8unorm',
			mipmaps: options?.mipmaps ?? true
		});
	});

	onDestroy(() => {
		if (texture) {
			texture.destroy();
		}
	});

	return () => texture;
}
