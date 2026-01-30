<script lang="ts">
	//componenets - custom
	import Navbar from "./Navbar.svelte";

	//stores
	import { isAppStore } from "$lib/stores";

	//types
	import type { LayoutProps } from "./$types";
	import { onMount } from "svelte";

	let { data, children }: LayoutProps = $props();

	onMount(() => {
		if (data.isApp) isAppStore.set(true);
	});
</script>

<section>
	<Navbar permissions={data.perimissions} />
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
