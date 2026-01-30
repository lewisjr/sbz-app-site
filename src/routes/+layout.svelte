<script lang="ts">
	//functions
	import { setMode } from "mode-watcher";
	import { isAppStore, screenWidthStore } from "$lib/stores";

	//components - other
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "$lib/components/ui/sonner";

	// styles
	import "../app.css";

	let { children, data } = $props();

	let innerWidth = $state<number>(0);

	$effect(() => screenWidthStore.update(() => innerWidth));

	if (data.isApp) {
		setMode("dark");
		isAppStore.set(true);
	} else setMode("system");
</script>

<ModeWatcher track />
<Toaster position={data.isApp ? "bottom-right" : "top-right"} />

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
