<script lang="ts">
	//components - shadcn
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import Button from "./ui/button/button.svelte";

	//icons
	import { X } from "@lucide/svelte";

	//types
	import type { Snippet } from "svelte";

	interface Props {
		openTrigger: number;
		forceClose?: number;
		/**In px*/
		width?: number;
		title: string;
		description?: string;

		// snippet or old slots
		main: Snippet<[]>;
		/**E.g submit*/
		actionButton: Snippet<[]>;
	}

	const {
		openTrigger,
		forceClose,
		title,
		description,
		main,
		actionButton,
		width = 400,
	}: Props = $props();

	let open = $state<boolean>(false);

	// open whenever the openTrigger value changes
	$effect(() => {
		if (openTrigger) {
			open = false;
			open = true;
		}
	});

	// allows for programatic closing
	$effect(() => {
		if (forceClose) {
			open = false;
		}
	});
</script>

<Sheet.Root bind:open>
	<!-- <Sheet.Trigger>Open</Sheet.Trigger> -->
	<Sheet.Content class={`w-[${width}px]`}>
		<Sheet.Header>
			<Sheet.Title>{title}</Sheet.Title>
			{#if description}
				<Sheet.Description>
					{description}
				</Sheet.Description>
			{/if}
		</Sheet.Header>

		<div class="main">
			{@render main?.()}
		</div>

		<Sheet.Footer>
			<div class="flex flex-row justify-end">
				<Sheet.Close class="mr-4"
					><Button variant="outline">Close<X class="ml-1 h-4 w-4" /></Button></Sheet.Close
				>
				{@render actionButton?.()}
			</div>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>

<style lang="scss">
	.main {
		width: 100%;
		padding: 0px 16px;
		height: 100%;
		overflow-y: auto;
	}
</style>
