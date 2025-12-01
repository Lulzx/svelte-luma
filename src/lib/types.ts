import type { Device, DeviceProps } from '@luma.gl/core';
import type { ModelProps, Geometry } from '@luma.gl/engine';

export type Backend = 'webgl' | 'webgpu' | 'best';

export interface LumaContextValue {
	device: Device | null;
	backend: Backend;
	ready: boolean;
	error: Error | null;
}

export interface CanvasProps {
	width?: number;
	height?: number;
	pixelRatio?: number;
	backend?: Backend;
	deviceProps?: Partial<DeviceProps>;
	clearColor?: [number, number, number, number];
	clearDepth?: number;
	autoClear?: boolean;
	class?: string;
	style?: string;
}

export interface ModelComponentProps {
	vs?: string;
	fs?: string;
	source?: string;
	geometry?: Geometry;
	topology?: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
	vertexCount?: number;
	instanceCount?: number;
	uniforms?: Record<string, unknown>;
	bindings?: Record<string, unknown>;
	parameters?: ModelProps['parameters'];
	shaderLayout?: ModelProps['shaderLayout'];
}

export interface BufferProps {
	data?: ArrayBufferView | number[];
	byteLength?: number;
	usage?: number;
}

export interface TextureProps {
	data?: ArrayBufferView | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
	width?: number;
	height?: number;
	format?: string;
	mipmaps?: boolean;
}

export interface AnimationContext {
	time: number;
	deltaTime: number;
	frameCount: number;
	device: Device;
}

export type RenderCallback = (context: AnimationContext) => void;

export interface GeometryData {
	positions?: Float32Array | number[];
	normals?: Float32Array | number[];
	texCoords?: Float32Array | number[];
	indices?: Uint16Array | Uint32Array | number[];
	colors?: Float32Array | number[];
}
