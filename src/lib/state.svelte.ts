import { getContext, setContext } from 'svelte';
import type { Device } from '@luma.gl/core';

// ============================================================================
// Unified Reactive State System
// ============================================================================

const LUMA_STATE = Symbol('luma-state');

export interface FrameState {
	time: number;
	deltaTime: number;
	frameCount: number;
}

export interface ViewportState {
	width: number;
	height: number;
	pixelRatio: number;
	aspect: number;
}

export interface MouseState {
	x: number;
	y: number;
	normalizedX: number;
	normalizedY: number;
	buttons: number;
	isOver: boolean;
	isDragging: boolean;
}

export interface SceneState {
	projectionMatrix: Float32Array;
	viewMatrix: Float32Array;
	cameraPosition: [number, number, number];
}

export interface LightState {
	type: 'point' | 'directional' | 'spot' | 'ambient';
	position: [number, number, number];
	direction: [number, number, number];
	color: [number, number, number];
	intensity: number;
	decay: number;
	distance: number;
	angle: number;
	penumbra: number;
}

export type RenderPriority = number;

export interface RenderCallback {
	callback: () => void;
	priority: RenderPriority;
	id: symbol;
}

// ============================================================================
// Render Layer Constants
// ============================================================================

export const RenderLayers = {
	BACKGROUND: 0,
	OPAQUE: 100,
	TRANSPARENT: 200,
	OVERLAY: 300,
	UI: 400
} as const;

// ============================================================================
// Luma State Class - Unified reactive state container
// ============================================================================

export class LumaState {
	// Core state (reactive via Svelte 5 runes in components)
	device: Device | null = $state(null);
	ready: boolean = $state(false);
	error: Error | null = $state(null);

	// Frame state
	frame: FrameState = $state({
		time: 0,
		deltaTime: 0,
		frameCount: 0
	});

	// Viewport state
	viewport: ViewportState = $state({
		width: 800,
		height: 600,
		pixelRatio: 1,
		aspect: 800 / 600
	});

	// Mouse state
	mouse: MouseState = $state({
		x: 0,
		y: 0,
		normalizedX: 0,
		normalizedY: 0,
		buttons: 0,
		isOver: false,
		isDragging: false
	});

	// Scene state (set by Scene component)
	scene: SceneState | null = $state(null);

	// Parent transform for hierarchy (set by Group component)
	parentTransform: Float32Array | null = $state(null);

	// Lights collection
	lights: Map<symbol, LightState> = $state(new Map());

	// Render callbacks with priority
	private renderCallbacks: RenderCallback[] = $state([]);
	private sortedCallbacks: RenderCallback[] = $state([]);
	private needsSort: boolean = $state(false);

	// Frame timing
	private lastTime: number = 0;

	// ========================================================================
	// Device Methods
	// ========================================================================

	setDevice(device: Device): void {
		this.device = device;
		this.ready = true;
	}

	setError(error: Error): void {
		this.error = error;
		this.ready = false;
	}

	// ========================================================================
	// Frame Methods
	// ========================================================================

	updateFrame(time: number): void {
		const deltaTime = time - this.lastTime;
		this.lastTime = time;
		this.frame = {
			time,
			deltaTime,
			frameCount: this.frame.frameCount + 1
		};
	}

	resetFrame(): void {
		this.lastTime = 0;
		this.frame = { time: 0, deltaTime: 0, frameCount: 0 };
	}

	// ========================================================================
	// Viewport Methods
	// ========================================================================

	setViewport(width: number, height: number, pixelRatio: number = 1): void {
		this.viewport = {
			width,
			height,
			pixelRatio,
			aspect: width / height
		};
	}

	// ========================================================================
	// Mouse Methods
	// ========================================================================

	updateMousePosition(clientX: number, clientY: number, rect: DOMRect): void {
		const x = clientX - rect.left;
		const y = clientY - rect.top;
		this.mouse = {
			...this.mouse,
			x,
			y,
			normalizedX: (x / this.viewport.width) * 2 - 1,
			normalizedY: -((y / this.viewport.height) * 2 - 1)
		};
	}

	updateMouseButtons(buttons: number): void {
		this.mouse = {
			...this.mouse,
			buttons,
			isDragging: buttons > 0 && this.mouse.isOver
		};
	}

	setMouseOver(isOver: boolean): void {
		this.mouse = {
			...this.mouse,
			isOver,
			isDragging: isOver ? this.mouse.isDragging : false
		};
	}

	// ========================================================================
	// Scene Methods
	// ========================================================================

	setScene(projectionMatrix: Float32Array, viewMatrix: Float32Array, cameraPosition: [number, number, number]): void {
		this.scene = { projectionMatrix, viewMatrix, cameraPosition };
	}

	clearScene(): void {
		this.scene = null;
	}

	// ========================================================================
	// Transform Hierarchy Methods
	// ========================================================================

	setParentTransform(matrix: Float32Array | null): void {
		this.parentTransform = matrix;
	}

	// ========================================================================
	// Light Methods
	// ========================================================================

	addLight(id: symbol, light: LightState): void {
		this.lights.set(id, light);
	}

	updateLight(id: symbol, light: Partial<LightState>): void {
		const existing = this.lights.get(id);
		if (existing) {
			this.lights.set(id, { ...existing, ...light });
		}
	}

	removeLight(id: symbol): void {
		this.lights.delete(id);
	}

	getLightsArray(): LightState[] {
		return Array.from(this.lights.values());
	}

	// ========================================================================
	// Render Callback Methods (with priority/layers)
	// ========================================================================

	addRenderCallback(callback: () => void, priority: RenderPriority = RenderLayers.OPAQUE): symbol {
		const id = Symbol('render-callback');
		this.renderCallbacks.push({ callback, priority, id });
		this.needsSort = true;
		return id;
	}

	removeRenderCallback(id: symbol): void {
		const index = this.renderCallbacks.findIndex(cb => cb.id === id);
		if (index !== -1) {
			this.renderCallbacks.splice(index, 1);
			this.needsSort = true;
		}
	}

	executeRenderCallbacks(): void {
		if (this.needsSort) {
			this.sortedCallbacks = [...this.renderCallbacks].sort((a, b) => a.priority - b.priority);
			this.needsSort = false;
		}
		for (const { callback } of this.sortedCallbacks) {
			callback();
		}
	}

	// ========================================================================
	// Cleanup
	// ========================================================================

	destroy(): void {
		if (this.device) {
			this.device.destroy();
			this.device = null;
		}
		this.ready = false;
		this.renderCallbacks = [];
		this.sortedCallbacks = [];
		this.lights.clear();
	}
}

// ============================================================================
// Context Helpers
// ============================================================================

export function setLumaState(state: LumaState): void {
	setContext(LUMA_STATE, state);
}

export function getLumaState(): LumaState {
	const state = getContext<LumaState>(LUMA_STATE);
	if (!state) {
		throw new Error('LumaState not found. Ensure component is inside <Canvas>');
	}
	return state;
}

export function tryGetLumaState(): LumaState | null {
	return getContext<LumaState>(LUMA_STATE) ?? null;
}
