<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";

	//components - custom
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";

	//icons
	import { Search, SlidersHorizontal } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { SBZdb } from "$lib/types";
	import type { ColumnDef } from "@tanstack/table-core";

	let { data }: PageProps = $props();

	type TicketRow = SBZdb["public"]["Tables"]["odyn-tickets"]["Row"];

	let ticketData = $state<TicketRow[]>([]);
	let loading = $state<boolean>(false);
	let initialising = $state<boolean>(true);

	$effect(() => {
		data.tickets
			.then((res) => {
				ticketData = res;
				initialising = false;
			})
			.catch(() => {
				toast.error("Failed to get tickets! Please refresh the browser in a few minutes.");
				initialising = false;
			});
	});

	let isMobile = $derived($screenWidthStore < 767);

	const columns: ColumnDef<TicketRow>[] = [
		{
			accessorKey: "id",
			header: "Ticket No.",
		},
		{
			accessorKey: "created_at",
			header: "Lodged",
		},
		{
			accessorKey: "assigned",
			header: "Assignee",
		},
		{
			accessorKey: "is_closed",
			header: "Status",
		},
		{
			accessorKey: "query_type",
			header: "Type",
		},
		{
			accessorKey: "query",
			header: "Details",
		},
		{
			accessorKey: "created_at",
			header: "Lodged",
		},
	];
</script>

<Head
	title="Tickets | SBZ Admin"
	ogTitle="Tickets"
	description="Fully managed customer service, for any and all scenarios."
	ogDescription="Fully managed customer service, for any and all scenarios."
/>

{#if initialising}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Tickets</h1>
			<Button
				variant="secondary"
				class="loading ml-2"
				disabled
				on:click={() => {
					null;
				}}>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" disabled />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Tickets</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" disabled />
				<Button
					variant="secondary"
					class="loading ml-2"
					disabled
					on:click={() => {
						null;
					}}>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
				>
			</div>
		</div>
	{/if}
{:else if !ticketData.length}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Tickets</h1>
			<Button
				variant="secondary"
				class="ml-2"
				disabled
				on:click={() => {
					null;
				}}>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" disabled />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Tickets</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" disabled />
				<Button
					variant="secondary"
					class="ml-2"
					disabled
					on:click={() => {
						null;
					}}>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
				>
			</div>
		</div>
	{/if}
	<h3 class="mx-auto mt-4 text-center">No data.</h3>
{:else if isMobile}
	<div class="flex flex-row items-center justify-between">
		<h1>Tickets</h1>
		<Button
			variant="secondary"
			class="ml-2"
			on:click={() => {
				null;
			}}>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
		>
	</div>
	<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
		<Search class="mr-4" />
		<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" />
	</div>
{:else}
	<div class="flex flex-row items-center justify-between">
		<h1>Tickets</h1>
		<div class="flex w-[50%] items-center">
			<Search class="mr-4 h-10 w-10" />
			<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" />
			<Button
				variant="secondary"
				class="ml-2 cursor-pointer"
				on:click={() => {
					null;
				}}>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
	</div>
{/if}
