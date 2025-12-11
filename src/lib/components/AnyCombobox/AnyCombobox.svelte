<script lang="ts" generics="T">
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import { tick } from "svelte";
	import * as Command from "$lib/components/ui/command/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/_utils.js";

	import { SlidersHorizontal, CircleDot, DiamondMinus } from "@lucide/svelte";

	import type { DataObj, GroupedData } from "./types";

	interface Data<T> {
		grouped: GroupedData<T>[];
		ungrouped: DataObj<T>[];
	}

	interface Props<T> {
		data: Data<T>;
		dataTitle: string;
		handler: (val: T) => void;
		handlerTwo?: (val: T) => void;
		disabled?: boolean;
		loader?: boolean;
		icon?: "filter";
		classes?: string;
		forceValue?: T;
		forceValueTwo?: T;
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
		handlerTwo = undefined,
		forceValueTwo = undefined,
	}: Props<T> = $props();

	let open = $state(false);
	let value = $state<T>();
	let valueTwo = $state<T>();
	let triggerRef = $state<HTMLButtonElement>(null!);

	if (typeof forceValue !== "undefined") value = forceValue;
	if (typeof forceValueTwo !== "undefined") valueTwo = forceValueTwo;

	let _data = [...data.grouped.flatMap((d) => d.group), ...data.ungrouped];

	const selectedValue = $derived(_data.find((f) => f.value === value)?.label);
	const selectedValueTwo = $derived(_data.find((f) => f.value === valueTwo)?.label);

	let oldVal = $state<T>();
	let oldValTwo = $state<T>();

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			// triggerRef.focus();
		});
	}

	let cfg = $state<"one" | "two">("one");

	const valHandler = () => {
		// console.log({ cfg, value, valueTwo });
		if (value && value !== oldVal && cfg === "one") {
			handler(value);
			oldVal = value;
			if (handlerTwo) cfg = "two";
		}

		if (handlerTwo && valueTwo && valueTwo !== oldValTwo) {
			handlerTwo(valueTwo);
			oldValTwo = valueTwo;
			cfg = "one";
		}
	};

	$effect(() => {
		if (value || valueTwo) {
			valHandler();
		}
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
						{`${selectedValue ? selectedValue : `Select a ${dataTitle}...`}${selectedValueTwo ? "," + selectedValueTwo : ""}`}
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
					<!-- Ungrouped Options -->
					{#if data.ungrouped.length}
						<Command.Group value="data" heading="Other">
							{#each data.ungrouped as row (row.value)}
								<Command.Item
									value={String(row.value)}
									onSelect={() => {
										if (cfg === "one") {
											oldVal = value;
											value = row.value;
										}

										if (cfg === "two") {
											oldValTwo = valueTwo;
											valueTwo = row.value;
										}

										closeAndFocusTrigger();
									}}
								>
									<CircleDot class={cn(value !== row.value && "text-transparent")} />
									<DiamondMinus class={cn(valueTwo !== row.value && "text-transparent")} />
									{row.label}
								</Command.Item>
							{/each}
						</Command.Group>
					{/if}

					{#if data.grouped.length}
						{#each data.grouped as group}
							<Command.Group value={group.title} heading={group.title}>
								{#each group.group as row}
									<Command.Item
										value={String(row.value)}
										onSelect={() => {
											if (cfg === "one") {
												value = row.value;
											}

											if (cfg === "two") {
												valueTwo = row.value;
											}

											closeAndFocusTrigger();
										}}
									>
										<CircleDot class={cn(value !== row.value && "text-transparent")} />
										<DiamondMinus class={cn(valueTwo !== row.value && "text-transparent")} />
										{row.label}
									</Command.Item>
								{/each}
							</Command.Group>
							<Command.Separator />
						{/each}
					{/if}
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
{/if}
