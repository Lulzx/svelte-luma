<script lang="ts">
	import { Canvas, Model } from '$lib/index.js';

	const VS = /* glsl */ `#version 300 es
const vec2 pos[3] = vec2[3](vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));

void main() {
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}`;

	const FS = /* glsl */ `#version 300 es
precision highp float;
out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;
</script>

<main>
	<h1>Hello Triangle</h1>
	<p>The classic "Hello World" of graphics programming.</p>

	<a href="/">← Back to examples</a>

	<div class="canvas-container">
		<Canvas width={600} height={400} clearColor={[0.1, 0.1, 0.15, 1]}>
			<Model
				vs={VS}
				fs={FS}
				topology="triangle-list"
				vertexCount={3}
				shaderLayout={{ attributes: [], bindings: [] }}
			/>
		</Canvas>
	</div>

	<details>
		<summary>View Source</summary>
		<pre><code>{`<script lang="ts">
  import { Canvas, Model } from 'svelte-luma';

  const VS = /* glsl */ \`#version 300 es
const vec2 pos[3] = vec2[3](vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));

void main() {
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}\`;

  const FS = /* glsl */ \`#version 300 es
precision highp float;
out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}\`;
<\/script>

<Canvas width={600} height={400} clearColor={[0.1, 0.1, 0.15, 1]}>
  <Model
    vs={VS}
    fs={FS}
    topology="triangle-list"
    vertexCount={3}
    shaderLayout={{ attributes: [], bindings: [] }}
  />
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
