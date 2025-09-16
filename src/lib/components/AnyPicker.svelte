<script lang="ts">
	//functions
	import { tick } from "svelte";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { useId } from "bits-ui";

	//components - shadcn
	import * as Popover from "$lib/components/ui/popover/index.js";
	import * as Command from "$lib/components/ui/command/index.js";

	type AnyObject = {
		value: any;
		label: any;
	};

	interface Props {
		data: AnyObject[];
		pickerTitle: string;
		value: any;
		handler: (value: any) => void;
	}

	let { data, handler, pickerTitle, value }: Props = $props();

	let _data = $state<AnyObject[]>([]);

	let open = $state<boolean>(false);

	$effect(() => handler(value));

	let selectedStatus = $derived(_data.find((s) => s.value === value) ?? null);

	$effect(() => {
		const blacklist: any[] = [];
		const __data: AnyObject[] = [];

		data.forEach((d) => {
			if (!blacklist.includes(d.label)) {
				blacklist.push(d.label);
				__data.push({ label: d.label, value: d.value });
			}
		});

		_data = __data;

		if (value === "") value = data[0].value;
	});

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
	const triggerId = useId();
</script>

<!--
<div class="mt-4 flex items-center space-x-4">
	<p class="text-sm text-muted-foreground">{pickerTitle}</p>
-->
<Popover.Root bind:open>
	<Popover.Trigger
		class={buttonVariants({
			variant: "outline",
			size: "sm",
			class: "w-[150px] justify-start",
		})}
	>
		{#if selectedStatus}
			{selectedStatus.label}
		{:else}
			Select {pickerTitle}
		{/if}
	</Popover.Trigger>
	<Popover.Content class="w-[200px] p-0" side="bottom" align="start">
		<Command.Root>
			<Command.Input placeholder={`Change ${pickerTitle.toLowerCase()}...`} />
			<Command.List>
				<Command.Empty>No results found.</Command.Empty>
				<Command.Group>
					{#each _data as d}
						<Command.Item
							class={`cursor-pointer${selectedStatus?.label === d.label ? " font-semibold italic" : ""}`}
							value={d.label}
							onSelect={() => {
								// @ts-ignore
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

<!--
</div>
-->

<style lang="scss">
	/*
	div {
		border: 1px solid hsl(var(--primary));
		padding: 5px 8px;
		border-radius: var(--radius);
	}
	*/
</style>
