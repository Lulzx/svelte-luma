<script lang="ts">
	import { setContext, getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { writable } from 'svelte/store';

	interface SceneContext {
		projectionMatrix: Float32Array;
		viewMatrix: Float32Array;
	}

	interface Props {
		projectionMatrix?: Float32Array;
		viewMatrix?: Float32Array;
		children?: Snippet;
	}

	let {
		projectionMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
		viewMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
		children
	}: Props = $props();

	const sceneStore = writable<SceneContext>({
		projectionMatrix,
		viewMatrix
	});

	setContext('luma:scene', sceneStore);

	$effect(() => {
		sceneStore.set({ projectionMatrix, viewMatrix });
	});
</script>

{#if children}
	{@render children()}
{/if}
