<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { numParse } from "@cerebrusinc/qol";
	import { formatDbTime } from "$lib/utils";
	import { createRawSnippet } from "svelte";
	import { renderSnippet } from "$lib/components/ui/data-table/index";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Table from "$lib/components/ui/table/index";

	//icons
	import { Search, ChevronLeft, ChevronRight } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { SBZdb } from "$lib/types";
	import type { ColumnDef, PaginationState } from "@tanstack/table-core";

	type OTPRow = SBZdb["public"]["Tables"]["otps"]["Row"];

	let { data }: PageProps = $props();

	let otpData = $state<OTPRow[]>([]);
	let initialising = $state<boolean>(true);

	$effect(() => {
		data.otps
			.then((res) => {
				otpData = res;
				initialising = false;
			})
			.catch(() => {
				toast.error("Failed to get otps! Please refresh the browser in a few minutes.");
				initialising = false;
			});
	});

	let isMobile = $derived($screenWidthStore < 767);

	const columns: ColumnDef<OTPRow>[] = [
		{
			accessorKey: "id",
			header: "User",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<p class="whitespace-normal">${value}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "otp",
			header: "OTP",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | number;
					return {
						render: () => `<p class="whitespace-normal">${value}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "updated_at",
			header: "Timestamp",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<p class="whitespace-normal">${formatDbTime(value)}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
	];

	let globalFilterValue = $state<string>("");

	// ! could be a search error here
	let filteredTickets = $derived.by(() => {
		return otpData.filter((entry) => {
			let res: boolean = false;

			const _sanitize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
			const _compare = (value: string) => _sanitize(value).includes(_sanitize(globalFilterValue));

			if (_compare(formatDbTime(entry.updated_at))) res = true;
			if (_compare(entry.otp.toString())) res = true;
			if (_compare(entry.id)) res = true;

			return res;
		});
	});

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 25 });

	const table = createSvelteTable({
		get data() {
			return filteredTickets;
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
</script>

<Head
	title="OTPs | SBZ Admin"
	ogTitle="OTPs"
	description="System activity management."
	ogDescription="System activity management."
/>

{#if initialising}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>OTPs</h1>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter OTPs..." type="text" disabled />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>OTPs</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter OTPs..." type="text" disabled />
			</div>
		</div>

		<div class="main-tainer">
			<div class="table-tainer loading mt-3 flex items-center rounded-md border"></div>

			<div class="mt-2 flex items-center justify-between space-x-4">
				<div class="flex items-center justify-between">
					<p class="loading no-padding text-sm opacity-70">
						<strong>Total:</strong> <span class="num">9,999</span>
					</p>
				</div>

				<div class="flex flex-row items-center justify-end">
					<Button variant="outline" size="sm" disabled class="loading"
						><ChevronLeft class="mr-2 h-4 w-4" />Previous</Button
					>
					<Button class="loading mx-2" variant="outline" size="sm" disabled>1</Button>
					<Button variant="outline" size="sm" class="loading" disabled
						>Next<ChevronRight class="ml-2 h-4 w-4" /></Button
					>
				</div>
			</div>
		</div>
	{/if}
{:else if !otpData.length}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>OTPs</h1>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter OTPs..." type="text" disabled />
		</div>
		<h3 class="mx-auto mt-4 text-center">No data.</h3>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>OTPs</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter OTPs..." type="text" disabled />
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
		<h1>OTPs</h1>
	</div>
	<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
		<Search class="mr-4" />
		<Input class="w-[100%]" placeholder="Filter OTPs..." type="text" />
	</div>
{:else}
	<div class="flex flex-row items-center justify-between">
		<h1>OTPs</h1>
		<div class="flex w-[50%] items-center">
			<Search class="mr-4 h-10 w-10" />
			<Input
				class="w-[100%]"
				bind:value={globalFilterValue}
				placeholder="Filter OTPs..."
				type="text"
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
									<Table.Head colspan={header.colSpan} class="px-5 text-center font-bold">
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
									<Table.Cell class="px-5 py-2 text-center">
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
			<div class="sum-tainer flex items-center justify-between">
				<p class="text-sm opacity-70">
					<strong>Total:</strong> <span class="num">{numParse(filteredTickets.length)}</span>
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

	.sum-tainer {
		max-width: calc(100% - 220px);
		overflow-x: auto;

		&::-webkit-scrollbar {
			display: none;
		}

		p {
			white-space: nowrap;
		}
	}
</style>
