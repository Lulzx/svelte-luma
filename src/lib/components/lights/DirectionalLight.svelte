<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getLumaState } from '../../state.svelte.js';
	import { vec3Normalize } from '../../math.js';

	interface Props {
		direction?: [number, number, number];
		color?: [number, number, number];
		intensity?: number;
	}

	let {
		direction = [0, -1, 0],
		color = [1, 1, 1],
		intensity = 1
	}: Props = $props();

	const state = getLumaState();
	const lightId = Symbol('directional-light');

	onMount(() => {
		state.addLight(lightId, {
			type: 'directional',
			position: [0, 0, 0],
			direction: vec3Normalize(direction),
			color,
			intensity,
			distance: 0,
			decay: 0,
			angle: 0,
			penumbra: 0
		});
	});

	onDestroy(() => {
		state.removeLight(lightId);
	});

	$effect(() => {
		state.updateLight(lightId, {
			direction: vec3Normalize(direction),
			color,
			intensity
		});
	});
</script>
