<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { numParse } from "@cerebrusinc/qol";
	import { mrMateSymbols, prettyDate, logos, contactDetails } from "$lib/utils";
	import { createRawSnippet } from "svelte";
	import { renderSnippet, renderComponent } from "$lib/components/ui/data-table/index";
	import { toTitleCase } from "@cerebrusinc/fstring";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";
	import Action from "./Action.svelte";
	import AnyPickerDate from "$lib/components/AnyPickerDate.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Table from "$lib/components/ui/table/index";

	//icons
	import {
		Search,
		ChevronLeft,
		ChevronRight,
		SlidersHorizontal,
		Download,
		MapPin,
		Phone,
		Mail,
	} from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { SBZdb } from "$lib/types";
	import type { ColumnDef, PaginationState } from "@tanstack/table-core";

	type SettledTradeRow = SBZdb["public"]["Tables"]["settled_trades"]["Row"];

	let { data }: PageProps = $props();

	let settledData = $state<SettledTradeRow[]>([]);
	let initialisingMatched = $state<boolean>(true);

	$effect(() => {
		data.settled
			.then((res) => {
				settledData = res;
				initialisingMatched = false;
			})
			.catch(() => {
				toast.error("Failed to get settled trades! Please refresh the browser in a few minutes.");
				initialisingMatched = false;
			});
	});

	let isMobile = $derived($screenWidthStore < 767);
	let disabled = $state<boolean>(false);

	const initSettled: SettledTradeRow = {
		broker_ref: "",
		counter_firm: "",
		created_at: "",
		csd_ref: "",
		currency: "",
		date: 0,
		id: 0,
		luse_id: 0,
		names: "",
		price: 0,
		qty: 0,
		side: "",
		symbol: "",
		value: 0,
		luse_comission: 0,
		sec_commision: 0,
		broker_comission: 0,
		trade_date: "",
	};

	let openTrigger = $state<number>(0);

	let activeRow = $state<SettledTradeRow>(initSettled);
	let sheetTitle = $state<string>("");

	const openSheet = (row: SettledTradeRow) => {
		activeRow = row;

		sheetTitle = `${toTitleCase(activeRow.names)} Contract Note`;

		openTrigger = Date.now();
	};

	const genPdf = async (id: string) => {
		toast.info(`Generating ${toTitleCase(activeRow.names)}'s contract note...`);
		disabled = true;
		const html = document.getElementById(id)?.innerHTML;

		try {
			const response = await fetch("/api/admin/trades/reports", {
				method: "POST",
				body: JSON.stringify({ html }),
			});

			const blob = await response.blob();
			const blobURL = URL.createObjectURL(blob);

			const a = document.createElement("a");
			a.href = blobURL;
			a.download = `${toTitleCase(activeRow.names)}'s Contract Note - ${prettyDate(selectedDate)}.pdf`; // Optional: set the filename
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			// Clean up
			URL.revokeObjectURL(blobURL);

			disabled = false;

			toast.success("Contract note downloaded!");

			/*
			disabled = false;
			window.open(blobURL, "_blank");
            */
		} catch (ex) {
			toast.error(ex as any);
			console.error(ex);
			disabled = false;
		}
	};

	let selectedDate = $state<number>(0);
	const updateDate = (value: number) => (selectedDate = value);

	/**For comission, make it an absolute value so it can be displayed correctly */
	const abs = (val: number): number => {
		if (val < 0) return val * -1;
		return val;
	};

	let reportSummary = $derived.by(() => {
		const { luse_id } = activeRow;

		const tradesRaw = settledData.filter((item) => item.luse_id === luse_id);
		const tradesFiltered = tradesRaw.filter((item) => item.date === selectedDate);

		let zmwTotal: number = 0;
		let usdTotal: number = 0;

		type SimpleTrade = {
			symbol: string;
			price: number;
			qty: number;
			total: number;
			side: string;
			date: string;
			currency: string;
			ref: string;
			bComission: number;
			sComission: number;
			lComission: number;
			totalComission: number;
		};

		const tradesObj: {
			[key: string]: SimpleTrade;
		} = {};

		let bComission = 0;
		let lComission = 0;
		let sComission = 0;

		let totalComission = 0;

		if (tradesFiltered.length) {
			tradesFiltered.forEach((trade) => {
				let symbol = mrMateSymbols(trade.symbol) + trade.price.toString();

				// begin
				if (trade.currency === "zmw") {
					zmwTotal = zmwTotal + trade.price * trade.qty;
				}

				if (trade.currency === "usd") {
					usdTotal = usdTotal + trade.price * trade.qty;
				}

				bComission = trade.price * 0.01 * trade.qty;
				lComission = trade.price * 0.00375 * trade.qty;
				sComission = trade.price * 0.00125 * trade.qty;

				totalComission = bComission + lComission + sComission;

				if (trade.side === "sell") totalComission = totalComission * -1;

				tradesObj[symbol] = {
					date: prettyDate(trade.date),
					side: trade.side,
					symbol: mrMateSymbols(trade.symbol),
					price: trade.price,
					qty: trade.qty,
					total: trade.value,
					currency: trade.currency.toUpperCase(),
					ref: trade.csd_ref,
					bComission,
					lComission,
					sComission,
					totalComission,
				};
			});

			const trades = Object.values(tradesObj).sort((a, b) => a.symbol.localeCompare(b.symbol));

			const tradeDates = tradesRaw.map((trade) => {
				return { label: prettyDate(trade.date), value: trade.date };
			});

			return { zmwTotal, usdTotal, trades, tradesRaw, tradeDates };
		}
	});

	const columns: ColumnDef<SettledTradeRow>[] = [
		{
			accessorKey: "date",
			header: "Date",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<p class="whitespace-nowrap">${prettyDate(value)}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "side",
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
			accessorKey: "names",
			header: "Names",
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
					const value = cell.getValue() as number;
					return {
						render: () => `<span class="num">${numParse(value.toFixed(2))}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "qty",
			header: "Volume",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as number;
					return {
						render: () => `<span class="num">${numParse(value.toFixed(2))}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "value",
			header: "Total",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as number;
					return {
						render: () => `<span class="num">${numParse(value.toFixed(2))}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "currency",
			header: "Currency",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => value.toUpperCase(),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			id: "settle-action",
			cell: ({ row }) =>
				renderComponent(Action, {
					data: row.original,
					openSheet: openSheet,
				}),
		},
	];

	type StrongFilter = "none" | "Buy" | "Sell" | "ZMW" | "USD";

	let strongFilter = $state<StrongFilter>("none");
	const updateStrongFilter = (val: StrongFilter) => (strongFilter = val);

	let cleaned = $derived.by(() => {
		switch (strongFilter) {
			case "none":
				return settledData;
			case "Buy":
				const buyTrades = settledData.filter((item) => item.side === "buy");
				return buyTrades;
			case "Sell":
				const sellTrades = settledData.filter((item) => item.side === "sell");
				return sellTrades;
			case "ZMW":
				const zmwTrades = settledData.filter((item) => item.currency === "zmw");
				return zmwTrades;
			case "Sell":
				const usdTrades = settledData.filter((item) => item.side === "usd");
				return usdTrades;
			default:
				return settledData;
		}
	});

	let globalFilterValue = $state<string>("");

	// ! could be a search error here
	let filtered = $derived.by(() => {
		return cleaned.filter((entry) => {
			let res: boolean = false;

			const _sanitize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
			const _compare = (value: string) => _sanitize(value).includes(_sanitize(globalFilterValue));

			if (_compare(prettyDate(entry.date))) res = true;
			if (_compare(entry.luse_id.toString())) res = true;
			if (_compare(entry.names)) res = true;
			if (_compare(mrMateSymbols(entry.symbol))) res = true;
			if (_compare(entry.price.toString())) res = true;
			if (_compare(entry.qty.toString())) res = true;
			if (_compare(entry.value.toString())) res = true;

			return res;
		});
	});

	let summary = $derived.by(() => {
		let totalBuy: number = 0;
		let totalBuyUSD: number = 0;
		let totalSell: number = 0;
		let totalSellUSD: number = 0;
		let totalTrades: number = 0;

		let mostTradedObj: { [key: string]: { symbol: string; value: number } } = {};

		const clientsBlist: number[] = [];

		filtered.forEach((trade) => {
			totalTrades++;

			if (!clientsBlist.includes(trade.luse_id)) {
				clientsBlist.push(trade.luse_id);
			}

			if (trade.symbol.includes("USD")) {
				if (trade.side === "buy") totalBuyUSD += trade.value;
				if (trade.side === "sell") totalSellUSD += trade.value;
			} else {
				if (trade.side === "buy") totalBuy += trade.value;
				if (trade.side === "sell") totalSell += trade.value;
			}

			if (mostTradedObj[trade.symbol]) {
				mostTradedObj[trade.symbol].value = mostTradedObj[trade.symbol].value + trade.value;
			} else {
				mostTradedObj[trade.symbol] = { symbol: trade.symbol, value: trade.value };
			}
		});

		const mostTradedArr = Object.values(mostTradedObj);
		mostTradedArr.sort((a, b) => b.value - a.value);

		const mostTraded = mostTradedArr.length ? mostTradedArr[0].symbol : "ERROR";

		return {
			totalBuy,
			totalBuyUSD,
			totalSell,
			totalSellUSD,
			totalTrades,
			totalClients: clientsBlist.length,
			mostTraded,
		};
	});

	let dates = $derived.by(() => {
		if (filtered.length) {
			const d = filtered.map((row) => {
				return { label: prettyDate(row.date), value: row.date };
			});

			return d;
		} else {
			return [{ label: "", value: 0 }];
		}
	});

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 200 });

	const table = createSvelteTable({
		get data() {
			return filtered;
		},
		columns: columns,
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
	title="Settlement | SBZ Admin"
	ogTitle="Settlement"
	description="Quickly sift through the settled trades over the past month."
	ogDescription="Quickly sift through the settled trades over the past month."
/>

<!-- start -->
{#if initialisingMatched}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Settlement</h1>
			<Button variant="secondary" class="loading ml-2" disabled
				>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Settled Trades..." type="text" disabled />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<div class="flex flex-row items-center">
				<h1>Settlement</h1>
				<div class="loading ml-5 flex flex-row gap-1.5">
					<AnyPickerDate
						data={[{ label: "", value: "" }]}
						handler={updateDate}
						value={selectedDate}
						pickerTitle="Date"
					/>
				</div>
			</div>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Settled Trades..." type="text" disabled />
				<AnyCombobox
					handler={updateStrongFilter}
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
							{
								title: "Currency",
								group: [
									{
										label: "ZMW",
										value: "ZMW",
									},
									{
										label: "USD",
										value: "USD",
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
					<p class="loading text-sm opacity-70">
						<strong>Buy (K):</strong> <span class="num">999,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading text-sm opacity-70">
						<strong>Sell (K):</strong> <span class="num">999,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading text-sm opacity-70">
						<strong>Buy ($):</strong>
						<span class="num">999,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading text-sm opacity-70">
						<strong>Sell ($):</strong>
						<span class="num">999,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading text-sm opacity-70">
						<strong>Clients:</strong> <span class="num">999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading text-sm opacity-70">
						<strong>Trades:</strong>
						<span class="num">999,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading text-sm opacity-70">
						<strong>Popular:</strong> XXXXXX
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
{:else if !settledData.length}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Settlement</h1>
			<Button variant="secondary" class="ml-2" disabled
				>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Settled Trades..." type="text" disabled />
		</div>
		<h3 class="mx-auto mt-4 text-center">No data.</h3>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<div class="flex flex-row items-center">
				<h1>Settlement</h1>
				<div class="ml-5 flex flex-row gap-1.5">
					<AnyPickerDate data={[]} handler={updateDate} value={selectedDate} pickerTitle="Date" />
				</div>
			</div>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Settled Trades..." type="text" disabled />
				<AnyCombobox
					handler={updateStrongFilter}
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
							{
								title: "Currency",
								group: [
									{
										label: "ZMW",
										value: "ZMW",
									},
									{
										label: "USD",
										value: "USD",
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
		<h1>Settlement</h1>
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
		<Input class="w-[100%]" placeholder="Filter Settled Trades..." type="text" />
	</div>
{:else}
	<div class="flex flex-row items-center justify-between">
		<div class="flex flex-row items-center">
			<h1>Settlement</h1>
			<div class="ml-5 flex flex-row gap-1.5">
				<AnyPickerDate
					data={dates}
					handler={updateDate}
					value={selectedDate}
					pickerTitle="Date"
					end
				/>
			</div>
		</div>

		<div class="flex w-[50%] items-center">
			<Search class="mr-4 h-10 w-10" />
			<Input
				class="w-[100%]"
				bind:value={globalFilterValue}
				placeholder="Filter Settled Trades..."
				type="text"
			/>
			<AnyCombobox
				handler={updateStrongFilter}
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
						{
							title: "Currency",
							group: [
								{
									label: "ZMW",
									value: "ZMW",
								},
								{
									label: "USD",
									value: "USD",
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
						{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
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
			<div class="sum-tainer flex items-center justify-between">
				<p class="text-sm opacity-70">
					<strong>Buy (K):</strong>
					<span class="num">{numParse(summary.totalBuy.toFixed(2))}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Sell (K):</strong>
					<span class="num">{numParse(summary.totalSell.toFixed(2))}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Buy ($):</strong>
					<span class="num">{numParse(summary.totalBuyUSD.toFixed(2))}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Sell ($):</strong>
					<span class="num">{numParse(summary.totalSellUSD.toFixed(2))}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Clients:</strong>
					<span class="num">{numParse(summary.totalClients)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Trades:</strong>
					<span class="num">{numParse(summary.totalTrades)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Popular:</strong>
					{mrMateSymbols(summary.mostTraded)}
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

	<AnySheet {openTrigger} width={undefined} big={true} title={sheetTitle} description="">
		{#snippet main()}
			<div class="holder">
				<section id="contract-note" class="page-holder">
					{#if reportSummary && reportSummary.trades.length}
						{#each reportSummary.trades as trade}
							<section class="page ui-sp">
								<table class="top">
									<tbody>
										<tr>
											<td><img src={logos.sbz} alt="sbz logo" /></td>
											<td>
												<p class="title">Contract Note</p>
												<p class="exchange">
													{prettyDate(selectedDate)}
												</p>
												<p class="date">
													{activeRow.luse_id}LI - {toTitleCase(activeRow.names)}
												</p>
											</td>
										</tr>
									</tbody>
								</table>

								<p style="margin-top: 10px; margin-bottom: 20px;">
									Please take a look at your contract note for the above stated period in the table
									below.
								</p>

								<table class="trade-summary">
									<thead>
										<tr>
											<th colspan="5"
												>Order Ref: {trade.ref} | Curreny: {trade.currency.toUpperCase()}</th
											>
										</tr>
										<tr>
											<th style="text-align: left;">Side</th>
											<th>Symbol</th>
											<th>Price</th>
											<th>Volume</th>
											<th style="text-align: right;">Total</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td style="text-align: left;">{trade.side}</td>

											<td style="text-align: center;">{trade.symbol}</td>
											<td style="text-align: center;"
												><span class="num">{numParse(trade.price.toFixed(2))}</span></td
											>
											<td style="text-align: center;"
												><span class="num">{numParse(trade.qty)}</span></td
											>
											<td style="text-align: right;"
												><span class="num">{numParse(trade.total.toFixed(2))}</span></td
											>
										</tr>
									</tbody>
								</table>

								<table class="trade-summary" style="margin-top: 30px;">
									<thead>
										<tr>
											<th colspan="2">Comission Breakdown</th>
										</tr>
										<tr>
											<th style="text-align: left;">Source</th>
											<th style="text-align: right;">Value</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td style="text-align: left; white-space: nowrap;">Broker @ 1.00%</td>
											<td style="text-align: right;"
												><span class="num">{numParse(trade.bComission.toFixed(2))}</span></td
											>
										</tr>
										<tr>
											<td style="text-align: left; white-space: nowrap;">LuSE @ 0.375%</td>
											<td style="text-align: right;"
												><span class="num">{numParse(trade.lComission.toFixed(2))}</span></td
											>
										</tr>
										<tr>
											<td style="text-align: left; white-space: nowrap;">SEC @ 0.125%</td>
											<td style="text-align: right;"
												><span class="num">{numParse(trade.sComission.toFixed(2))}</span></td
											>
										</tr>
										<tr class="trades-total">
											<td colspan="2" style="text-align: right;"
												><strong
													>Total: <span class="num"
														>{numParse(abs(trade.totalComission).toFixed(2))}</span
													></strong
												></td
											>
										</tr>
									</tbody>
								</table>

								<h3
									style="width: 100%; text-align: center; margin-top: 50px; border-top: 1px dashed black; border-bottom: 1px dashed black;"
								>
									Total Funds: <span class="num"
										>{numParse((trade.total + trade.totalComission).toFixed(2))}</span
									>
								</h3>

								<p
									class="pnum"
									style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"
								>
									<span>Prepared by {toTitleCase(data.admin)}</span>
									<span>1</span>
								</p>

								<p class="contact-btm">
									<MapPin style="height: 20px; width: 20px;" />
									<span style="margin-right: 10px;">{contactDetails.address}</span>
									<Phone style="height: 20px; width: 20px;" />
									<span style="margin-right: 10px;">{contactDetails.tel}</span>
									<Mail style="height: 20px; width: 20px;" />
									<span style="margin-right: 10px;">{contactDetails.email}</span>
								</p>
							</section>
						{/each}
					{/if}
				</section>

				<div class="controls">
					<Button class="mt-5" {disabled} onclick={() => genPdf("contract-note")}
						>Download<Download class="ml-2 h-4 w-4" /></Button
					>
				</div>
			</div>
		{/snippet}

		{#snippet actionButton()}
			<span></span>
		{/snippet}
	</AnySheet>
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

	/** doc */
	.holder {
		display: flex;
		flex-direction: row;
		height: fit-content;
		width: 100%;
		position: relative;
	}

	.holder .controls {
		height: fit-content;
		width: max-content;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: fixed;
		top: 50%;
		transform: translateY(-50%);
		left: 960px;
	}

	.page-holder {
		width: fit-content;
		display: flex;
		flex-direction: column;
	}

	// start

	.page-holder .page {
		color: black !important;
		width: 21cm;
		height: 29.7cm;
		background-color: white;
		padding: 1.5cm 1cm;
		font-family: "Nunito", sans-serif;
		position: relative;
	}

	.page .top {
		width: 100%;
		border-top: 1px solid black;
		border-bottom: 1px solid black;
	}

	.top img {
		width: 2cm;
		height: auto;
		margin-left: 10px;
	}

	.top td {
		padding: 5px 0px;
	}

	.top td p {
		text-align: end;
		margin-right: 10px;
	}

	.top td p.title {
		font-weight: bold;
		font-size: 14pt;
	}

	.top td p.exchange {
		font-weight: 400;
		font-size: 14pt;
	}

	.top td p.date {
		font-weight: 400;
		font-style: italic;
		font-size: 12pt;
	}

	.trade-summary {
		width: 100%;
		table-layout: fixed;
	}

	.trade-summary thead tr:nth-child(1) {
		border-top: 1px solid black;
		border-bottom: 1px dashed black;
	}

	.trade-summary thead tr:nth-child(2) {
		border-bottom: 1px solid black;
	}

	.trade-summary td,
	.trade-summary th {
		padding: 3px 0px;
	}

	.trade-summary tbody tr:nth-child(even) {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.trades-total {
		background-color: transparent !important;
	}

	.pnum {
		position: absolute;
		width: 21cm;
		text-align: center;
		bottom: 60px;
		font-size: 10pt;
		left: 0px;
	}

	.contact-btm {
		position: absolute;
		width: 19cm;
		padding: 5px 0px;
		text-align: center;
		bottom: 30px;
		font-size: 10pt;
		left: 1cm;
		display: flex;
		flex-direction: row;
		white-space: nowrap;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
		font-style: italic;
		border-top: 1px solid black;
	}

	/**Exclude */
	.page.ui-sp {
		margin-top: 20px;
	}
</style>
