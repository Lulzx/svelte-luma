<script lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { createPerspectiveMatrix, createLookAtMatrix, degToRad } from '../utils.js';
	import type { Writable } from 'svelte/store';

	interface Props {
		distance?: number;
		rotationX?: number;
		rotationY?: number;
		target?: [number, number, number];
		fov?: number;
		near?: number;
		far?: number;
		enableDrag?: boolean;
		enableZoom?: boolean;
		zoomSpeed?: number;
		rotationSpeed?: number;
		minDistance?: number;
		maxDistance?: number;
		children?: Snippet;
	}

	let {
		distance = $bindable(5),
		rotationX = $bindable(0),
		rotationY = $bindable(0),
		target = [0, 0, 0],
		fov = 60,
		near = 0.1,
		far = 1000,
		enableDrag = true,
		enableZoom = true,
		zoomSpeed = 0.1,
		rotationSpeed = 0.01,
		minDistance = 1,
		maxDistance = 100,
		children
	}: Props = $props();

	const viewportStore = getContext<{ subscribe: (fn: (v: any) => void) => () => void }>(
		'luma:viewport'
	);
	const sceneStore = getContext<Writable<any>>('luma:scene');

	let isDragging = false;
	let lastX = 0;
	let lastY = 0;

	let projectionMatrix = $state(new Float32Array(16));
	let viewMatrix = $state(new Float32Array(16));

	function updateMatrices(width: number, height: number) {
		const aspect = width / height;
		projectionMatrix = createPerspectiveMatrix(degToRad(fov), aspect, near, far);

		const x = distance * Math.sin(rotationY) * Math.cos(rotationX);
		const y = distance * Math.sin(rotationX);
		const z = distance * Math.cos(rotationY) * Math.cos(rotationX);

		const eye: [number, number, number] = [
			target[0] + x,
			target[1] + y,
			target[2] + z
		];

		viewMatrix = createLookAtMatrix(eye, target, [0, 1, 0]);

		if (sceneStore) {
			sceneStore.set({ projectionMatrix, viewMatrix });
		}
	}

	function handleMouseDown(e: MouseEvent) {
		if (!enableDrag) return;
		isDragging = true;
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !enableDrag) return;

		const deltaX = e.clientX - lastX;
		const deltaY = e.clientY - lastY;

		rotationY -= deltaX * rotationSpeed;
		rotationX += deltaY * rotationSpeed;

		rotationX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotationX));

		lastX = e.clientX;
		lastY = e.clientY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleWheel(e: WheelEvent) {
		if (!enableZoom) return;
		e.preventDefault();

		distance += e.deltaY * zoomSpeed;
		distance = Math.max(minDistance, Math.min(maxDistance, distance));
	}

	onMount(() => {
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('wheel', handleWheel, { passive: false });

		let viewport: any;
		viewportStore.subscribe((v) => (viewport = v))();
		if (viewport) {
			updateMatrices(viewport.width, viewport.height);
		}
	});

	onDestroy(() => {
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
		window.removeEventListener('mousedown', handleMouseDown);
		window.removeEventListener('wheel', handleWheel);
	});

	$effect(() => {
		let viewport: any;
		viewportStore.subscribe((v) => (viewport = v))();
		if (viewport) {
			updateMatrices(viewport.width, viewport.height);
		}
	});

	$effect(() => {
		// Re-run when any of these change
		distance;
		rotationX;
		rotationY;
		target;
		fov;

		let viewport: any;
		viewportStore.subscribe((v) => (viewport = v))();
		if (viewport) {
			updateMatrices(viewport.width, viewport.height);
		}
	});
</script>

{#if children}
	{@render children()}
{/if}
