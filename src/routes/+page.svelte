<script lang="ts">
	import { Canvas, Model, SIMPLE_TRIANGLE_VS_GLSL, SIMPLE_TRIANGLE_FS_GLSL } from '$lib/index.js';

	let time = $state(0);

	function handleFrame(ctx: { time: number }) {
		time = ctx.time;
	}

	const color = $derived([
		Math.sin(time * 0.001) * 0.5 + 0.5,
		Math.cos(time * 0.002) * 0.5 + 0.5,
		Math.sin(time * 0.003) * 0.5 + 0.5,
		1.0
	]);
</script>

<main>
	<h1>svelte-luma Examples</h1>
	<p>High-performance WebGL2/WebGPU rendering with Svelte 5</p>

	<nav>
		<a href="/examples/triangle">Hello Triangle</a>
		<a href="/examples/colored-triangle">Colored Triangle</a>
		<a href="/examples/spinning-cube">Spinning Cube</a>
		<a href="/examples/instancing">Instancing</a>
		<a href="/examples/interactive">Interactive</a>
	</nav>

	<section>
		<h2>Quick Demo</h2>
		<Canvas width={400} height={300} clearColor={[0.1, 0.1, 0.1, 1]} onframe={handleFrame}>
			<Model
				vs={SIMPLE_TRIANGLE_VS_GLSL}
				fs={SIMPLE_TRIANGLE_FS_GLSL}
				topology="triangle-list"
				vertexCount={3}
				uniforms={{ uColor: color }}
				shaderLayout={{
					attributes: [],
					bindings: [{ type: 'uniform', name: 'uColor', location: 0 }]
				}}
			/>
		</Canvas>
		<p class="caption">A simple animated triangle using luma.gl through Svelte</p>
	</section>
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
		color: #666;
		margin-bottom: 2rem;
	}

	nav {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 2rem;
	}

	nav a {
		padding: 0.5rem 1rem;
		background: #333;
		color: white;
		text-decoration: none;
		border-radius: 4px;
		transition: background 0.2s;
	}

	nav a:hover {
		background: #555;
	}

	section {
		margin-top: 2rem;
	}

	h2 {
		margin-bottom: 1rem;
	}

	.caption {
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}
</style>
