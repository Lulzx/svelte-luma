// ============================================================================
// Matrix Pool - Eliminates per-frame allocations
// ============================================================================

class MatrixPool {
	private pool: Float32Array[] = [];
	private index: number = 0;
	private readonly poolSize: number = 64;

	constructor() {
		for (let i = 0; i < this.poolSize; i++) {
			this.pool.push(new Float32Array(16));
		}
	}

	acquire(): Float32Array {
		if (this.index >= this.pool.length) {
			// Expand pool if needed
			this.pool.push(new Float32Array(16));
		}
		return this.pool[this.index++];
	}

	reset(): void {
		this.index = 0;
	}
}

const matrixPool = new MatrixPool();

export function resetMatrixPool(): void {
	matrixPool.reset();
}

// ============================================================================
// Vector Operations
// ============================================================================

export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Mat4 = Float32Array;

export function vec3(x: number = 0, y: number = 0, z: number = 0): Vec3 {
	return [x, y, z];
}

export function vec3Add(a: Vec3, b: Vec3): Vec3 {
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vec3Scale(v: Vec3, s: number): Vec3 {
	return [v[0] * s, v[1] * s, v[2] * s];
}

export function vec3Dot(a: Vec3, b: Vec3): number {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]
	];
}

export function vec3Length(v: Vec3): number {
	return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

export function vec3Normalize(v: Vec3): Vec3 {
	const len = vec3Length(v);
	if (len === 0) return [0, 0, 0];
	return [v[0] / len, v[1] / len, v[2] / len];
}

export function vec3Lerp(a: Vec3, b: Vec3, t: number): Vec3 {
	return [
		a[0] + (b[0] - a[0]) * t,
		a[1] + (b[1] - a[1]) * t,
		a[2] + (b[2] - a[2]) * t
	];
}

// ============================================================================
// Scalar Utilities
// ============================================================================

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

export function smoothstep(edge0: number, edge1: number, x: number): number {
	const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
	return t * t * (3 - 2 * t);
}

// ============================================================================
// Matrix Creation (with optional pooling)
// ============================================================================

export function mat4Identity(out?: Float32Array): Float32Array {
	const m = out ?? matrixPool.acquire();
	m[0] = 1; m[1] = 0; m[2] = 0; m[3] = 0;
	m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0;
	m[8] = 0; m[9] = 0; m[10] = 1; m[11] = 0;
	m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
	return m;
}

export function mat4Clone(src: Float32Array): Float32Array {
	const m = new Float32Array(16);
	m.set(src);
	return m;
}

export function mat4Copy(out: Float32Array, src: Float32Array): Float32Array {
	out.set(src);
	return out;
}

export function mat4Perspective(
	fov: number,
	aspect: number,
	near: number,
	far: number,
	out?: Float32Array
): Float32Array {
	const m = out ?? matrixPool.acquire();
	const f = 1.0 / Math.tan(fov / 2);
	const nf = 1 / (near - far);

	m[0] = f / aspect; m[1] = 0; m[2] = 0; m[3] = 0;
	m[4] = 0; m[5] = f; m[6] = 0; m[7] = 0;
	m[8] = 0; m[9] = 0; m[10] = (far + near) * nf; m[11] = -1;
	m[12] = 0; m[13] = 0; m[14] = 2 * far * near * nf; m[15] = 0;

	return m;
}

export function mat4Orthographic(
	left: number,
	right: number,
	bottom: number,
	top: number,
	near: number,
	far: number,
	out?: Float32Array
): Float32Array {
	const m = out ?? matrixPool.acquire();
	const lr = 1 / (left - right);
	const bt = 1 / (bottom - top);
	const nf = 1 / (near - far);

	m[0] = -2 * lr; m[1] = 0; m[2] = 0; m[3] = 0;
	m[4] = 0; m[5] = -2 * bt; m[6] = 0; m[7] = 0;
	m[8] = 0; m[9] = 0; m[10] = 2 * nf; m[11] = 0;
	m[12] = (left + right) * lr; m[13] = (top + bottom) * bt; m[14] = (far + near) * nf; m[15] = 1;

	return m;
}

export function mat4LookAt(
	eye: Vec3,
	center: Vec3,
	up: Vec3,
	out?: Float32Array
): Float32Array {
	const m = out ?? matrixPool.acquire();
	const [ex, ey, ez] = eye;
	const [cx, cy, cz] = center;
	const [ux, uy, uz] = up;

	let z0 = ex - cx;
	let z1 = ey - cy;
	let z2 = ez - cz;
	let len = Math.hypot(z0, z1, z2);
	if (len === 0) {
		z0 = 0; z1 = 0; z2 = 1;
	} else {
		z0 /= len; z1 /= len; z2 /= len;
	}

	let x0 = uy * z2 - uz * z1;
	let x1 = uz * z0 - ux * z2;
	let x2 = ux * z1 - uy * z0;
	len = Math.hypot(x0, x1, x2);
	if (len === 0) {
		x0 = 0; x1 = 0; x2 = 0;
	} else {
		x0 /= len; x1 /= len; x2 /= len;
	}

	const y0 = z1 * x2 - z2 * x1;
	const y1 = z2 * x0 - z0 * x2;
	const y2 = z0 * x1 - z1 * x0;

	m[0] = x0; m[1] = y0; m[2] = z0; m[3] = 0;
	m[4] = x1; m[5] = y1; m[6] = z1; m[7] = 0;
	m[8] = x2; m[9] = y2; m[10] = z2; m[11] = 0;
	m[12] = -(x0 * ex + x1 * ey + x2 * ez);
	m[13] = -(y0 * ex + y1 * ey + y2 * ez);
	m[14] = -(z0 * ex + z1 * ey + z2 * ez);
	m[15] = 1;

	return m;
}

export function mat4Translation(x: number, y: number, z: number, out?: Float32Array): Float32Array {
	const m = out ?? matrixPool.acquire();
	m[0] = 1; m[1] = 0; m[2] = 0; m[3] = 0;
	m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0;
	m[8] = 0; m[9] = 0; m[10] = 1; m[11] = 0;
	m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
	return m;
}

export function mat4Scaling(x: number, y: number, z: number, out?: Float32Array): Float32Array {
	const m = out ?? matrixPool.acquire();
	m[0] = x; m[1] = 0; m[2] = 0; m[3] = 0;
	m[4] = 0; m[5] = y; m[6] = 0; m[7] = 0;
	m[8] = 0; m[9] = 0; m[10] = z; m[11] = 0;
	m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
	return m;
}

export function mat4RotationX(angle: number, out?: Float32Array): Float32Array {
	const m = out ?? matrixPool.acquire();
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	m[0] = 1; m[1] = 0; m[2] = 0; m[3] = 0;
	m[4] = 0; m[5] = c; m[6] = s; m[7] = 0;
	m[8] = 0; m[9] = -s; m[10] = c; m[11] = 0;
	m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
	return m;
}

export function mat4RotationY(angle: number, out?: Float32Array): Float32Array {
	const m = out ?? matrixPool.acquire();
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	m[0] = c; m[1] = 0; m[2] = -s; m[3] = 0;
	m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0;
	m[8] = s; m[9] = 0; m[10] = c; m[11] = 0;
	m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
	return m;
}

export function mat4RotationZ(angle: number, out?: Float32Array): Float32Array {
	const m = out ?? matrixPool.acquire();
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	m[0] = c; m[1] = s; m[2] = 0; m[3] = 0;
	m[4] = -s; m[5] = c; m[6] = 0; m[7] = 0;
	m[8] = 0; m[9] = 0; m[10] = 1; m[11] = 0;
	m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
	return m;
}

export function mat4FromEuler(x: number, y: number, z: number, out?: Float32Array): Float32Array {
	const m = out ?? matrixPool.acquire();
	const cx = Math.cos(x), sx = Math.sin(x);
	const cy = Math.cos(y), sy = Math.sin(y);
	const cz = Math.cos(z), sz = Math.sin(z);

	// ZYX order (common convention)
	m[0] = cy * cz;
	m[1] = cy * sz;
	m[2] = -sy;
	m[3] = 0;
	m[4] = sx * sy * cz - cx * sz;
	m[5] = sx * sy * sz + cx * cz;
	m[6] = sx * cy;
	m[7] = 0;
	m[8] = cx * sy * cz + sx * sz;
	m[9] = cx * sy * sz - sx * cz;
	m[10] = cx * cy;
	m[11] = 0;
	m[12] = 0;
	m[13] = 0;
	m[14] = 0;
	m[15] = 1;

	return m;
}

export function mat4FromQuaternion(q: [number, number, number, number], out?: Float32Array): Float32Array {
	const m = out ?? matrixPool.acquire();
	const [x, y, z, w] = q;
	const x2 = x + x, y2 = y + y, z2 = z + z;
	const xx = x * x2, xy = x * y2, xz = x * z2;
	const yy = y * y2, yz = y * z2, zz = z * z2;
	const wx = w * x2, wy = w * y2, wz = w * z2;

	m[0] = 1 - (yy + zz); m[1] = xy + wz; m[2] = xz - wy; m[3] = 0;
	m[4] = xy - wz; m[5] = 1 - (xx + zz); m[6] = yz + wx; m[7] = 0;
	m[8] = xz + wy; m[9] = yz - wx; m[10] = 1 - (xx + yy); m[11] = 0;
	m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;

	return m;
}

// ============================================================================
// Matrix Operations
// ============================================================================

export function mat4Multiply(a: Float32Array, b: Float32Array, out?: Float32Array): Float32Array {
	const m = out ?? matrixPool.acquire();

	const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
	const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
	const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
	const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

	let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
	m[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	m[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	m[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	m[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
	m[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	m[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	m[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	m[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
	m[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	m[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	m[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	m[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
	m[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	m[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	m[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	m[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	return m;
}

export function mat4Invert(a: Float32Array, out?: Float32Array): Float32Array | null {
	const m = out ?? matrixPool.acquire();

	const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
	const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
	const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
	const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

	const b00 = a00 * a11 - a01 * a10;
	const b01 = a00 * a12 - a02 * a10;
	const b02 = a00 * a13 - a03 * a10;
	const b03 = a01 * a12 - a02 * a11;
	const b04 = a01 * a13 - a03 * a11;
	const b05 = a02 * a13 - a03 * a12;
	const b06 = a20 * a31 - a21 * a30;
	const b07 = a20 * a32 - a22 * a30;
	const b08 = a20 * a33 - a23 * a30;
	const b09 = a21 * a32 - a22 * a31;
	const b10 = a21 * a33 - a23 * a31;
	const b11 = a22 * a33 - a23 * a32;

	let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

	if (!det) return null;
	det = 1.0 / det;

	m[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	m[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	m[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	m[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	m[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	m[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	m[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	m[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	m[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	m[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	m[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	m[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	m[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	m[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	m[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	m[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

	return m;
}

export function mat4Transpose(a: Float32Array, out?: Float32Array): Float32Array {
	const m = out ?? matrixPool.acquire();

	m[0] = a[0]; m[1] = a[4]; m[2] = a[8]; m[3] = a[12];
	m[4] = a[1]; m[5] = a[5]; m[6] = a[9]; m[7] = a[13];
	m[8] = a[2]; m[9] = a[6]; m[10] = a[10]; m[11] = a[14];
	m[12] = a[3]; m[13] = a[7]; m[14] = a[11]; m[15] = a[15];

	return m;
}

// ============================================================================
// Compose/Decompose TRS
// ============================================================================

export function mat4Compose(
	position: Vec3,
	rotation: Vec3,
	scale: Vec3,
	out?: Float32Array
): Float32Array {
	const m = out ?? matrixPool.acquire();

	const [px, py, pz] = position;
	const [rx, ry, rz] = rotation;
	const [sx, sy, sz] = scale;

	const cx = Math.cos(rx), sx_ = Math.sin(rx);
	const cy = Math.cos(ry), sy_ = Math.sin(ry);
	const cz = Math.cos(rz), sz_ = Math.sin(rz);

	// Combine rotation and scale in one pass (ZYX order)
	m[0] = cy * cz * sx;
	m[1] = cy * sz_ * sx;
	m[2] = -sy_ * sx;
	m[3] = 0;

	m[4] = (sx_ * sy_ * cz - cx * sz_) * sy;
	m[5] = (sx_ * sy_ * sz_ + cx * cz) * sy;
	m[6] = sx_ * cy * sy;
	m[7] = 0;

	m[8] = (cx * sy_ * cz + sx_ * sz_) * sz;
	m[9] = (cx * sy_ * sz_ - sx_ * cz) * sz;
	m[10] = cx * cy * sz;
	m[11] = 0;

	m[12] = px;
	m[13] = py;
	m[14] = pz;
	m[15] = 1;

	return m;
}

// ============================================================================
// Transform Helpers
// ============================================================================

export function mat4TransformPoint(m: Float32Array, p: Vec3): Vec3 {
	const [x, y, z] = p;
	const w = m[3] * x + m[7] * y + m[11] * z + m[15];
	return [
		(m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
		(m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
		(m[2] * x + m[6] * y + m[10] * z + m[14]) / w
	];
}

export function mat4TransformDirection(m: Float32Array, d: Vec3): Vec3 {
	const [x, y, z] = d;
	return [
		m[0] * x + m[4] * y + m[8] * z,
		m[1] * x + m[5] * y + m[9] * z,
		m[2] * x + m[6] * y + m[10] * z
	];
}

