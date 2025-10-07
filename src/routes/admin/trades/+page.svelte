<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { numParse } from "@cerebrusinc/qol";
	import { formatDbTime, mrMateSymbols, prettyDate } from "$lib/utils";
	import { createRawSnippet } from "svelte";
	import { renderSnippet } from "$lib/components/ui/data-table/index";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import * as Table from "$lib/components/ui/table/index";

	//icons
	import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { NFdb } from "$lib/types";
	import type { ColumnDef, PaginationState } from "@tanstack/table-core";
	import { toTitleCase } from "@cerebrusinc/fstring";

	type MatchedTrade = NFdb["public"]["Tables"]["sbz-matched-trades"]["Row"];
	type OnScreenOrder = NFdb["public"]["Tables"]["on-screen-orders"]["Row"];

	let { data }: PageProps = $props();

	let matchedData = $state<MatchedTrade[]>([]);
	let screenData = $state<OnScreenOrder[]>([]);
	let initialisingMatched = $state<boolean>(true);
	let initialisingScreen = $state<boolean>(true);

	let tradeType = $state<"matched" | "screen">("matched");

	$effect(() => {
		data.matchedTrades
			.then((res) => {
				matchedData = res.trades;
				initialisingMatched = false;
			})
			.catch(() => {
				toast.error("Failed to get matched trades! Please refresh the browser in a few minutes.");
				initialisingMatched = false;
			});
	});

	$effect(() => {
		data.onScreenTrades
			.then((res) => {
				screenData = res.trades;
				initialisingScreen = false;
			})
			.catch(() => {
				toast.error("Failed to get on screen orders! Please refresh the browser in a few minutes.");
				initialisingScreen = false;
			});
	});

	let isMobile = $derived($screenWidthStore < 767);

	const columnsMatched: ColumnDef<MatchedTrade>[] = [
		{
			accessorKey: "trade_date",
			header: "Traded",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<p class="whitespace-normal">${prettyDate(value)}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "settlement_date",
			header: "Settles",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<p class="whitespace-normal">${prettyDate(value)}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "luse_id",
			header: "LuSE ID",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | number;
					return {
						render: () => `<span class="num">${value}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "names",
			header: "Names",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<p class="whitespace-normal">${toTitleCase(value)}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "trade_side",
			header: "Side",
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
			accessorKey: "symbol",
			header: "Symbol",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => mrMateSymbols(value),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "price",
			header: "Price",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | number;
					return {
						render: () => `<span class="num">${value}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "qty",
			header: "Quantity",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | number;
					return {
						render: () => `<span class="num">${numParse(value)}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "trader",
			header: "Trader",
		},
		{
			accessorKey: "counterparty_luse_id",
			header: "Counterparty LuSE ID",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | number;
					return {
						render: () => `<span class="num">${numParse(value)}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "counterparty_name",
			header: "Counterparty Name",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<p class="whitespace-normal">${toTitleCase(value)}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "counterparty_broker",
			header: "Counterparty Broker",
		},
	];

	type StrongFilter = "none" | "Buy" | "Sell";

	let strongFilterMatched = $state<StrongFilter>("none");
	const updateStrongFilterMatched = (val: StrongFilter) => (strongFilterMatched = val);

	let cleanedMatched = $derived.by(() => {
		switch (strongFilterMatched) {
			case "none":
				return matchedData;
			case "Buy":
				const buyTickets = matchedData.filter((item) => item.trade_side === "buy");
				return buyTickets;
			case "Sell":
				const closeddTickets = matchedData.filter((item) => item.trade_side === "sell");
				return closeddTickets;
			default:
				return matchedData;
		}
	});

	let globalFilterValueMatched = $state<string>("");

	// ! could be a search error here
	let filteredMatched = $derived.by(() => {
		return cleanedMatched.filter((entry) => {
			let res: boolean = false;

			const _sanitize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
			const _compare = (value: string) =>
				_sanitize(value).includes(_sanitize(globalFilterValueMatched));

			if (_compare(prettyDate(entry.trade_date))) res = true;
			if (_compare(entry.luse_id.toString())) res = true;
			if (_compare(entry.names)) res = true;
			if (_compare(mrMateSymbols(entry.symbol))) res = true;
			if (_compare(entry.price.toString())) res = true;
			if (_compare(entry.qty.toString())) res = true;
			if (_compare(entry.trader)) res = true;
			if (_compare(entry.counterparty_name)) res = true;
			if (_compare(entry.counterparty_broker)) res = true;

			return res;
		});
	});

	let paginationMatched = $state<PaginationState>({ pageIndex: 0, pageSize: 200 });

	const tableMatched = createSvelteTable({
		get data() {
			return filteredMatched;
		},
		columns: columnsMatched,
		state: {
			get pagination() {
				return paginationMatched;
			},
		},
		onPaginationChange: (updater) => {
			if (typeof updater === "function") {
				paginationMatched = updater(paginationMatched);
			} else {
				paginationMatched = updater;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	// screen

	const columnsScreen: ColumnDef<OnScreenOrder>[] = [
		{
			accessorKey: "date",
			header: "Date Entered",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<p class="whitespace-normal">${prettyDate(value)}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "luse_id",
			header: "LuSE ID",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | number;
					return {
						render: () => `<span class="num">${value}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "names",
			header: "Names",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<p class="whitespace-normal">${toTitleCase(value)}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "order_side",
			header: "Side",
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
			accessorKey: "symbol",
			header: "Symbol",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => mrMateSymbols(value),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "price",
			header: "Price",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | number;
					return {
						render: () => `<span class="num">${value}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "qty",
			header: "Quantity",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | number;
					return {
						render: () => `<span class="num">${numParse(value)}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "trader",
			header: "Trader",
		},
	];

	let strongFilterScreen = $state<StrongFilter>("none");
	const updateStrongFilterScreen = (val: StrongFilter) => (strongFilterScreen = val);

	let cleanedScreen = $derived.by(() => {
		switch (strongFilterScreen) {
			case "none":
				return screenData;
			case "Buy":
				const buyTickets = screenData.filter((item) => item.order_side === "buy");
				return buyTickets;
			case "Sell":
				const closeddTickets = screenData.filter((item) => item.order_side === "sell");
				return closeddTickets;
			default:
				return screenData;
		}
	});

	let globalFilterValueScreen = $state<string>("");

	let paginationScreen = $state<PaginationState>({ pageIndex: 0, pageSize: 200 });

	// ! could be a search error here
	let filteredScreen = $derived.by(() => {
		return cleanedScreen.filter((entry) => {
			let res: boolean = false;

			const _sanitize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
			const _compare = (value: string) =>
				_sanitize(value).includes(_sanitize(globalFilterValueScreen));

			if (_compare(prettyDate(entry.date))) res = true;
			if (_compare(entry.luse_id.toString())) res = true;
			if (_compare(entry.names)) res = true;
			if (_compare(mrMateSymbols(entry.symbol))) res = true;
			if (_compare(entry.price.toString())) res = true;
			if (_compare(entry.qty.toString())) res = true;
			if (_compare(entry.trader)) res = true;

			return res;
		});
	});

	const tableScreen = createSvelteTable({
		get data() {
			return filteredScreen;
		},
		columns: columnsScreen,
		state: {
			get pagination() {
				return paginationScreen;
			},
		},
		onPaginationChange: (updater) => {
			if (typeof updater === "function") {
				paginationScreen = updater(paginationScreen);
			} else {
				paginationScreen = updater;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});
</script>

<Head
	title="Trades | SBZ Admin"
	ogTitle="Trades"
	description="Quickly sift through the trades over the past month."
	ogDescription="Quickly sift through the trades over the past month."
/>

{#if tradeType === "matched"}
	<!-- start -->
	{#if initialisingMatched}
		{#if isMobile}
			<div class="flex flex-row items-center justify-between">
				<h1>Trades</h1>
				<Button variant="secondary" class="loading ml-2" disabled
					>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
				>
			</div>
			<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
				<Search class="mr-4" />
				<Input class="w-[100%]" placeholder="Filter Trades..." type="text" disabled />
			</div>
		{:else}
			<div class="flex flex-row items-center justify-between">
				<div class="flex items-center">
					<h1>Trades</h1>
					<Tabs.Root bind:value={tradeType} class="ml-5" disabled>
						<Tabs.List>
							<Tabs.Trigger class="loading cursor-pointer" value="matched">Matched</Tabs.Trigger>
							<Tabs.Trigger class="loading ml-2 cursor-pointer" value="screen"
								>On Screen</Tabs.Trigger
							>
						</Tabs.List>
					</Tabs.Root>
				</div>
				<div class="flex w-[50%] items-center">
					<Search class="mr-4 h-10 w-10" />
					<Input class="w-[100%]" placeholder="Filter Trades..." type="text" disabled />
					<AnyCombobox
						handler={updateStrongFilterMatched}
						data={{
							grouped: [
								{
									title: "Trade Side",
									group: [
										{
											label: "Buy",
											value: "Buy",
										},
										{
											label: "Sell",
											value: "Sell",
										},
									],
								},
							],
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
							<strong>Total:</strong> <span class="num">9,999</span>
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
							<strong>TQ:</strong> <span class="num">Lorem (100.00%)</span>
						</p>
						<span class="mx-2 opacity-40">•</span>
						<p class="loading no-padding text-sm opacity-70">
							<strong>TP:</strong> <span class="num">Lorem (100.00%)</span>
						</p>
						<span class="mx-2 opacity-40">•</span>
						<p class="loading no-padding text-sm opacity-70">
							<strong>TR:</strong> <span class="num">Lorem (100.00%)</span>
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
	{:else if !matchedData.length}
		{#if isMobile}
			<div class="flex flex-row items-center justify-between">
				<h1>Trades</h1>
				<Button variant="secondary" class="ml-2" disabled
					>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
				>
			</div>
			<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
				<Search class="mr-4" />
				<Input class="w-[100%]" placeholder="Filter Trades..." type="text" disabled />
			</div>
			<h3 class="mx-auto mt-4 text-center">No data.</h3>
		{:else}
			<div class="flex flex-row items-center justify-between">
				<div class="flex items-center">
					<h1>Trades</h1>
					<Tabs.Root bind:value={tradeType} class="ml-5" disabled>
						<Tabs.List>
							<Tabs.Trigger class="cursor-pointer" value="matched">Matched</Tabs.Trigger>
							<Tabs.Trigger class="ml-2 cursor-pointer" value="screen">On Screen</Tabs.Trigger>
						</Tabs.List>
					</Tabs.Root>
				</div>
				<div class="flex w-[50%] items-center">
					<Search class="mr-4 h-10 w-10" />
					<Input class="w-[100%]" placeholder="Filter Trades..." type="text" disabled />
					<AnyCombobox
						handler={updateStrongFilterMatched}
						data={{
							grouped: [
								{
									title: "Trade Side",
									group: [
										{
											label: "Buy",
											value: "Buy",
										},
										{
											label: "Sell",
											value: "Sell",
										},
									],
								},
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
				<div class="table-tainer mt-3 flex items-center rounded-md border">
					<h3 class="mx-auto mt-4 text-center">No data.</h3>
				</div>
			</div>
		{/if}
	{:else if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Trades</h1>
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
			<Input class="w-[100%]" placeholder="Filter Trades..." type="text" />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<div class="flex items-center">
				<h1>Trades</h1>
				<Tabs.Root bind:value={tradeType} class="ml-5">
					<Tabs.List>
						<Tabs.Trigger class="cursor-pointer" value="matched">Matched</Tabs.Trigger>
						<Tabs.Trigger class="ml-2 cursor-pointer" value="screen">On Screen</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
			</div>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input
					class="w-[100%]"
					bind:value={globalFilterValueMatched}
					placeholder="Filter Trades..."
					type="text"
				/>
				<AnyCombobox
					handler={updateStrongFilterMatched}
					data={{
						grouped: [
							{
								title: "Trade Side",
								group: [
									{
										label: "Buy",
										value: "Buy",
									},
									{
										label: "Sell",
										value: "Sell",
									},
								],
							},
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
							{#each tableMatched.getHeaderGroups() as headerGroup (headerGroup.id)}
								<Table.Row>
									{#each headerGroup.headers as header (header.id)}
										<Table.Head
											colspan={header.colSpan}
											class="max-w-[400px] px-8 text-center font-bold"
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
							{#each tableMatched.getRowModel().rows as row (row.id)}
								<Table.Row data-state={row.getIsSelected() && "selected"}>
									{#each row.getVisibleCells() as cell (cell.id)}
										<Table.Cell class="max-w-[400px] px-5 py-2 text-center">
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</Table.Cell>
									{/each}
								</Table.Row>
							{:else}
								<Table.Row>
									<Table.Cell colspan={columnsMatched.length} class="h-24 text-center">
										No results.
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>

			<div class="mt-2 flex items-center justify-between space-x-4">
				<!--
			<div class="sum-tainer flex items-center justify-between">
				<p class="text-sm opacity-70">
					<strong>Total:</strong> <span class="num">{numParse(summary.total)}</span>
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
				<p class="no-padding text-sm opacity-70">
					<strong>TQ:</strong> <span class="num">{summary.mostPopularQuery}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="no-padding text-sm opacity-70">
					<strong>TP:</strong> <span class="num">{summary.mostPopularPlatform}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="no-padding text-sm opacity-70">
					<strong>TR:</strong> <span class="num">{summary.mostPopularReferrer}</span>
				</p>
			</div>
        -->

				<div class="flex flex-row items-center justify-end">
					<Button
						variant="outline"
						size="sm"
						onclick={() => tableMatched.previousPage()}
						disabled={!tableMatched.getCanPreviousPage()}
						><ChevronLeft class="mr-2 h-4 w-4" />Previous</Button
					>
					<Button class="mx-2" variant="outline" size="sm" disabled={true}
						>{paginationMatched.pageIndex + 1}</Button
					>
					<Button
						variant="outline"
						size="sm"
						onclick={() => tableMatched.nextPage()}
						disabled={!tableMatched.getCanNextPage()}
						>Next<ChevronRight class="ml-2 h-4 w-4" /></Button
					>
				</div>
			</div>
		</div>
	{/if}
	<!-- end -->
{:else}
	<!-- start -->
	{#if initialisingScreen}
		{#if isMobile}
			<div class="flex flex-row items-center justify-between">
				<h1>Trades</h1>
				<Button variant="secondary" class="loading ml-2" disabled
					>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
				>
			</div>
			<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
				<Search class="mr-4" />
				<Input class="w-[100%]" placeholder="Filter Trades..." type="text" disabled />
			</div>
		{:else}
			<div class="flex flex-row items-center justify-between">
				<div class="flex items-center">
					<h1>Trades</h1>
					<Tabs.Root bind:value={tradeType} class="ml-5" disabled>
						<Tabs.List>
							<Tabs.Trigger class="loading cursor-pointer" value="matched">Matched</Tabs.Trigger>
							<Tabs.Trigger class="loading ml-2 cursor-pointer" value="screen"
								>On Screen</Tabs.Trigger
							>
						</Tabs.List>
					</Tabs.Root>
				</div>
				<div class="flex w-[50%] items-center">
					<Search class="mr-4 h-10 w-10" />
					<Input class="w-[100%]" placeholder="Filter Trades..." type="text" disabled />
					<AnyCombobox
						handler={updateStrongFilterMatched}
						data={{
							grouped: [
								{
									title: "Trade Side",
									group: [
										{
											label: "Buy",
											value: "Buy",
										},
										{
											label: "Sell",
											value: "Sell",
										},
									],
								},
							],
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
							<strong>Total:</strong> <span class="num">9,999</span>
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
							<strong>TQ:</strong> <span class="num">Lorem (100.00%)</span>
						</p>
						<span class="mx-2 opacity-40">•</span>
						<p class="loading no-padding text-sm opacity-70">
							<strong>TP:</strong> <span class="num">Lorem (100.00%)</span>
						</p>
						<span class="mx-2 opacity-40">•</span>
						<p class="loading no-padding text-sm opacity-70">
							<strong>TR:</strong> <span class="num">Lorem (100.00%)</span>
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
	{:else if !screenData.length}
		{#if isMobile}
			<div class="flex flex-row items-center justify-between">
				<h1>Trades</h1>
				<Button variant="secondary" class="ml-2" disabled
					>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
				>
			</div>
			<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
				<Search class="mr-4" />
				<Input class="w-[100%]" placeholder="Filter Trades..." type="text" disabled />
			</div>
			<h3 class="mx-auto mt-4 text-center">No data.</h3>
		{:else}
			<div class="flex flex-row items-center justify-between">
				<div class="flex items-center">
					<h1>Trades</h1>
					<Tabs.Root bind:value={tradeType} class="ml-5" disabled>
						<Tabs.List>
							<Tabs.Trigger class="cursor-pointer" value="matched">Matched</Tabs.Trigger>
							<Tabs.Trigger class="ml-2 cursor-pointer" value="screen">On Screen</Tabs.Trigger>
						</Tabs.List>
					</Tabs.Root>
				</div>
				<div class="flex w-[50%] items-center">
					<Search class="mr-4 h-10 w-10" />
					<Input class="w-[100%]" placeholder="Filter Trades..." type="text" disabled />
					<AnyCombobox
						handler={updateStrongFilterMatched}
						data={{
							grouped: [
								{
									title: "Trade Side",
									group: [
										{
											label: "Buy",
											value: "Buy",
										},
										{
											label: "Sell",
											value: "Sell",
										},
									],
								},
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
				<div class="table-tainer mt-3 flex items-center rounded-md border">
					<h3 class="mx-auto mt-4 text-center">No data.</h3>
				</div>
			</div>
		{/if}
	{:else if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Trades</h1>
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
			<Input class="w-[100%]" placeholder="Filter Trades..." type="text" />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<div class="flex items-center">
				<h1>Trades</h1>
				<Tabs.Root bind:value={tradeType} class="ml-5">
					<Tabs.List>
						<Tabs.Trigger class="cursor-pointer" value="matched">Matched</Tabs.Trigger>
						<Tabs.Trigger class="ml-2 cursor-pointer" value="screen">On Screen</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
			</div>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input
					class="w-[100%]"
					bind:value={globalFilterValueScreen}
					placeholder="Filter Trades..."
					type="text"
				/>
				<AnyCombobox
					handler={updateStrongFilterScreen}
					data={{
						grouped: [
							{
								title: "Trade Side",
								group: [
									{
										label: "Buy",
										value: "Buy",
									},
									{
										label: "Sell",
										value: "Sell",
									},
								],
							},
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
							{#each tableScreen.getHeaderGroups() as headerGroup (headerGroup.id)}
								<Table.Row>
									{#each headerGroup.headers as header (header.id)}
										<Table.Head
											colspan={header.colSpan}
											class="max-w-[400px] px-8 text-center font-bold"
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
							{#each tableScreen.getRowModel().rows as row (row.id)}
								<Table.Row data-state={row.getIsSelected() && "selected"}>
									{#each row.getVisibleCells() as cell (cell.id)}
										<Table.Cell class="max-w-[400px] px-5 py-2 text-center">
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</Table.Cell>
									{/each}
								</Table.Row>
							{:else}
								<Table.Row>
									<Table.Cell colspan={columnsMatched.length} class="h-24 text-center">
										No results.
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>

			<div class="mt-2 flex items-center justify-between space-x-4">
				<!--
			<div class="sum-tainer flex items-center justify-between">
				<p class="text-sm opacity-70">
					<strong>Total:</strong> <span class="num">{numParse(summary.total)}</span>
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
				<p class="no-padding text-sm opacity-70">
					<strong>TQ:</strong> <span class="num">{summary.mostPopularQuery}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="no-padding text-sm opacity-70">
					<strong>TP:</strong> <span class="num">{summary.mostPopularPlatform}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="no-padding text-sm opacity-70">
					<strong>TR:</strong> <span class="num">{summary.mostPopularReferrer}</span>
				</p>
			</div>
        -->

				<div class="flex flex-row items-center justify-end">
					<Button
						variant="outline"
						size="sm"
						onclick={() => tableMatched.previousPage()}
						disabled={!tableMatched.getCanPreviousPage()}
						><ChevronLeft class="mr-2 h-4 w-4" />Previous</Button
					>
					<Button class="mx-2" variant="outline" size="sm" disabled={true}
						>{paginationMatched.pageIndex + 1}</Button
					>
					<Button
						variant="outline"
						size="sm"
						onclick={() => tableMatched.nextPage()}
						disabled={!tableMatched.getCanNextPage()}
						>Next<ChevronRight class="ml-2 h-4 w-4" /></Button
					>
				</div>
			</div>
		</div>
	{/if}
	<!-- end -->
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
