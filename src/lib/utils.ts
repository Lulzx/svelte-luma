import type { Device } from '@luma.gl/core';
import type { Backend } from './types.js';

export async function createDevice(
	canvas: HTMLCanvasElement,
	backend: Backend = 'best'
): Promise<Device> {
	if (backend === 'webgpu' || backend === 'best') {
		try {
			const { webgpuAdapter } = await import('@luma.gl/webgpu');
			const device = await webgpuAdapter.create({ canvas });
			return device;
		} catch (e) {
			if (backend === 'webgpu') {
				throw new Error('WebGPU not supported in this browser');
			}
			// Fall through to WebGL
		}
	}

	const { webgl2Adapter } = await import('@luma.gl/webgl');
	const device = await webgl2Adapter.create({ canvas });
	return device;
}

export function degToRad(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number): number {
	return (radians * 180) / Math.PI;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

export function createIdentityMatrix(): Float32Array {
	return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

export function createPerspectiveMatrix(
	fov: number,
	aspect: number,
	near: number,
	far: number
): Float32Array {
	const f = 1.0 / Math.tan(fov / 2);
	const nf = 1 / (near - far);

	return new Float32Array([
		f / aspect,
		0,
		0,
		0,
		0,
		f,
		0,
		0,
		0,
		0,
		(far + near) * nf,
		-1,
		0,
		0,
		2 * far * near * nf,
		0
	]);
}

export function createOrthographicMatrix(
	left: number,
	right: number,
	bottom: number,
	top: number,
	near: number,
	far: number
): Float32Array {
	const lr = 1 / (left - right);
	const bt = 1 / (bottom - top);
	const nf = 1 / (near - far);

	return new Float32Array([
		-2 * lr,
		0,
		0,
		0,
		0,
		-2 * bt,
		0,
		0,
		0,
		0,
		2 * nf,
		0,
		(left + right) * lr,
		(top + bottom) * bt,
		(far + near) * nf,
		1
	]);
}

export function createLookAtMatrix(
	eye: [number, number, number],
	center: [number, number, number],
	up: [number, number, number]
): Float32Array {
	const [ex, ey, ez] = eye;
	const [cx, cy, cz] = center;
	const [ux, uy, uz] = up;

	let z0 = ex - cx;
	let z1 = ey - cy;
	let z2 = ez - cz;
	let len = Math.hypot(z0, z1, z2);
	z0 /= len;
	z1 /= len;
	z2 /= len;

	let x0 = uy * z2 - uz * z1;
	let x1 = uz * z0 - ux * z2;
	let x2 = ux * z1 - uy * z0;
	len = Math.hypot(x0, x1, x2);
	x0 /= len;
	x1 /= len;
	x2 /= len;

	const y0 = z1 * x2 - z2 * x1;
	const y1 = z2 * x0 - z0 * x2;
	const y2 = z0 * x1 - z1 * x0;

	return new Float32Array([
		x0,
		y0,
		z0,
		0,
		x1,
		y1,
		z1,
		0,
		x2,
		y2,
		z2,
		0,
		-(x0 * ex + x1 * ey + x2 * ez),
		-(y0 * ex + y1 * ey + y2 * ez),
		-(z0 * ex + z1 * ey + z2 * ez),
		1
	]);
}

export function multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
	const result = new Float32Array(16);
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			result[i * 4 + j] =
				a[i * 4 + 0] * b[0 * 4 + j] +
				a[i * 4 + 1] * b[1 * 4 + j] +
				a[i * 4 + 2] * b[2 * 4 + j] +
				a[i * 4 + 3] * b[3 * 4 + j];
		}
	}
	return result;
}

export function createRotationMatrixX(angle: number): Float32Array {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

export function createRotationMatrixY(angle: number): Float32Array {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

export function createRotationMatrixZ(angle: number): Float32Array {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

export function createTranslationMatrix(x: number, y: number, z: number): Float32Array {
	return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
}

export function createScaleMatrix(x: number, y: number, z: number): Float32Array {
	return new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);
}
