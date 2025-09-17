<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index.js";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { numParse } from "@cerebrusinc/qol";
	import { formatDbTime } from "$lib/utils";
	import { createRawSnippet } from "svelte";
	import { renderSnippet, renderComponent } from "$lib/components/ui/data-table/index.js";
	import { percentageHandler } from "$lib/utils";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";

	//components - custom
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Table from "$lib/components/ui/table/index.js";
	import TicketActions from "./TicketActions.svelte";

	//icons
	import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { SBZdb } from "$lib/types";
	import type { ColumnDef, PaginationState } from "@tanstack/table-core";

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
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => formatDbTime(value),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "assigned",
			header: "Assignee",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => toTitleCase(value),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "is_closed",
			header: "Status",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue();
					return {
						render: () =>
							value ? `<span class="gren">Closed</span>` : `<span class="rd">Open</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "close_date",
			header: "Date Closed",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | null;
					return {
						render: () => (value ? formatDbTime(value) : "-"),
					};
				});

				return renderSnippet(renderCell);
			},
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
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as number;
					return {
						render: () => (value === -1 ? "-" : value.toString()),
					};
				});

				return renderSnippet(renderCell);
			},
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
		{
			id: "actions",
			cell: ({ row }) => renderComponent(TicketActions, { data: row.original }),
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

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 25 });

	const table = createSvelteTable({
		get data() {
			return cleanedTickets;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			},
		},
		onPaginationChange: (updater) => {
			if (typeof updater === "function") {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	interface Summary {
		total: number;
		open: number;
		closed: number;
		efficiency: number;
		verdict: string;
		mostPopular: string;
	}

	let summary: Summary = $derived.by(() => {
		let total: number = 0;
		let open: number = 0;
		let closed: number = 0;

		const qTypes: { [key: string]: number } = {};

		cleanedTickets.forEach((row) => {
			total++;

			if (row.is_closed) closed++;
			else open++;

			qTypes[row.query_type]
				? (qTypes[row.query_type] = qTypes[row.query_type] + 1)
				: (qTypes[row.query_type] = 1);
		});

		let mp: number = 0;
		let mpText: string = "";

		Object.keys(qTypes).forEach((tipo) => {
			const count = qTypes[tipo];

			if (count > mp) {
				mpText = `${tipo} (${percentageHandler(count / total)})`;
			}

			mp = count;
		});

		const efficiency = closed / total;
		const verdict =
			efficiency < 0.5 ? "BAD" : efficiency < 0.7 ? "FAIR" : efficiency < 0.9 ? "GOOD" : "SUPERB";

		return {
			closed,
			efficiency,
			open,
			total,
			verdict,
			mostPopular: mpText,
		};
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
				<AnyCombobox
					handler={updateStrongFilter}
					data={{
						grouped: [],
						ungrouped: [{ label: "None", value: "none" }],
					}}
					dataTitle="Filter"
					classes="ml-4"
					icon="filter"
					loader
					disabled
				/>
			</div>
		</div>

		<div class="main-tainer">
			<div class="table-tainer loading mt-3 flex items-center rounded-md border"></div>

			<div class="mt-2 flex items-center justify-between space-x-4">
				<div class="flex items-center justify-between">
					<p class="loading no-padding text-sm opacity-70">
						<strong>Total Tickets:</strong> <span class="num">9,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>Closed:</strong> <span class="num">9,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>Open:</strong> <span class="num">9,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>Efficiency:</strong>
						<span class="num">100.00%</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>Verdict:</strong> <span class="num">SUPERB</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>Most Popular:</strong> <span class="num">Lorem Ipsum (100.00%)</span>
					</p>
				</div>
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
		<h3 class="mx-auto mt-4 text-center">No data.</h3>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Tickets</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" disabled />
				<AnyCombobox
					handler={updateStrongFilter}
					data={{
						grouped: [],
						ungrouped: [{ label: "None", value: "none" }],
					}}
					dataTitle="Filter"
					classes="ml-4"
					icon="filter"
				/>
			</div>
		</div>
		<div class="main-tainer">
			<div class="table-tainer mt-3 flex items-center rounded-md border">
				<h3 class="mx-auto mt-4 text-center">No data.</h3>
			</div>
		</div>
	{/if}
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
						{ title: "Asignee", group: [{ label: toTitleCase(data.admin), value: "agent" }] },
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
									<Table.Head
										colspan={header.colSpan}
										class="max-w-[400px] px-5 text-center font-bold"
									>
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
									<Table.Cell class="max-w-[400px] px-5 py-2 text-center">
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

		<div class="mt-2 flex items-center justify-between space-x-4">
			<div class="flex items-center justify-between">
				<p class="text-sm opacity-70">
					<strong>Total Tickets:</strong> <span class="num">{numParse(summary.total)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Closed:</strong> <span class="num">{numParse(summary.closed)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Open:</strong> <span class="num">{numParse(summary.open)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Efficiency:</strong>
					<span class="num">{percentageHandler(summary.efficiency)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Verdict:</strong> <span class="num">{summary.verdict}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Most Popular:</strong> <span class="num">{summary.mostPopular}</span>
				</p>
			</div>

			<div class="flex flex-row items-center justify-end">
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
					><ChevronLeft class="mr-2 h-4 w-4" />Previous</Button
				>
				<Button class="mx-2" variant="outline" size="sm" disabled={true}
					>{pagination.pageIndex + 1}</Button
				>
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}>Next<ChevronRight class="ml-2 h-4 w-4" /></Button
				>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.main-tainer {
		height: calc(100% - 85px);
		width: 100%;
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
