<script lang="ts">
	import { Canvas, Scene, OrbitCamera } from '$lib/index.js';
	import { Model as LumaModel, Geometry } from '@luma.gl/engine';
	import type { Device } from '@luma.gl/core';

	const GRID_SIZE = 10;
	const SPACING = 1.5;
	const INSTANCE_COUNT = GRID_SIZE * GRID_SIZE * GRID_SIZE;

	let model: LumaModel | null = null;
	let time = $state(0);

	const instancePositions = new Float32Array(INSTANCE_COUNT * 3);
	const instanceColors = new Float32Array(INSTANCE_COUNT * 4);

	// Initialize instance data
	let idx = 0;
	for (let x = 0; x < GRID_SIZE; x++) {
		for (let y = 0; y < GRID_SIZE; y++) {
			for (let z = 0; z < GRID_SIZE; z++) {
				const px = (x - GRID_SIZE / 2) * SPACING;
				const py = (y - GRID_SIZE / 2) * SPACING;
				const pz = (z - GRID_SIZE / 2) * SPACING;

				instancePositions[idx * 3] = px;
				instancePositions[idx * 3 + 1] = py;
				instancePositions[idx * 3 + 2] = pz;

				instanceColors[idx * 4] = x / GRID_SIZE;
				instanceColors[idx * 4 + 1] = y / GRID_SIZE;
				instanceColors[idx * 4 + 2] = z / GRID_SIZE;
				instanceColors[idx * 4 + 3] = 1;

				idx++;
			}
		}
	}

	// Simple cube geometry
	const cubePositions = new Float32Array([
		// Front
		-0.2, -0.2, 0.2, 0.2, -0.2, 0.2, 0.2, 0.2, 0.2, -0.2, -0.2, 0.2, 0.2, 0.2, 0.2, -0.2, 0.2, 0.2,
		// Back
		-0.2, -0.2, -0.2, -0.2, 0.2, -0.2, 0.2, 0.2, -0.2, -0.2, -0.2, -0.2, 0.2, 0.2, -0.2, 0.2, -0.2, -0.2,
		// Top
		-0.2, 0.2, -0.2, -0.2, 0.2, 0.2, 0.2, 0.2, 0.2, -0.2, 0.2, -0.2, 0.2, 0.2, 0.2, 0.2, 0.2, -0.2,
		// Bottom
		-0.2, -0.2, -0.2, 0.2, -0.2, -0.2, 0.2, -0.2, 0.2, -0.2, -0.2, -0.2, 0.2, -0.2, 0.2, -0.2, -0.2, 0.2,
		// Right
		0.2, -0.2, -0.2, 0.2, 0.2, -0.2, 0.2, 0.2, 0.2, 0.2, -0.2, -0.2, 0.2, 0.2, 0.2, 0.2, -0.2, 0.2,
		// Left
		-0.2, -0.2, -0.2, -0.2, -0.2, 0.2, -0.2, 0.2, 0.2, -0.2, -0.2, -0.2, -0.2, 0.2, 0.2, -0.2, 0.2, -0.2
	]);

	const VS = /* glsl */ `#version 300 es
layout(location = 0) in vec3 positions;
layout(location = 1) in vec3 instancePositions;
layout(location = 2) in vec4 instanceColors;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

out vec4 vColor;

void main() {
  vColor = instanceColors;

  // Add some wave animation
  vec3 pos = positions;
  float wave = sin(uTime * 0.002 + instancePositions.x * 0.5 + instancePositions.z * 0.5) * 0.3;

  vec3 finalPos = pos + instancePositions + vec3(0.0, wave, 0.0);
  gl_Position = uProjectionMatrix * uViewMatrix * vec4(finalPos, 1.0);
}`;

	const FS = /* glsl */ `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
  fragColor = vColor;
}`;

	function handleDeviceCreated(device: Device) {
		const geometry = new Geometry({
			topology: 'triangle-list',
			attributes: {
				positions: { size: 3, value: cubePositions },
				instancePositions: { size: 3, value: instancePositions, divisor: 1 },
				instanceColors: { size: 4, value: instanceColors, divisor: 1 }
			}
		});

		model = new LumaModel(device, {
			vs: VS,
			fs: FS,
			geometry,
			instanceCount: INSTANCE_COUNT,
			shaderLayout: {
				attributes: [
					{ name: 'positions', location: 0, format: 'float32x3' },
					{ name: 'instancePositions', location: 1, format: 'float32x3', stepMode: 'instance' },
					{ name: 'instanceColors', location: 2, format: 'float32x4', stepMode: 'instance' }
				],
				bindings: []
			},
			parameters: {
				depthFormat: 'depth24plus',
				cullMode: 'back',
				depthWriteEnabled: true,
				depthCompare: 'less'
			}
		});
	}

	function handleFrame(ctx: { time: number; device: Device }) {
		time = ctx.time;

		if (!model) return;

		const aspect = 600 / 400;
		const fov = Math.PI / 4;
		const near = 0.1;
		const far = 1000;
		const f = 1.0 / Math.tan(fov / 2);
		const nf = 1 / (near - far);

		const projectionMatrix = new Float32Array([
			f / aspect, 0, 0, 0,
			0, f, 0, 0,
			0, 0, (far + near) * nf, -1,
			0, 0, 2 * far * near * nf, 0
		]);

		const camDist = 20;
		const camY = 10;
		const camAngle = ctx.time * 0.0003;
		const camX = Math.sin(camAngle) * camDist;
		const camZ = Math.cos(camAngle) * camDist;

		// Simple lookAt
		const z0 = camX, z1 = camY, z2 = camZ;
		const len = Math.hypot(z0, z1, z2);
		const zn0 = z0/len, zn1 = z1/len, zn2 = z2/len;
		const x0 = zn2, x2 = -zn0;
		const xlen = Math.hypot(x0, x2);
		const xn0 = x0/xlen, xn2 = x2/xlen;
		const y0 = zn1 * xn2;
		const y1 = zn2 * xn0 - zn0 * xn2;
		const y2 = -zn1 * xn0;

		const viewMatrix = new Float32Array([
			xn0, y0, zn0, 0,
			0, y1, zn1, 0,
			xn2, y2, zn2, 0,
			-(xn0 * camX + xn2 * camZ),
			-(y0 * camX + y1 * camY + y2 * camZ),
			-(zn0 * camX + zn1 * camY + zn2 * camZ),
			1
		]);

		model.setUniforms({
			uViewMatrix: viewMatrix,
			uProjectionMatrix: projectionMatrix,
			uTime: ctx.time
		});

		const renderPass = ctx.device.beginRenderPass({ clearColor: [0.05, 0.05, 0.1, 1] });
		model.draw(renderPass);
		renderPass.end();
	}
</script>

<main>
	<h1>Instancing</h1>
	<p>1000 cubes rendered with GPU instancing. Each instance has unique position and color.</p>

	<a href="/">← Back to examples</a>

	<div class="canvas-container">
		<Canvas
			width={600}
			height={400}
			clearColor={[0.05, 0.05, 0.1, 1]}
			autoClear={false}
			ondevicecreated={handleDeviceCreated}
			onframe={handleFrame}
		/>
	</div>

	<p class="stats">Rendering {INSTANCE_COUNT.toLocaleString()} instances</p>

	<details>
		<summary>View Source</summary>
		<pre><code>{`// GPU Instancing with svelte-luma
// Creates 1000 cubes with unique positions and colors

const GRID_SIZE = 10;
const INSTANCE_COUNT = GRID_SIZE * GRID_SIZE * GRID_SIZE;

const geometry = new Geometry({
  topology: 'triangle-list',
  attributes: {
    positions: { size: 3, value: cubePositions },
    instancePositions: { size: 3, value: instancePositions, divisor: 1 },
    instanceColors: { size: 4, value: instanceColors, divisor: 1 }
  }
});

model = new LumaModel(device, {
  vs: VS,
  fs: FS,
  geometry,
  instanceCount: INSTANCE_COUNT,
  // ...
});`}</code></pre>
	</details>
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	h1 {
		margin-bottom: 0.5rem;
	}

	p {
		color: #999;
		margin-bottom: 1rem;
	}

	a {
		color: #88f;
	}

	.canvas-container {
		margin: 2rem 0;
		border-radius: 8px;
		overflow: hidden;
		display: inline-block;
	}

	.stats {
		font-size: 0.875rem;
		color: #666;
	}

	details {
		margin-top: 2rem;
	}

	summary {
		cursor: pointer;
		color: #88f;
	}

	pre {
		background: #2a2a2a;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
	}

	code {
		font-size: 0.875rem;
	}
</style>
