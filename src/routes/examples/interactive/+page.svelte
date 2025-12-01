<script lang="ts">
	import { Canvas, Model } from '$lib/index.js';
	import type { Device } from '@luma.gl/core';

	let mouseX = $state(0);
	let mouseY = $state(0);
	let time = $state(0);

	const VS = /* glsl */ `#version 300 es
const vec2 pos[3] = vec2[3](vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));

uniform vec2 uMouse;
uniform float uTime;

void main() {
  vec2 p = pos[gl_VertexID];

  // Rotate based on time
  float angle = uTime * 0.001;
  float c = cos(angle);
  float s = sin(angle);
  p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);

  // Scale based on distance to mouse
  float dist = length(uMouse);
  float scale = 0.5 + dist * 0.5;
  p *= scale;

  // Offset towards mouse
  p += uMouse * 0.3;

  gl_Position = vec4(p, 0.0, 1.0);
}`;

	const FS = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uMouse;
uniform float uTime;

out vec4 fragColor;

void main() {
  // Color based on mouse position and time
  float r = 0.5 + 0.5 * sin(uTime * 0.001 + uMouse.x * 3.14159);
  float g = 0.5 + 0.5 * sin(uTime * 0.002 + uMouse.y * 3.14159);
  float b = 0.5 + 0.5 * cos(uTime * 0.003);

  fragColor = vec4(r, g, b, 1.0);
}`;

	function handleFrame(ctx: { time: number }) {
		time = ctx.time;
	}

	function handleMouseMove(e: MouseEvent) {
		const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
		mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
	}

	const uniforms = $derived({
		uMouse: [mouseX, mouseY],
		uTime: time
	});
</script>

<main>
	<h1>Interactive</h1>
	<p>Move your mouse over the canvas to interact with the triangle.</p>

	<a href="/">← Back to examples</a>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas-container" onmousemove={handleMouseMove}>
		<Canvas width={600} height={400} clearColor={[0.05, 0.05, 0.1, 1]} onframe={handleFrame}>
			<Model
				vs={VS}
				fs={FS}
				topology="triangle-list"
				vertexCount={3}
				{uniforms}
				shaderLayout={{
					attributes: [],
					bindings: []
				}}
			/>
		</Canvas>
	</div>

	<div class="info">
		<p>Mouse: ({mouseX.toFixed(2)}, {mouseY.toFixed(2)})</p>
	</div>

	<details>
		<summary>View Source</summary>
		<pre><code>{`<script lang="ts">
  import { Canvas, Model } from 'svelte-luma';

  let mouseX = $state(0);
  let mouseY = $state(0);

  const uniforms = $derived({
    uMouse: [mouseX, mouseY],
    uTime: time
  });

  // Vertex shader uses uMouse for position offset
  // Fragment shader uses uMouse for color
<\/script>

<div onmousemove={handleMouseMove}>
  <Canvas onframe={handleFrame}>
    <Model
      vs={VS}
      fs={FS}
      uniforms={uniforms}
    />
  </Canvas>
</div>`}</code></pre>
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
		cursor: crosshair;
	}

	.info {
		font-family: monospace;
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
