import type { GeometryData } from './types.js';

export function createTriangleGeometry(): GeometryData {
	return {
		positions: new Float32Array([0.0, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0]),
		colors: new Float32Array([1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0])
	};
}

export function createQuadGeometry(): GeometryData {
	return {
		positions: new Float32Array([
			-1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0
		]),
		texCoords: new Float32Array([0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]),
		indices: new Uint16Array([0, 1, 2, 0, 2, 3])
	};
}

export function createPlaneGeometry(
	width = 1,
	height = 1,
	widthSegments = 1,
	heightSegments = 1
): GeometryData {
	const positions: number[] = [];
	const normals: number[] = [];
	const texCoords: number[] = [];
	const indices: number[] = [];

	const widthHalf = width / 2;
	const heightHalf = height / 2;
	const gridX = widthSegments;
	const gridY = heightSegments;
	const gridX1 = gridX + 1;
	const gridY1 = gridY + 1;
	const segmentWidth = width / gridX;
	const segmentHeight = height / gridY;

	for (let iy = 0; iy < gridY1; iy++) {
		const y = iy * segmentHeight - heightHalf;
		for (let ix = 0; ix < gridX1; ix++) {
			const x = ix * segmentWidth - widthHalf;
			positions.push(x, -y, 0);
			normals.push(0, 0, 1);
			texCoords.push(ix / gridX, 1 - iy / gridY);
		}
	}

	for (let iy = 0; iy < gridY; iy++) {
		for (let ix = 0; ix < gridX; ix++) {
			const a = ix + gridX1 * iy;
			const b = ix + gridX1 * (iy + 1);
			const c = ix + 1 + gridX1 * (iy + 1);
			const d = ix + 1 + gridX1 * iy;
			indices.push(a, b, d, b, c, d);
		}
	}

	return {
		positions: new Float32Array(positions),
		normals: new Float32Array(normals),
		texCoords: new Float32Array(texCoords),
		indices: new Uint16Array(indices)
	};
}

export function createCubeGeometry(size = 1): GeometryData {
	const s = size / 2;

	const positions = new Float32Array([
		-s, -s, s, s, -s, s, s, s, s, -s, s, s,
		-s, -s, -s, -s, s, -s, s, s, -s, s, -s, -s,
		-s, s, -s, -s, s, s, s, s, s, s, s, -s,
		-s, -s, -s, s, -s, -s, s, -s, s, -s, -s, s,
		s, -s, -s, s, s, -s, s, s, s, s, -s, s,
		-s, -s, -s, -s, -s, s, -s, s, s, -s, s, -s
	]);

	const normals = new Float32Array([
		0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
		0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
		0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
		0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
		1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
		-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
	]);

	const texCoords = new Float32Array([
		0, 0, 1, 0, 1, 1, 0, 1,
		1, 0, 1, 1, 0, 1, 0, 0,
		0, 1, 0, 0, 1, 0, 1, 1,
		1, 1, 0, 1, 0, 0, 1, 0,
		1, 0, 1, 1, 0, 1, 0, 0,
		0, 0, 1, 0, 1, 1, 0, 1
	]);

	const indices = new Uint16Array([
		0, 1, 2, 0, 2, 3,
		4, 5, 6, 4, 6, 7,
		8, 9, 10, 8, 10, 11,
		12, 13, 14, 12, 14, 15,
		16, 17, 18, 16, 18, 19,
		20, 21, 22, 20, 22, 23
	]);

	return { positions, normals, texCoords, indices };
}

export function createSphereGeometry(
	radius = 1,
	widthSegments = 32,
	heightSegments = 16
): GeometryData {
	const positions: number[] = [];
	const normals: number[] = [];
	const texCoords: number[] = [];
	const indices: number[] = [];

	for (let y = 0; y <= heightSegments; y++) {
		const v = y / heightSegments;
		const theta = v * Math.PI;

		for (let x = 0; x <= widthSegments; x++) {
			const u = x / widthSegments;
			const phi = u * Math.PI * 2;

			const px = -radius * Math.cos(phi) * Math.sin(theta);
			const py = radius * Math.cos(theta);
			const pz = radius * Math.sin(phi) * Math.sin(theta);

			positions.push(px, py, pz);
			normals.push(px / radius, py / radius, pz / radius);
			texCoords.push(u, 1 - v);
		}
	}

	for (let y = 0; y < heightSegments; y++) {
		for (let x = 0; x < widthSegments; x++) {
			const a = y * (widthSegments + 1) + x;
			const b = a + widthSegments + 1;

			indices.push(a, b, a + 1);
			indices.push(b, b + 1, a + 1);
		}
	}

	return {
		positions: new Float32Array(positions),
		normals: new Float32Array(normals),
		texCoords: new Float32Array(texCoords),
		indices: new Uint16Array(indices)
	};
}

export function createCircleGeometry(radius = 1, segments = 32): GeometryData {
	const positions: number[] = [0, 0, 0];
	const normals: number[] = [0, 0, 1];
	const texCoords: number[] = [0.5, 0.5];
	const indices: number[] = [];

	for (let i = 0; i <= segments; i++) {
		const theta = (i / segments) * Math.PI * 2;
		const x = Math.cos(theta) * radius;
		const y = Math.sin(theta) * radius;

		positions.push(x, y, 0);
		normals.push(0, 0, 1);
		texCoords.push((x / radius + 1) / 2, (y / radius + 1) / 2);

		if (i > 0) {
			indices.push(0, i, i + 1);
		}
	}
	indices.pop();
	indices.pop();
	indices.pop();
	indices.push(0, segments, 1);

	return {
		positions: new Float32Array(positions),
		normals: new Float32Array(normals),
		texCoords: new Float32Array(texCoords),
		indices: new Uint16Array(indices)
	};
}

export function createCylinderGeometry(
	radiusTop = 1,
	radiusBottom = 1,
	height = 1,
	radialSegments = 32,
	heightSegments = 1
): GeometryData {
	const positions: number[] = [];
	const normals: number[] = [];
	const texCoords: number[] = [];
	const indices: number[] = [];

	const halfHeight = height / 2;

	for (let y = 0; y <= heightSegments; y++) {
		const v = y / heightSegments;
		const radius = v * (radiusBottom - radiusTop) + radiusTop;
		const py = v * height - halfHeight;

		for (let x = 0; x <= radialSegments; x++) {
			const u = x / radialSegments;
			const theta = u * Math.PI * 2;

			const sinTheta = Math.sin(theta);
			const cosTheta = Math.cos(theta);

			positions.push(radius * sinTheta, py, radius * cosTheta);
			normals.push(sinTheta, 0, cosTheta);
			texCoords.push(u, 1 - v);
		}
	}

	for (let y = 0; y < heightSegments; y++) {
		for (let x = 0; x < radialSegments; x++) {
			const a = y * (radialSegments + 1) + x;
			const b = a + radialSegments + 1;

			indices.push(a, b, a + 1);
			indices.push(b, b + 1, a + 1);
		}
	}

	return {
		positions: new Float32Array(positions),
		normals: new Float32Array(normals),
		texCoords: new Float32Array(texCoords),
		indices: new Uint16Array(indices)
	};
}

export function createTorusGeometry(
	radius = 1,
	tube = 0.4,
	radialSegments = 32,
	tubularSegments = 64
): GeometryData {
	const positions: number[] = [];
	const normals: number[] = [];
	const texCoords: number[] = [];
	const indices: number[] = [];

	for (let j = 0; j <= radialSegments; j++) {
		for (let i = 0; i <= tubularSegments; i++) {
			const u = (i / tubularSegments) * Math.PI * 2;
			const v = (j / radialSegments) * Math.PI * 2;

			const x = (radius + tube * Math.cos(v)) * Math.cos(u);
			const y = (radius + tube * Math.cos(v)) * Math.sin(u);
			const z = tube * Math.sin(v);

			positions.push(x, y, z);

			const nx = Math.cos(v) * Math.cos(u);
			const ny = Math.cos(v) * Math.sin(u);
			const nz = Math.sin(v);
			normals.push(nx, ny, nz);

			texCoords.push(i / tubularSegments, j / radialSegments);
		}
	}

	for (let j = 1; j <= radialSegments; j++) {
		for (let i = 1; i <= tubularSegments; i++) {
			const a = (tubularSegments + 1) * j + i - 1;
			const b = (tubularSegments + 1) * (j - 1) + i - 1;
			const c = (tubularSegments + 1) * (j - 1) + i;
			const d = (tubularSegments + 1) * j + i;

			indices.push(a, b, d);
			indices.push(b, c, d);
		}
	}

	return {
		positions: new Float32Array(positions),
		normals: new Float32Array(normals),
		texCoords: new Float32Array(texCoords),
		indices: new Uint16Array(indices)
	};
}
