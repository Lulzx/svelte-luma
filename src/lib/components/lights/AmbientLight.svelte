<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getLumaState } from '../../state.svelte.js';

	interface Props {
		color?: [number, number, number];
		intensity?: number;
	}

	let {
		color = [1, 1, 1],
		intensity = 0.2
	}: Props = $props();

	const state = getLumaState();
	const lightId = Symbol('ambient-light');

	onMount(() => {
		state.addLight(lightId, {
			type: 'ambient',
			position: [0, 0, 0],
			direction: [0, 0, 0],
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
			color,
			intensity
		});
	});
</script>
