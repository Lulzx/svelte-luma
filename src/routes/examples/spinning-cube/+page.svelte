<script lang="ts">
	import { Canvas, Scene, Mesh, OrbitCamera, createCubeGeometry, degToRad } from '$lib/index.js';

	const cubeGeometry = createCubeGeometry(1);

	// Add colors to the cube
	const colors = new Float32Array(24 * 4);
	const faceColors = [
		[1, 0, 0, 1], // Front - red
		[0, 1, 0, 1], // Back - green
		[0, 0, 1, 1], // Top - blue
		[1, 1, 0, 1], // Bottom - yellow
		[1, 0, 1, 1], // Right - magenta
		[0, 1, 1, 1] // Left - cyan
	];
	for (let f = 0; f < 6; f++) {
		for (let v = 0; v < 4; v++) {
			const idx = (f * 4 + v) * 4;
			colors[idx] = faceColors[f][0];
			colors[idx + 1] = faceColors[f][1];
			colors[idx + 2] = faceColors[f][2];
			colors[idx + 3] = faceColors[f][3];
		}
	}
	cubeGeometry.colors = colors;

	let rotation = $state([0, 0, 0] as [number, number, number]);

	const VS = /* glsl */ `#version 300 es
layout(location = 0) in vec3 positions;
layout(location = 1) in vec4 colors;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec4 vColor;

void main() {
  vColor = colors;
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(positions, 1.0);
}`;

	const FS = /* glsl */ `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
  fragColor = vColor;
}`;

	function handleFrame(ctx: { time: number }) {
		rotation = [ctx.time * 0.0005, ctx.time * 0.001, ctx.time * 0.0003];
	}
</script>

<main>
	<h1>Spinning Cube</h1>
	<p>A 3D cube with per-face colors. Drag to orbit, scroll to zoom.</p>

	<a href="/">← Back to examples</a>

	<div class="canvas-container">
		<Canvas width={600} height={400} clearColor={[0.1, 0.1, 0.15, 1]} onframe={handleFrame}>
			<Scene>
				<OrbitCamera distance={3} rotationX={0.3} rotationY={0.5}>
					<Mesh
						geometry={cubeGeometry}
						vs={VS}
						fs={FS}
						{rotation}
						parameters={{
							cullMode: 'back',
							depthWriteEnabled: true,
							depthCompare: 'less'
						}}
					/>
				</OrbitCamera>
			</Scene>
		</Canvas>
	</div>

	<details>
		<summary>View Source</summary>
		<pre><code>{`<script lang="ts">
  import { Canvas, Scene, Mesh, OrbitCamera, createCubeGeometry } from 'svelte-luma';

  const cubeGeometry = createCubeGeometry(1);
  // ... add face colors ...

  let rotation = $state([0, 0, 0]);

  function handleFrame(ctx) {
    rotation = [ctx.time * 0.0005, ctx.time * 0.001, ctx.time * 0.0003];
  }
<\/script>

<Canvas width={600} height={400} onframe={handleFrame}>
  <Scene>
    <OrbitCamera distance={3}>
      <Mesh
        geometry={cubeGeometry}
        vs={VS}
        fs={FS}
        rotation={rotation}
      />
    </OrbitCamera>
  </Scene>
</Canvas>`}</code></pre>
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
