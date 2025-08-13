<script lang="ts">
	//functions
	import { setMode } from "mode-watcher";

	//components - other
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "$lib/components/ui/sonner";

	// styles
	import "../app.css";

	let { children } = $props();
</script>

<ModeWatcher track />
<Toaster position="top-right" />

<main>
	{@render children?.()}
</main>

<style lang="scss">
	main {
		height: 100%;
		width: 100vw;
		overflow-y: auto;

		@media screen and (max-width: 1024px) {
			height: 100dvh;
		}
	}
</style>
