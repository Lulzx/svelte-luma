<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import { getLumaState } from '../state.svelte.js';
	import { mat4Compose, mat4Multiply } from '../math.js';

	interface Props {
		position?: [number, number, number];
		rotation?: [number, number, number];
		scale?: [number, number, number];
		visible?: boolean;
		children?: Snippet;
	}

	let {
		position = [0, 0, 0],
		rotation = [0, 0, 0],
		scale = [1, 1, 1],
		visible = true,
		children
	}: Props = $props();

	const lumaState = getLumaState();

	// Get parent's transform (for nested groups)
	const parentMatrix = lumaState.parentTransform;

	// Our computed world matrix
	let worldMatrix: Float32Array = $state(new Float32Array(16));

	// Track previous values for dirty checking
	let lastPosition: [number, number, number] = [...position];
	let lastRotation: [number, number, number] = [...rotation];
	let lastScale: [number, number, number] = [...scale];

	function updateWorldMatrix(): void {
		// Compute local transform
		const localMatrix = mat4Compose(position, rotation, scale);

		// Combine with parent transform if exists
		if (parentMatrix) {
			mat4Multiply(parentMatrix, localMatrix, worldMatrix);
		} else {
			worldMatrix.set(localMatrix);
		}

		// Update state for children
		lumaState.setParentTransform(worldMatrix);
	}

	// Update matrix when transforms change
	$effect(() => {
		if (
			position[0] !== lastPosition[0] ||
			position[1] !== lastPosition[1] ||
			position[2] !== lastPosition[2] ||
			rotation[0] !== lastRotation[0] ||
			rotation[1] !== lastRotation[1] ||
			rotation[2] !== lastRotation[2] ||
			scale[0] !== lastScale[0] ||
			scale[1] !== lastScale[1] ||
			scale[2] !== lastScale[2]
		) {
			lastPosition = [...position];
			lastRotation = [...rotation];
			lastScale = [...scale];
			updateWorldMatrix();
		}
	});

	onMount(() => {
		updateWorldMatrix();
	});

	onDestroy(() => {
		// Restore parent's transform
		lumaState.setParentTransform(parentMatrix);
	});
</script>

{#if visible && children}
	{@render children()}
{/if}
