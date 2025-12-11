<script lang="ts">
	//componenets - custom
	import Navbar from "./Navbar.svelte";

	//types
	import type { LayoutProps } from "./$types";

	let { data, children }: LayoutProps = $props();
</script>

<section>
	<Navbar />
	<div class="content">
		{@render children?.()}
	</div>
</section>

<style lang="scss">
	section {
		width: 100%;
		height: 100%;

		.content {
			width: 100%;
			height: 100%;
			position: relative;
			padding: 10px;
		}
	}
</style>
