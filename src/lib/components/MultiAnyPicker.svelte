<script lang="ts" generics="T">
	//functions
	import { tick } from "svelte";

	//components - shadcn
	import * as Popover from "$lib/components/ui/popover/index.js";
	import * as Command from "$lib/components/ui/command/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";

	//types
	import type { PickerObj } from "$lib/types/others";

	//icons
	import { XCircle } from "@lucide/svelte";
	import { useId } from "bits-ui";

	interface Props<T> {
		data: PickerObj<T>[];
		handler: (value: T) => void;
		delHandler: (index: number) => void;
		title: string;
		isBlacklist?: boolean;
		titlePlural?: string;
	}

	let {
		data,
		handler,
		delHandler,
		title,
		isBlacklist = false,
		titlePlural = "",
	}: Props<T> = $props();

	let open = $state<boolean>(false);

	let value = $state<any>(null);

	let dataArray = $state<string>("");

	$effect(() => {
		if (value) {
			// handler(value);
			const temp = dataArray.split(",,");
			temp.push(value);
			dataArray = temp.join(",,");
		}
	});

	const del = (index: number) => {
		// delHandler(index);

		const temp: string[] = dataArray.split(",,");
		temp.splice(index, 1);
		dataArray = temp.join(",,");
	};
	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(trigger_id: string) {
		try {
			open = false;
			tick().then(() => {
				document.getElementById(trigger_id)?.focus();
			});
		} catch (ex) {
			console.log("========= closeAndFocusTrigger");
			console.error(ex);
		}
	}

	const triggerId = useId();
</script>

<section class="mt-4">
	<div class="custom-scroll flex max-w-[350px] overflow-x-auto pt-2">
		{#if dataArray.length}
			{#each dataArray.split(",,") as s, i}
				<button class="symbol" onclick={() => del(i)}>{s}<XCircle class="ml-2 h-4 w-4" /></button>
			{/each}
		{:else}
			<p style="font-size: 0.9rem; opacity: 0.8;">
				{isBlacklist ? "Remove" : "Add"} something below...
			</p>
		{/if}
	</div>
	<div class="mt-2 flex items-center space-x-4">
		<p class="text-sm text-muted-foreground">{titlePlural ? titlePlural : title + "s"}</p>
		<Popover.Root bind:open>
			<Popover.Trigger
				class={buttonVariants({
					variant: "outline",
					size: "sm",
					class: "w-[150px] justify-start",
				})}
			>
				+ {title}
			</Popover.Trigger>
			<Popover.Content class="w-[200px] p-0" side="right" align="start">
				<Command.Root>
					<Command.Input placeholder="Change {title}..." />
					<Command.List>
						<Command.Empty>No results found.</Command.Empty>
						<Command.Group>
							{#each data as d}
								<Command.Item
									class={`cursor-pointer${d.value ? " font-semibold italic" : ""}`}
									value={d.label}
									onSelect={() => {
										value = d.value;
										closeAndFocusTrigger(triggerId);
									}}
								>
									<span>
										{d.label}
									</span>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>
</section>

<style lang="scss">
	section {
		border: 1px solid hsl(var(--primary));
		padding: 5px 8px;
		border-radius: var(--radius);

		.symbol {
			background-color: var(--table-highlight);
			display: flex;
			flex-direction: row;
			margin: 0px 5px;
			align-items: center;
			justify-content: center;
			padding: 0.3rem 0.5rem;
			border-radius: var(--radius);
		}

		.custom-scroll {
			&::-webkit-scrollbar:horizontal {
				height: 20px;
			}

			&::-webkit-scrollbar-thumb {
				background: #888;
				border-radius: 15px;
				border: 8px solid transparent;
				background-clip: content-box;

				&:hover {
					background: #555;
					border: 8px solid transparent;
					background-clip: content-box;
				}
			}
		}
	}
</style>
