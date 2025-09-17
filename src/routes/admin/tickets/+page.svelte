<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index.js";
	import { getCoreRowModel } from "@tanstack/table-core";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";

	//components - custom
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Table from "$lib/components/ui/table/index.js";

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
			accessorKey: "close_date",
			header: "Date Closed",
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
			accessorKey: "luse_id",
			header: "LuSE ID",
		},
		{
			accessorKey: "names",
			header: "Names",
		},
		{
			accessorKey: "email",
			header: "Email",
		},
		{
			accessorKey: "phone",
			header: "Phone No.",
		},
	];

	type StrongFilter = "none" | "agent" | "closed" | "open" | "acc-open";

	let strongFilter = $state<StrongFilter>("none");
	const updateStrongFilter = (val: StrongFilter) => (strongFilter = val);

	let cleanedTickets = $derived.by(() => {
		switch (strongFilter) {
			case "none":
				return ticketData;
			case "agent":
				const agentTickets = ticketData.filter((item) => item.assigned === data.admin);
				return agentTickets;
			case "closed":
				const closeddTickets = ticketData.filter((item) => item.is_closed);
				return closeddTickets;
			case "open":
				const openTickets = ticketData.filter((item) => !item.is_closed);
				return openTickets;
			case "acc-open":
				const accountOpeningTickets = ticketData.filter(
					(item) => item.query_type === "Account Opening",
				);
				return accountOpeningTickets;
			default:
				return ticketData;
		}
	});

	const table = createSvelteTable({
		get data() {
			return cleanedTickets;
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
	});
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
			<Button variant="secondary" class="loading ml-2" disabled
				>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
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
				<Button variant="secondary" class="loading ml-2" disabled
					>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
				>
			</div>
		</div>
	{/if}
{:else if !ticketData.length}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Tickets</h1>
			<Button variant="secondary" class="ml-2" disabled
				>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
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
				<Button variant="secondary" class="ml-2" disabled
					>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
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
			onclick={() => {
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
			<AnyCombobox
				handler={updateStrongFilter}
				data={{
					grouped: [
						{ title: "Asignee", group: [{ label: data.admin, value: "agent" }] },
						{
							title: "Status",
							group: [
								{ label: "Open", value: "open" },
								{ label: "Closed", value: "closed" },
							],
						},
						{ title: "Type", group: [{ label: "Account Opening", value: "acc-open" }] },
					],
					ungrouped: [{ label: "None", value: "none" }],
				}}
				dataTitle="Filter"
				classes="ml-4"
				icon="filter"
			/>
		</div>
	</div>

	<div class="main-tainer">
		<div class="table-tainer mt-3 rounded-md border">
			<div class="h-scroll">
				<Table.Root>
					<Table.Header>
						{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
							<Table.Row>
								{#each headerGroup.headers as header (header.id)}
									<Table.Head colspan={header.colSpan}>
										{#if !header.isPlaceholder}
											<FlexRender
												content={header.column.columnDef.header}
												context={header.getContext()}
											/>
										{/if}
									</Table.Head>
								{/each}
							</Table.Row>
						{/each}
					</Table.Header>
					<Table.Body>
						{#each table.getRowModel().rows as row (row.id)}
							<Table.Row data-state={row.getIsSelected() && "selected"}>
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell>
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/each}
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="h-24 text-center">
									No results.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.main-tainer {
		height: calc(100% - 68px);
		width: 100%;
		// border: 1px solid red;
	}
	.table-tainer {
		width: 100%;
		height: calc(100% - 13px);
		overflow-y: auto;
		position: relative;

		&::-webkit-scrollbar-thumb {
			border-radius: 100px !important;
		}
	}

	.h-scroll {
		width: fit-content; // makes it as wide as the table needs
		min-width: 100%; // makes sure it stretches full width
		overflow-x: auto;
		overflow-y: hidden;
		position: sticky;
		bottom: 0;

		&::-webkit-scrollbar-thumb {
			border-radius: 100px !important;
		}
	}
</style>
