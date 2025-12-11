<script lang="ts">
	//components - shadcn
	import * as Drawer from "$lib/components/ui/drawer/index.js";
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

		/**Should it go beeg? */
		big?: boolean;

		// snippet or old slots
		main: Snippet<[]>;
		/**E.g submit*/
		actionButton: Snippet<[]>;
	}

	let {
		openTrigger,
		forceClose,
		title,
		description,
		main,
		actionButton,
		width = 400,
		big,
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

<Drawer.Root bind:open>
	<!-- <Drawer.Trigger>Open</Drawer.Trigger> -->
	{#if big}
		<Drawer.Content class="h-[97%]">
			<Drawer.Header>
				<Drawer.Title>{title}</Drawer.Title>
				{#if description}
					<Drawer.Description>
						{description}
					</Drawer.Description>
				{/if}
			</Drawer.Header>

			<div class="main">
				{@render main?.()}
			</div>

			<Drawer.Footer>
				<div class="flex flex-row justify-end">
					<Drawer.Close class="mr-4"
						><Button variant="outline">
							Close<X class="ml-1 h-4 w-4" />
						</Button>
					</Drawer.Close>
					{@render actionButton?.()}
				</div>
			</Drawer.Footer>
		</Drawer.Content>
	{:else if width}
		<Drawer.Content class={width ? `h-[${width}px]` : "h-3/4"}>
			<Drawer.Header>
				<Drawer.Title>{title}</Drawer.Title>
				{#if description}
					<Drawer.Description>
						{description}
					</Drawer.Description>
				{/if}
			</Drawer.Header>

			<div class="main">
				{@render main?.()}
			</div>

			<Drawer.Footer>
				<div class="flex flex-row justify-end">
					<Drawer.Close class="mr-4"
						><Button variant="outline">
							Close<X class="ml-1 h-4 w-4" />
						</Button>
					</Drawer.Close>
					{@render actionButton?.()}
				</div>
			</Drawer.Footer>
		</Drawer.Content>
	{:else}
		<Drawer.Content class={"h-3/4"}>
			<Drawer.Header>
				<Drawer.Title>{title}</Drawer.Title>
				{#if description}
					<Drawer.Description>
						{description}
					</Drawer.Description>
				{/if}
			</Drawer.Header>

			<div class="main">
				{@render main?.()}
			</div>

			<Drawer.Footer>
				<div class="flex flex-row justify-end">
					<Drawer.Close class="mr-4"
						><Button variant="outline">
							Close<X class="ml-1 h-4 w-4" />
						</Button>
					</Drawer.Close>
					{@render actionButton?.()}
				</div>
			</Drawer.Footer>
		</Drawer.Content>
	{/if}
</Drawer.Root>

<style lang="scss">
	.main {
		width: 100%;
		padding: 0px 16px;
		height: 100%;
		overflow-y: auto;
	}
</style>
