<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Buffer as LumaBuffer } from '@luma.gl/core';
	import { getLumaContext } from '../context.js';

	interface Props {
		data?: ArrayBufferView | number[];
		byteLength?: number;
		usage?: number;
		onbuffercreated?: (buffer: LumaBuffer) => void;
	}

	let { data, byteLength, usage = 0x88e4, onbuffercreated }: Props = $props();

	const lumaContext = getLumaContext();
	let buffer: LumaBuffer | null = $state(null);

	onMount(() => {
		const device = lumaContext.getDevice();
		if (!device) return;

		const bufferData = Array.isArray(data) ? new Float32Array(data) : data;

		buffer = device.createBuffer({
			data: bufferData,
			byteLength: byteLength ?? bufferData?.byteLength,
			usage
		});

		if (onbuffercreated) {
			onbuffercreated(buffer);
		}
	});

	onDestroy(() => {
		if (buffer) {
			buffer.destroy();
		}
	});

	$effect(() => {
		if (buffer && data) {
			const bufferData = Array.isArray(data) ? new Float32Array(data) : data;
			buffer.write(bufferData);
		}
	});

	export function getBuffer(): LumaBuffer | null {
		return buffer;
	}
</script>
