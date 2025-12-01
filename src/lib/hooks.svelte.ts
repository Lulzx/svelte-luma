import { onMount, onDestroy } from 'svelte';
import type { Device, Buffer, Texture } from '@luma.gl/core';
import { getLumaState, RenderLayers, type RenderPriority } from './state.svelte.js';

// ============================================================================
// Core Hooks - Return reactive values using Svelte 5 patterns
// ============================================================================

/**
 * Get the GPU device. Returns reactive state that updates when device changes.
 */
export function useDevice(): { readonly current: Device | null } {
	const state = getLumaState();
	return {
		get current() {
			return state.device;
		}
	};
}

/**
 * Check if the canvas is ready for rendering.
 */
export function useReady(): { readonly value: boolean } {
	const state = getLumaState();
	return {
		get value() {
			return state.ready;
		}
	};
}

/**
 * Get the current frame state (time, deltaTime, frameCount).
 */
export function useFrame(): {
	readonly time: number;
	readonly deltaTime: number;
	readonly frameCount: number;
} {
	const state = getLumaState();
	return {
		get time() {
			return state.frame.time;
		},
		get deltaTime() {
			return state.frame.deltaTime;
		},
		get frameCount() {
			return state.frame.frameCount;
		}
	};
}

/**
 * Register a callback to run on each frame.
 * Callback receives (time, deltaTime) and can be used for animations.
 */
export function useFrameCallback(
	callback: (time: number, deltaTime: number) => void,
	options?: { priority?: RenderPriority }
): void {
	const state = getLumaState();
	let callbackId: symbol | null = null;

	onMount(() => {
		callbackId = state.addRenderCallback(() => {
			callback(state.frame.time, state.frame.deltaTime);
		}, options?.priority ?? RenderLayers.OPAQUE);
	});

	onDestroy(() => {
		if (callbackId) {
			state.removeRenderCallback(callbackId);
		}
	});
}

/**
 * Register a render callback with priority control.
 * Lower priority numbers render first.
 */
export function useRender(
	callback: () => void,
	priority: RenderPriority = RenderLayers.OPAQUE
): { unregister: () => void } {
	const state = getLumaState();
	let callbackId: symbol | null = null;

	onMount(() => {
		callbackId = state.addRenderCallback(callback, priority);
	});

	onDestroy(() => {
		if (callbackId) {
			state.removeRenderCallback(callbackId);
		}
	});

	return {
		unregister() {
			if (callbackId) {
				state.removeRenderCallback(callbackId);
				callbackId = null;
			}
		}
	};
}

/**
 * Get the current viewport state.
 */
export function useViewport(): {
	readonly width: number;
	readonly height: number;
	readonly pixelRatio: number;
	readonly aspect: number;
} {
	const state = getLumaState();
	return {
		get width() {
			return state.viewport.width;
		},
		get height() {
			return state.viewport.height;
		},
		get pixelRatio() {
			return state.viewport.pixelRatio;
		},
		get aspect() {
			return state.viewport.aspect;
		}
	};
}

/**
 * Get the current mouse state.
 */
export function useMouse(): {
	readonly x: number;
	readonly y: number;
	readonly normalizedX: number;
	readonly normalizedY: number;
	readonly buttons: number;
	readonly isOver: boolean;
	readonly isDragging: boolean;
} {
	const state = getLumaState();
	return {
		get x() {
			return state.mouse.x;
		},
		get y() {
			return state.mouse.y;
		},
		get normalizedX() {
			return state.mouse.normalizedX;
		},
		get normalizedY() {
			return state.mouse.normalizedY;
		},
		get buttons() {
			return state.mouse.buttons;
		},
		get isOver() {
			return state.mouse.isOver;
		},
		get isDragging() {
			return state.mouse.isDragging;
		}
	};
}

/**
 * Get the current scene state (projection/view matrices, camera position).
 */
export function useScene(): {
	readonly projectionMatrix: Float32Array | null;
	readonly viewMatrix: Float32Array | null;
	readonly cameraPosition: [number, number, number] | null;
} {
	const state = getLumaState();
	return {
		get projectionMatrix() {
			return state.scene?.projectionMatrix ?? null;
		},
		get viewMatrix() {
			return state.scene?.viewMatrix ?? null;
		},
		get cameraPosition() {
			return state.scene?.cameraPosition ?? null;
		}
	};
}

/**
 * Get the parent transform matrix (for transform hierarchy).
 */
export function useParentTransform(): { readonly matrix: Float32Array | null } {
	const state = getLumaState();
	return {
		get matrix() {
			return state.parentTransform;
		}
	};
}

/**
 * Get all lights in the scene.
 */
export function useLights(): {
	readonly all: import('./state.svelte.js').LightState[];
	readonly count: number;
} {
	const state = getLumaState();
	return {
		get all() {
			return state.getLightsArray();
		},
		get count() {
			return state.lights.size;
		}
	};
}

// ============================================================================
// Resource Hooks
// ============================================================================

/**
 * Create and manage a GPU buffer.
 */
export function useBuffer(
	getData: () => ArrayBufferView | number[],
	options?: { usage?: number }
): { readonly buffer: Buffer | null; update: (data: ArrayBufferView | number[]) => void } {
	const state = getLumaState();
	let buffer: Buffer | null = $state(null);

	onMount(() => {
		const device = state.device;
		if (!device) return;

		const data = getData();
		const bufferData = Array.isArray(data) ? new Float32Array(data) : data;
		buffer = device.createBuffer({
			data: bufferData,
			usage: options?.usage
		});
	});

	onDestroy(() => {
		if (buffer) {
			buffer.destroy();
			buffer = null;
		}
	});

	return {
		get buffer() {
			return buffer;
		},
		update(data: ArrayBufferView | number[]) {
			if (!buffer) return;
			const bufferData = Array.isArray(data) ? new Float32Array(data) : data;
			buffer.write(bufferData);
		}
	};
}

/**
 * Load and manage a texture from a URL.
 */
export function useTexture(
	src: string | (() => string),
	options?: { format?: string; mipmaps?: boolean }
): { readonly texture: Texture | null; readonly loading: boolean; readonly error: Error | null } {
	const state = getLumaState();
	let texture: Texture | null = $state(null);
	let loading = $state(true);
	let error: Error | null = $state(null);

	onMount(async () => {
		const device = state.device;
		if (!device) {
			loading = false;
			return;
		}

		try {
			const url = typeof src === 'function' ? src() : src;
			const img = await new Promise<HTMLImageElement>((resolve, reject) => {
				const image = new Image();
				image.crossOrigin = 'anonymous';
				image.onload = () => resolve(image);
				image.onerror = reject;
				image.src = url;
			});

			texture = device.createTexture({
				data: img,
				width: img.width,
				height: img.height,
				format: (options?.format as any) ?? 'rgba8unorm'
			} as any);
		} catch (e) {
			error = e instanceof Error ? e : new Error(String(e));
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		if (texture) {
			texture.destroy();
			texture = null;
		}
	});

	return {
		get texture() {
			return texture;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		}
	};
}

// ============================================================================
// Animation Hooks
// ============================================================================

/**
 * Create an animated value that updates each frame.
 */
export function useAnimatedValue<T>(
	compute: (time: number, deltaTime: number) => T,
	initial: T
): { readonly value: T } {
	const state = getLumaState();
	let value = $state(initial);

	useFrameCallback((time, deltaTime) => {
		value = compute(time, deltaTime);
	});

	return {
		get value() {
			return value;
		}
	};
}

/**
 * Create a spring-animated value.
 */
export function useSpring(
	target: () => number,
	options?: { stiffness?: number; damping?: number }
): { readonly value: number } {
	const stiffness = options?.stiffness ?? 0.1;
	const damping = options?.damping ?? 0.8;

	let value = $state(target());
	let velocity = 0;

	useFrameCallback(() => {
		const targetValue = target();
		const delta = targetValue - value;
		velocity = velocity * damping + delta * stiffness;
		value += velocity;
	});

	return {
		get value() {
			return value;
		}
	};
}

