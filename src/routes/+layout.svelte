<script lang="ts">
	//functions
	import { setMode } from "mode-watcher";
	import { screenWidthStore } from "$lib/stores";

	//components - other
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "$lib/components/ui/sonner";

	// styles
	import "../app.css";

	let { children } = $props();

	// responsive to user's preferences
	setMode("system");

	let innerWidth = $state<number>(0);

	$effect(() => screenWidthStore.update(() => innerWidth));
</script>

<ModeWatcher track />
<Toaster position="top-right" />

<svelte:window bind:innerWidth />

<main data-vaul-drawer-wrapper>
	{@render children?.()}
</main>

<style lang="scss">
	main {
		height: 100vh;
		width: 100%;
		background-color: var(--background);

		@media screen and (max-width: 1024px) {
			height: 100dvh;
		}
	}
</style>
