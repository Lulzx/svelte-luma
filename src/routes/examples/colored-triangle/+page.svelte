<script lang="ts">
	import { Canvas, Model, createTriangleGeometry, GRADIENT_VS_GLSL, GRADIENT_FS_GLSL } from '$lib/index.js';
	import { Geometry } from '@luma.gl/engine';

	const triangleData = createTriangleGeometry();

	let geometry: Geometry | undefined = $state(undefined);

	function handleDeviceCreated() {
		geometry = new Geometry({
			topology: 'triangle-list',
			attributes: {
				positions: { size: 3, value: triangleData.positions },
				colors: { size: 4, value: triangleData.colors }
			}
		});
	}
</script>

<main>
	<h1>Colored Triangle</h1>
	<p>A triangle with per-vertex colors, demonstrating vertex attributes.</p>

	<a href="/">← Back to examples</a>

	<div class="canvas-container">
		<Canvas
			width={600}
			height={400}
			clearColor={[0.1, 0.1, 0.15, 1]}
			ondevicecreated={handleDeviceCreated}
		>
			{#if geometry}
				<Model
					vs={GRADIENT_VS_GLSL}
					fs={GRADIENT_FS_GLSL}
					{geometry}
					shaderLayout={{
						attributes: [
							{ name: 'positions', location: 0, format: 'float32x3' },
							{ name: 'colors', location: 1, format: 'float32x4' }
						],
						bindings: []
					}}
				/>
			{/if}
		</Canvas>
	</div>

	<details>
		<summary>View Source</summary>
		<pre><code>{`<script lang="ts">
  import { Canvas, Model, createTriangleGeometry, GRADIENT_VS_GLSL, GRADIENT_FS_GLSL } from 'svelte-luma';
  import { Geometry } from '@luma.gl/engine';

  const triangleData = createTriangleGeometry();

  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      positions: { size: 3, value: triangleData.positions },
      colors: { size: 4, value: triangleData.colors }
    }
  });
<\/script>

<Canvas width={600} height={400} clearColor={[0.1, 0.1, 0.15, 1]}>
  <Model
    vs={GRADIENT_VS_GLSL}
    fs={GRADIENT_FS_GLSL}
    geometry={geometry}
    shaderLayout={{
      attributes: [
        { name: 'positions', location: 0, format: 'float32x3' },
        { name: 'colors', location: 1, format: 'float32x4' }
      ],
      bindings: []
    }}
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
