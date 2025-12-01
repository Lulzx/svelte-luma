import { writable } from 'svelte/store';
import type { Device } from '@luma.gl/core';

export interface FrameState {
	time: number;
	deltaTime: number;
	frameCount: number;
}

export function createFrameStore() {
	const { subscribe, set } = writable<FrameState>({
		time: 0,
		deltaTime: 0,
		frameCount: 0
	});

	let lastTime = 0;
	let frameCount = 0;

	return {
		subscribe,
		update(time: number) {
			const deltaTime = time - lastTime;
			lastTime = time;
			frameCount++;
			set({ time, deltaTime, frameCount });
		},
		reset() {
			lastTime = 0;
			frameCount = 0;
			set({ time: 0, deltaTime: 0, frameCount: 0 });
		}
	};
}

export function createDeviceStore() {
	const { subscribe, set } = writable<Device | null>(null);

	return {
		subscribe,
		set,
		destroy() {
			set(null);
		}
	};
}

export interface ViewportState {
	width: number;
	height: number;
	pixelRatio: number;
}

export function createViewportStore(
	initialWidth = 800,
	initialHeight = 600,
	initialPixelRatio = 1
) {
	const { subscribe, set, update } = writable<ViewportState>({
		width: initialWidth,
		height: initialHeight,
		pixelRatio: initialPixelRatio
	});

	return {
		subscribe,
		setSize(width: number, height: number) {
			update((state) => ({ ...state, width, height }));
		},
		setPixelRatio(pixelRatio: number) {
			update((state) => ({ ...state, pixelRatio }));
		},
		set
	};
}

export function createMouseStore() {
	const { subscribe, set, update } = writable({
		x: 0,
		y: 0,
		normalizedX: 0,
		normalizedY: 0,
		buttons: 0,
		isOver: false
	});

	return {
		subscribe,
		updatePosition(x: number, y: number, width: number, height: number) {
			update((state) => ({
				...state,
				x,
				y,
				normalizedX: (x / width) * 2 - 1,
				normalizedY: -((y / height) * 2 - 1)
			}));
		},
		updateButtons(buttons: number) {
			update((state) => ({ ...state, buttons }));
		},
		setOver(isOver: boolean) {
			update((state) => ({ ...state, isOver }));
		}
	};
}
