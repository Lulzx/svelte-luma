<script>
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #1a1a1a;
		color: #fff;
		min-height: 100vh;
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
