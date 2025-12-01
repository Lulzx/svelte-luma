import { getContext, setContext } from 'svelte';
import type { Device } from '@luma.gl/core';

const LUMA_CONTEXT_KEY = Symbol('luma-context');
const RENDER_CONTEXT_KEY = Symbol('luma-render');

export interface LumaContext {
	getDevice: () => Device | null;
	isReady: () => boolean;
}

export interface RenderContext {
	addRenderCallback: (callback: () => void) => void;
	removeRenderCallback: (callback: () => void) => void;
}

export function setLumaContext(context: LumaContext): void {
	setContext(LUMA_CONTEXT_KEY, context);
}

export function getLumaContext(): LumaContext {
	const context = getContext<LumaContext>(LUMA_CONTEXT_KEY);
	if (!context) {
		throw new Error('Luma context not found. Make sure component is inside <Canvas>');
	}
	return context;
}

export function setRenderContext(context: RenderContext): void {
	setContext(RENDER_CONTEXT_KEY, context);
}

export function getRenderContext(): RenderContext {
	const context = getContext<RenderContext>(RENDER_CONTEXT_KEY);
	if (!context) {
		throw new Error('Render context not found. Make sure component is inside <Canvas>');
	}
	return context;
}
