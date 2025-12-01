<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getLumaState } from '../../state.svelte.js';

	interface Props {
		position?: [number, number, number];
		color?: [number, number, number];
		intensity?: number;
		distance?: number;
		decay?: number;
	}

	let {
		position = [0, 5, 0],
		color = [1, 1, 1],
		intensity = 1,
		distance = 0,
		decay = 2
	}: Props = $props();

	const state = getLumaState();
	const lightId = Symbol('point-light');

	onMount(() => {
		state.addLight(lightId, {
			type: 'point',
			position,
			direction: [0, 0, 0],
			color,
			intensity,
			distance,
			decay,
			angle: 0,
			penumbra: 0
		});
	});

	onDestroy(() => {
		state.removeLight(lightId);
	});

	// Update light when props change
	$effect(() => {
		state.updateLight(lightId, {
			position,
			color,
			intensity,
			distance,
			decay
		});
	});
</script>
