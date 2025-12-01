<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import { getLumaState } from '../state.svelte.js';
	import { mat4Identity, mat4Clone } from '../math.js';

	interface Props {
		projectionMatrix?: Float32Array;
		viewMatrix?: Float32Array;
		cameraPosition?: [number, number, number];
		children?: Snippet;
	}

	let {
		projectionMatrix = mat4Clone(mat4Identity()),
		viewMatrix = mat4Clone(mat4Identity()),
		cameraPosition = [0, 0, 5],
		children
	}: Props = $props();

	const lumaState = getLumaState();

	$effect(() => {
		lumaState.setScene(projectionMatrix, viewMatrix, cameraPosition);
	});

	onDestroy(() => {
		lumaState.clearScene();
	});
</script>

{#if children}
	{@render children()}
{/if}
