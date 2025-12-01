<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getLumaState } from '../../state.svelte.js';
	import { vec3Normalize, degToRad } from '../../math.js';

	interface Props {
		position?: [number, number, number];
		target?: [number, number, number];
		color?: [number, number, number];
		intensity?: number;
		distance?: number;
		decay?: number;
		angle?: number;
		penumbra?: number;
	}

	let {
		position = [0, 5, 0],
		target = [0, 0, 0],
		color = [1, 1, 1],
		intensity = 1,
		distance = 0,
		decay = 2,
		angle = 60,
		penumbra = 0.1
	}: Props = $props();

	const state = getLumaState();
	const lightId = Symbol('spot-light');

	function computeDirection(): [number, number, number] {
		return vec3Normalize([
			target[0] - position[0],
			target[1] - position[1],
			target[2] - position[2]
		]);
	}

	onMount(() => {
		state.addLight(lightId, {
			type: 'spot',
			position,
			direction: computeDirection(),
			color,
			intensity,
			distance,
			decay,
			angle: degToRad(angle),
			penumbra
		});
	});

	onDestroy(() => {
		state.removeLight(lightId);
	});

	$effect(() => {
		state.updateLight(lightId, {
			position,
			direction: computeDirection(),
			color,
			intensity,
			distance,
			decay,
			angle: degToRad(angle),
			penumbra
		});
	});
</script>
