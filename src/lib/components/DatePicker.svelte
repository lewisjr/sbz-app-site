<script lang="ts">
	import { CalendarIcon } from "@lucide/svelte";
	import { type DateValue, DateFormatter, getLocalTimeZone } from "@internationalized/date";
	import { cn } from "$lib/_utils.js";
	import { buttonVariants } from "./ui/button";
	import { Calendar } from "$lib/components/ui/calendar";
	import * as Popover from "$lib/components/ui/popover";

	const df = new DateFormatter("en-US", {
		dateStyle: "long",
	});

	let value = $state<DateValue | undefined>(undefined);
	let contentRef = $state<HTMLElement | null>(null);

	let {
		handler,
		reset = undefined,
		dropdown = undefined,
	}: { handler: (value: any) => void; reset?: number; dropdown?: boolean } = $props();

	$effect(() => {
		if (reset) value = undefined;
	});

	let formattedDate = $derived(
		value
			? `${value.year}-${value.month > 9 ? value.month : "0" + value.month}-${value.day > 9 ? value.day : "0" + value.day}`
			: undefined,
	);

	$effect(() => handler(formattedDate));

	// 2025-04-12T14:35:00Z
</script>

<Popover.Root>
	<Popover.Trigger
		class={cn(
			buttonVariants({
				variant: "outline",
				class: "w-[280px] justify-start text-left font-normal",
			}),
			!value && "text-muted-foreground",
		)}
	>
		<CalendarIcon class="mr-2 h-4 w-4" />
		{value ? df.format(value.toDate(getLocalTimeZone())) : "Select a date"}
	</Popover.Trigger>
	<Popover.Content bind:ref={contentRef} class="w-auto p-0" side="top">
		{#if dropdown}
			<Calendar type="single" captionLayout="dropdown" bind:value />
		{:else}
			<Calendar type="single" bind:value />
		{/if}
	</Popover.Content>
</Popover.Root>
