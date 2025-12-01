<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import { getLumaState } from '../state.svelte.js';
	import { mat4Perspective, mat4LookAt, mat4Clone, degToRad, clamp } from '../math.js';

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
		minPolarAngle?: number;
		maxPolarAngle?: number;
		damping?: number;
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
		minPolarAngle = 0.1,
		maxPolarAngle = Math.PI - 0.1,
		damping = 0,
		children
	}: Props = $props();

	const lumaState = getLumaState();

	let isDragging = false;
	let lastX = 0;
	let lastY = 0;

	let dampedRotationX = rotationX;
	let dampedRotationY = rotationY;
	let dampedDistance = distance;

	let projectionMatrix: Float32Array = $state(new Float32Array(16));
	let viewMatrix: Float32Array = $state(new Float32Array(16));
	let cameraPosition: [number, number, number] = $state([0, 0, 5]);

	function computeCameraPosition(): [number, number, number] {
		const rx = damping > 0 ? dampedRotationX : rotationX;
		const ry = damping > 0 ? dampedRotationY : rotationY;
		const d = damping > 0 ? dampedDistance : distance;

		const x = d * Math.sin(ry) * Math.cos(rx);
		const y = d * Math.sin(rx);
		const z = d * Math.cos(ry) * Math.cos(rx);

		return [target[0] + x, target[1] + y, target[2] + z];
	}

	function updateMatrices() {
		const viewport = lumaState.viewport;
		const aspect = viewport.width / viewport.height;

		projectionMatrix = mat4Clone(mat4Perspective(degToRad(fov), aspect, near, far));
		cameraPosition = computeCameraPosition();
		viewMatrix = mat4Clone(mat4LookAt(cameraPosition, target, [0, 1, 0]));

		lumaState.setScene(projectionMatrix, viewMatrix, cameraPosition);
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
		rotationX = clamp(rotationX, -Math.PI / 2 + minPolarAngle, Math.PI / 2 - minPolarAngle);

		lastX = e.clientX;
		lastY = e.clientY;

		if (damping === 0) {
			updateMatrices();
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleWheel(e: WheelEvent) {
		if (!enableZoom) return;
		e.preventDefault();

		distance += e.deltaY * zoomSpeed;
		distance = clamp(distance, minDistance, maxDistance);

		if (damping === 0) {
			updateMatrices();
		}
	}

	function handleTouchStart(e: TouchEvent) {
		if (!enableDrag || e.touches.length !== 1) return;
		isDragging = true;
		lastX = e.touches[0].clientX;
		lastY = e.touches[0].clientY;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging || !enableDrag || e.touches.length !== 1) return;

		const deltaX = e.touches[0].clientX - lastX;
		const deltaY = e.touches[0].clientY - lastY;

		rotationY -= deltaX * rotationSpeed;
		rotationX += deltaY * rotationSpeed;
		rotationX = clamp(rotationX, -Math.PI / 2 + minPolarAngle, Math.PI / 2 - minPolarAngle);

		lastX = e.touches[0].clientX;
		lastY = e.touches[0].clientY;

		if (damping === 0) {
			updateMatrices();
		}
	}

	function handleTouchEnd() {
		isDragging = false;
	}

	onMount(() => {
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('wheel', handleWheel, { passive: false });
		window.addEventListener('touchstart', handleTouchStart);
		window.addEventListener('touchmove', handleTouchMove);
		window.addEventListener('touchend', handleTouchEnd);

		updateMatrices();
	});

	onDestroy(() => {
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
		window.removeEventListener('mousedown', handleMouseDown);
		window.removeEventListener('wheel', handleWheel);
		window.removeEventListener('touchstart', handleTouchStart);
		window.removeEventListener('touchmove', handleTouchMove);
		window.removeEventListener('touchend', handleTouchEnd);
	});

	$effect(() => {
		if (lumaState.viewport) {
			updateMatrices();
		}
	});

	$effect(() => {
		distance; rotationX; rotationY; target; fov; near; far;

		if (damping > 0) {
			dampedRotationX += (rotationX - dampedRotationX) * (1 - damping);
			dampedRotationY += (rotationY - dampedRotationY) * (1 - damping);
			dampedDistance += (distance - dampedDistance) * (1 - damping);
		}

		updateMatrices();
	});

	export function setTarget(newTarget: [number, number, number]) {
		target = newTarget;
	}

	export function setDistance(newDistance: number) {
		distance = clamp(newDistance, minDistance, maxDistance);
	}

	export function setRotation(x: number, y: number) {
		rotationX = clamp(x, -Math.PI / 2 + minPolarAngle, Math.PI / 2 - minPolarAngle);
		rotationY = y;
	}

	export function getCameraPosition(): [number, number, number] {
		return cameraPosition;
	}

	export function getProjectionMatrix(): Float32Array {
		return projectionMatrix;
	}

	export function getViewMatrix(): Float32Array {
		return viewMatrix;
	}
</script>

{#if children}
	{@render children()}
{/if}
