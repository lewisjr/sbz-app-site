<script lang="ts" generics="T">
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import { tick } from "svelte";
	import * as Command from "$lib/components/ui/command/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/_utils.js";

	import { SlidersHorizontal } from "@lucide/svelte";

	import type { DataObj, GroupedData } from "./types";

	interface Data<T> {
		grouped: GroupedData<T>[];
		ungrouped: DataObj<T>[];
	}

	interface Props<T> {
		data: Data<T>;
		dataTitle: string;
		handler: (val: T) => void;
		disabled?: boolean;
		loader?: boolean;
		icon?: "filter";
		classes?: string;
		forceValue?: T;
	}

	const {
		data,
		dataTitle,
		disabled = $bindable(),
		handler,
		loader,
		icon,
		classes,
		forceValue,
	}: Props<T> = $props();

	let open = $state(false);
	let value = $state<T>();
	let triggerRef = $state<HTMLButtonElement>(null!);

	if (typeof forceValue !== "undefined") value = forceValue;

	let _data = [...data.grouped.flatMap((d) => d.group), ...data.ungrouped];

	const selectedValue = $derived(_data.find((f) => f.value === value)?.label);

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	$effect(() => {
		if (value) handler(value);
	});
</script>

{#if loader}
	<Popover.Root bind:open>
		<Popover.Trigger bind:ref={triggerRef} {disabled}>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="outline"
					class={`loading w-[200px] justify-between ${classes ?? ""}`.trim()}
					role="combobox"
					aria-expanded={open}
					disabled
				>
					{selectedValue || `Select a ${dataTitle}...`}
					<ChevronsUpDownIcon class="opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-[200px] p-0"></Popover.Content>
	</Popover.Root>
{:else}
	<Popover.Root bind:open>
		<Popover.Trigger bind:ref={triggerRef} {disabled}>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="outline"
					class={`w-[200px] justify-between ${classes ?? ""}`.trim()}
					role="combobox"
					aria-expanded={open}
				>
					<div class="flex flex-row items-center">
						{selectedValue || `Select a ${dataTitle}...`}
						{#if icon === "filter"}
							<SlidersHorizontal style="height: 12px;" class="ml-2 opacity-40" />
						{/if}
					</div>
					<ChevronsUpDownIcon class="opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-[200px] p-0">
			<Command.Root>
				<Command.Input placeholder={`Search ${dataTitle}...`} />
				<Command.List>
					<Command.Empty>No {dataTitle} found.</Command.Empty>
					{#if data.grouped.length}
						{#each data.grouped as group}
							<Command.Group value={group.title} heading={group.title}>
								{#each group.group as row}
									<Command.Item
										value={String(row.value)}
										onSelect={() => {
											value = row.value;
											closeAndFocusTrigger();
										}}
									>
										<CheckIcon class={cn(value !== row.value && "text-transparent")} />
										{row.label}
									</Command.Item>
								{/each}
							</Command.Group>
							<Command.Separator />
						{/each}
					{/if}

					<!-- Ungrouped Options -->
					{#if data.ungrouped.length}
						<Command.Group value="data" heading="Other">
							{#each data.ungrouped as row (row.value)}
								<Command.Item
									value={String(row.value)}
									onSelect={() => {
										value = row.value;
										closeAndFocusTrigger();
									}}
								>
									<CheckIcon class={cn(value !== row.value && "text-transparent")} />
									{row.label}
								</Command.Item>
							{/each}
						</Command.Group>
					{/if}
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
{/if}
