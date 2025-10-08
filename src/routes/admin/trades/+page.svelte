<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { numParse } from "@cerebrusinc/qol";
	import { mrMateSymbols, prettyDate, logos } from "$lib/utils";
	import { createRawSnippet } from "svelte";
	import { renderSnippet, renderComponent } from "$lib/components/ui/data-table/index";
	import { toTitleCase } from "@cerebrusinc/fstring";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";
	import MatchedAction from "./MatchedAction.svelte";
	import ScreenAction from "./screenAction.svelte";
	import AnyPickerDate from "$lib/components/AnyPickerDate.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import * as Table from "$lib/components/ui/table/index";
	import Label from "$lib/components/ui/label/label.svelte";

	//icons
	import {
		Search,
		ChevronLeft,
		ChevronRight,
		SlidersHorizontal,
		Download,
		Shrink,
		Expand,
	} from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { NFdb } from "$lib/types";
	import type { ColumnDef, PaginationState } from "@tanstack/table-core";

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
	let disabled = $state<boolean>(false);

	const initMatched: MatchedTrade = {
		broker: "",
		counterparty_broker: "",
		counterparty_luse_id: 0,
		counterparty_name: "",
		created_at: "",
		id: 0,
		luse_id: 0,
		market: "",
		names: "",
		price: 0,
		qty: 0,
		settlement_date: 0,
		symbol: "",
		trade_date: 0,
		trade_side: "buy",
		trade_time: "",
		trader: "",
	};

	let openTriggerMatched = $state<number>(0);

	let activeRowMatched = $state<MatchedTrade>(initMatched);
	let sheetTitleMatched = $state<string>("");

	const openSheetMatched = (row: MatchedTrade) => {
		activeRowMatched = row;

		sheetTitleMatched = `${toTitleCase(activeRowMatched.names)} Matched Trade Report`;

		openTriggerMatched = Date.now();
	};

	const chunkArray = <T,>(arr: T[], size: number = 20) => {
		const result = [];
		for (let i = 0; i < arr.length; i += size) {
			result.push(arr.slice(i, i + size));
		}
		return result;
	};

	const genPdf = async (id: string) => {
		toast.info(`Generating ${toTitleCase(activeRowMatched.names)}'s report...`);
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
			a.download = `SBZ ${toTitleCase(activeRowMatched.names)}'s trade report - ${prettyDate(matchedDateF)}.pdf`; // Optional: set the filename
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			// Clean up
			URL.revokeObjectURL(blobURL);

			disabled = false;

			toast.success("Report downloaded!");

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

	let expandDate = $state<boolean>(false);

	let matchedDateI = $state<number>(0);
	const updateMatchedDateI = (value: number) => (matchedDateI = value);

	let matchedDateF = $state<number>(0);
	const updateMatchedDateF = (value: number) => (matchedDateF = value);

	let reportSummaryMatched = $derived.by(() => {
		const { luse_id } = activeRowMatched;

		let tradesRaw = matchedData.filter((item) => item.luse_id === luse_id);

		// console.log({ matchedDateI, matchedDateF });

		if (matchedDateI && matchedDateF)
			tradesRaw = tradesRaw.filter(
				(item) => item.trade_date >= matchedDateI && item.trade_date <= matchedDateF,
			);

		let zmwTotal: number = 0;
		let usdTotal: number = 0;

		type SimpleTrade = {
			symbol: string;
			price: number;
			qty: number;
			total: number;
			side: string;
			date: string;
		};

		const tradesObjZmw: {
			[key: string]: SimpleTrade;
		} = {};
		const tradesObjUsd: {
			[key: string]: SimpleTrade;
		} = {};

		if (tradesRaw.length) {
			tradesRaw.forEach((trade) => {
				let symbol = mrMateSymbols(trade.symbol) + trade.price.toString();

				if (expandDate) {
					symbol = symbol + trade.trade_date;
				}

				if (trade.symbol.includes("USD")) {
					usdTotal = usdTotal + trade.price * trade.qty;

					if (tradesObjUsd[symbol]) {
						const nQty = tradesObjUsd[symbol].qty + trade.qty;

						tradesObjUsd[symbol].qty = nQty;
						tradesObjUsd[symbol].total = nQty * trade.price;
					} else {
						tradesObjUsd[symbol] = {
							price: trade.price,
							qty: trade.qty,
							symbol: mrMateSymbols(trade.symbol),
							total: trade.price * trade.qty,
							side: toTitleCase(trade.trade_side),
							date: prettyDate(trade.trade_date),
						};
					}
					// end
				} else {
					// begin
					zmwTotal = zmwTotal + trade.price * trade.qty;

					if (tradesObjZmw[symbol]) {
						const nQty = tradesObjZmw[symbol].qty + trade.qty;

						tradesObjZmw[symbol].qty = nQty;
						tradesObjZmw[symbol].total = nQty * trade.price;
					} else {
						tradesObjZmw[symbol] = {
							price: trade.price,
							qty: trade.qty,
							symbol: trade.symbol,
							total: trade.price * trade.qty,
							side: toTitleCase(trade.trade_side),
							date: prettyDate(trade.trade_date),
						};
					}
				}
			});
		}

		let initDate = matchedDateI;
		const finDate = matchedDateF;

		if (initDate === finDate) {
			initDate = 0;
		}

		const tradesZmw = chunkArray<SimpleTrade>(Object.values(tradesObjZmw));
		const tradesUsd = chunkArray<SimpleTrade>(Object.values(tradesObjUsd));

		const tradeDates = tradesRaw.map((trade) => {
			return { label: prettyDate(trade.trade_date), value: trade.trade_date };
		});

		return { zmwTotal, usdTotal, tradesZmw, tradesUsd, initDate, finDate, tradesRaw, tradeDates };
	});

	const columnsMatched: ColumnDef<MatchedTrade>[] = [
		{
			accessorKey: "trade_date",
			header: "Traded",
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
			accessorKey: "settlement_date",
			header: "Settles",
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
		{
			id: "matched-action",
			cell: ({ row }) =>
				renderComponent(MatchedAction, {
					data: row.original,
					openSheet: openSheetMatched,
				}),
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

	let summaryMatched = $derived.by(() => {
		let totalBuy: number = 0;
		let totalBuyUSD: number = 0;
		let totalSell: number = 0;
		let totalSellUSD: number = 0;
		let totalTrades: number = 0;

		let mostTradedObj: { [key: string]: { symbol: string; value: number } } = {};

		const clientsBlist: number[] = [];

		filteredMatched.forEach((trade) => {
			const consideration = trade.price * trade.qty;

			totalTrades++;

			if (!clientsBlist.includes(trade.luse_id)) {
				clientsBlist.push(trade.luse_id);
			}

			if (trade.symbol.includes("USD")) {
				if (trade.trade_side === "buy") totalBuyUSD += consideration;
				if (trade.trade_side === "sell") totalSellUSD += consideration;
			} else {
				if (trade.trade_side === "buy") totalBuy += consideration;
				if (trade.trade_side === "sell") totalSell += consideration;
			}

			if (mostTradedObj[trade.symbol]) {
				const val = trade.price * trade.qty;

				mostTradedObj[trade.symbol].value = mostTradedObj[trade.symbol].value + val;
			} else {
				mostTradedObj[trade.symbol] = { symbol: trade.symbol, value: trade.price * trade.qty };
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

	const initScreen: OnScreenOrder = {
		broker: "",
		created_at: "",
		id: 0,
		luse_id: 0,
		market: "",
		names: "",
		price: 0,
		qty: 0,
		symbol: "",
		order_side: "buy",
		trader: "",
		date: 0,
		expiry: 0,
	};

	let openTriggerScreen = $state<number>(0);

	let activeRowScreen = $state<OnScreenOrder>(initScreen);
	let sheetTitleScreen = $state<string>("");

	const openSheetScreen = (row: OnScreenOrder) => {
		activeRowScreen = row;

		sheetTitleScreen = `${toTitleCase(activeRowScreen.names)} On-Screen Order Report`;

		openTriggerScreen = Date.now();
	};

	let screenDateF = $state<number>(0);
	const updateScreenDateF = (value: number) => (screenDateF = value);

	let reportSummaryScreen = $derived.by(() => {
		const { luse_id, date } = activeRowScreen;

		let ordersRaw = screenData.filter((item) => item.luse_id === luse_id);

		// console.log({ screenDateI, screenDateF });

		const ordersRawDated = ordersRaw.filter((item) => item.date === date);

		let zmwTotal: number = 0;
		let usdTotal: number = 0;

		type SimpleOrder = {
			symbol: string;
			price: number;
			qty: number;
			total: number;
			side: string;
			date: string;
		};

		const ordersObjZmw: {
			[key: string]: SimpleOrder;
		} = {};
		const ordersObjUsd: {
			[key: string]: SimpleOrder;
		} = {};

		if (ordersRawDated.length) {
			ordersRawDated.forEach((trade) => {
				let symbol = mrMateSymbols(trade.symbol) + trade.price.toString();

				if (trade.symbol.includes("USD")) {
					usdTotal = usdTotal + trade.price * trade.qty;

					if (ordersObjUsd[symbol]) {
						const nQty = ordersObjUsd[symbol].qty + trade.qty;

						ordersObjUsd[symbol].qty = nQty;
						ordersObjUsd[symbol].total = nQty * trade.price;
					} else {
						ordersObjUsd[symbol] = {
							price: trade.price,
							qty: trade.qty,
							symbol: mrMateSymbols(trade.symbol),
							total: trade.price * trade.qty,
							side: toTitleCase(trade.order_side),
							date: prettyDate(trade.date),
						};
					}
					// end
				} else {
					// begin
					zmwTotal = zmwTotal + trade.price * trade.qty;

					if (ordersObjZmw[symbol]) {
						const nQty = ordersObjZmw[symbol].qty + trade.qty;

						ordersObjZmw[symbol].qty = nQty;
						ordersObjZmw[symbol].total = nQty * trade.price;
					} else {
						ordersObjZmw[symbol] = {
							price: trade.price,
							qty: trade.qty,
							symbol: trade.symbol,
							total: trade.price * trade.qty,
							side: toTitleCase(trade.order_side),
							date: prettyDate(trade.date),
						};
					}
				}
			});
		}

		const ordersZmw = chunkArray<SimpleOrder>(Object.values(ordersObjZmw));
		const ordersUsd = chunkArray<SimpleOrder>(Object.values(ordersObjUsd));

		const orderDates = ordersRaw.map((trade) => {
			return { label: prettyDate(trade.date), value: trade.date };
		});

		return { zmwTotal, usdTotal, ordersZmw, ordersUsd, ordersRaw, orderDates };
	});

	const columnsScreen: ColumnDef<OnScreenOrder>[] = [
		{
			accessorKey: "date",
			header: "Date Entered",
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
			accessorKey: "expiry",
			header: "Expires",
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
		{
			id: "screen-action",
			cell: ({ row }) =>
				renderComponent(ScreenAction, {
					data: row.original,
					openSheet: openSheetScreen,
				}),
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

	let summaryScreen = $derived.by(() => {
		let totalBuy: number = 0;
		let totalBuyUSD: number = 0;
		let totalSell: number = 0;
		let totalSellUSD: number = 0;
		let totalTrades: number = 0;

		let mostOrderedObj: { [key: string]: { symbol: string; value: number } } = {};

		const clientsBlist: number[] = [];

		filteredScreen.forEach((trade) => {
			const consideration = trade.price * trade.qty;

			totalTrades++;

			if (!clientsBlist.includes(trade.luse_id)) {
				clientsBlist.push(trade.luse_id);
			}

			if (trade.symbol.includes("USD")) {
				if (trade.order_side === "buy") totalBuyUSD += consideration;
				if (trade.order_side === "sell") totalSellUSD += consideration;
			} else {
				if (trade.order_side === "buy") totalBuy += consideration;
				if (trade.order_side === "sell") totalSell += consideration;
			}

			if (mostOrderedObj[trade.symbol]) {
				const val = trade.price * trade.qty;

				mostOrderedObj[trade.symbol].value = mostOrderedObj[trade.symbol].value + val;
			} else {
				mostOrderedObj[trade.symbol] = { symbol: trade.symbol, value: trade.price * trade.qty };
			}
		});

		const mostOrderedArr = Object.values(mostOrderedObj);
		mostOrderedArr.sort((a, b) => b.value - a.value);

		const mostTraded = mostOrderedArr.length ? mostOrderedArr[0].symbol : "ERROR";

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
				<div class="sum-tainer flex items-center justify-between">
					<p class="text-sm opacity-70">
						<strong>Buy (K):</strong>
						<span class="num">{numParse(summaryMatched.totalBuy.toFixed(2))}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Sell (K):</strong>
						<span class="num">{numParse(summaryMatched.totalSell.toFixed(2))}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Buy ($):</strong>
						<span class="num">{numParse(summaryMatched.totalBuyUSD.toFixed(2))}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Sell ($):</strong>
						<span class="num">{numParse(summaryMatched.totalSellUSD.toFixed(2))}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Clients:</strong>
						<span class="num">{numParse(summaryMatched.totalClients)}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Trades:</strong>
						<span class="num">{numParse(summaryMatched.totalTrades)}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Popular:</strong>
						{mrMateSymbols(summaryMatched.mostTraded)}
					</p>
				</div>

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

		<AnySheet
			openTrigger={openTriggerMatched}
			width={undefined}
			big={true}
			title={sheetTitleMatched}
			description=""
		>
			{#snippet main()}
				<div class="holder">
					<section id="trade-report" class="page-holder">
						<section class="page">
							<table class="top">
								<tbody>
									<tr>
										<td><img src={logos.sbz} alt="sbz logo" /></td>
										<td>
											<p class="title">Trade Report</p>
											<p class="exchange">
												{reportSummaryMatched.initDate
													? prettyDate(reportSummaryMatched.initDate) + " - "
													: ""}{prettyDate(reportSummaryMatched.finDate)}
											</p>
											<p class="date">
												{activeRowMatched.luse_id}LI - {toTitleCase(activeRowMatched.names)}
											</p>
										</td>
									</tr>
								</tbody>
							</table>

							<p style="margin-top: 10px; margin-bottom: 20px;">
								Please take a look at your matched trades over the above stated period in the table
								below.
							</p>

							{#if reportSummaryMatched.tradesZmw.length}
								<table class="trade-summary">
									<thead>
										<tr>
											{#if expandDate}
												<th colspan="6">ZMW Trades</th>
											{:else}
												<th colspan="5">ZMW Trades</th>
											{/if}
										</tr>
										<tr>
											{#if expandDate}
												<th style="text-align: left;">Date</th>
												<th>Side</th>
											{:else}
												<th style="text-align: left;">Side</th>
											{/if}
											<th>Symbol</th>
											<th>Price</th>
											<th>Quantity</th>
											<th style="text-align: right;">Total</th>
										</tr>
									</thead>
									<tbody>
										{#each reportSummaryMatched.tradesZmw[0] as trade}
											<tr>
												{#if expandDate}
													<td style="text-align: left;">{trade.date}</td>
													<td style="text-align: center;">{trade.side}</td>
												{:else}
													<td style="text-align: left;">{trade.side}</td>
												{/if}
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
										{/each}

										<tr class="trades-total">
											<td colspan={expandDate ? 6 : 5} style="text-align: right;"
												><strong
													>Total: <span class="num"
														>{numParse(reportSummaryMatched.zmwTotal.toFixed(2))}</span
													></strong
												></td
											>
										</tr>
									</tbody>
								</table>
							{/if}

							{#if reportSummaryMatched.tradesUsd.length}
								<table class="trade-summary" style="margin-top: 20px;">
									<thead>
										<tr>
											{#if expandDate}
												<th colspan="6">USD Trades</th>
											{:else}
												<th colspan="5">USD Trades</th>
											{/if}
										</tr>
										<tr>
											{#if expandDate}
												<th style="text-align: left;">Date</th>
												<th>Side</th>
											{:else}
												<th style="text-align: left;">Side</th>
											{/if}
											<th>Symbol</th>
											<th>Price</th>
											<th>Quantity</th>
											<th style="text-align: right;">Total</th>
										</tr>
									</thead>
									<tbody>
										{#each reportSummaryMatched.tradesUsd[0] as trade}
											<tr>
												{#if expandDate}
													<td style="text-align: left;">{trade.date}</td>
													<td style="text-align: center;">{trade.side}</td>
												{:else}
													<td style="text-align: left;">{trade.side}</td>
												{/if}
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
										{/each}
										<tr class="trades-total">
											<td colspan={expandDate ? 6 : 5} style="text-align: right;"
												><strong
													>Total: <span class="num"
														>{numParse(reportSummaryMatched.usdTotal.toFixed(2))}</span
													></strong
												></td
											>
										</tr>
									</tbody>
								</table>
							{/if}

							<p
								class="pnum"
								style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"
							>
								<span>Prepared by {toTitleCase(data.admin)}</span>
								<span>1</span>
							</p>
						</section>

						{#each reportSummaryMatched.tradesZmw.slice(1) as trade, i}
							<section class="page ui-sp">
								<table class="trade-summary">
									<thead>
										<tr>
											{#if expandDate}
												<th colspan="6">ZMW Trades</th>
											{:else}
												<th colspan="5">ZMW Trades</th>
											{/if}
										</tr>
										<tr>
											{#if expandDate}
												<th style="text-align: left;">Date</th>
												<th>Side</th>
											{:else}
												<th style="text-align: left;">Side</th>
											{/if}
											<th>Symbol</th>
											<th>Price</th>
											<th>Quantity</th>
											<th style="text-align: right;">Total</th>
										</tr>
									</thead>
									<tbody>
										{#each trade as row}
											<tr>
												{#if expandDate}
													<td style="text-align: left;">{row.date}</td>
													<td style="text-align: center;">{row.side}</td>
												{:else}
													<td style="text-align: left;">{row.side}</td>
												{/if}
												<td style="text-align: center;">{row.symbol}</td>
												<td style="text-align: center;"
													><span class="num">{numParse(row.price.toFixed(2))}</span></td
												>
												<td style="text-align: center;"
													><span class="num">{numParse(row.qty)}</span></td
												>
												<td style="text-align: right;"
													><span class="num">{numParse(row.total.toFixed(2))}</span></td
												>
											</tr>
										{/each}

										<tr class="trades-total">
											<td colspan={expandDate ? 6 : 5} style="text-align: right;"
												><strong
													>Total: <span class="num"
														>{numParse(reportSummaryMatched.zmwTotal.toFixed(2))}</span
													></strong
												></td
											>
										</tr>
									</tbody>
								</table>

								<p
									class="pnum"
									style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"
								>
									<span>Prepared by {toTitleCase(data.admin)}</span>
									<span>{i + 2}</span>
								</p>
							</section>
						{/each}
					</section>

					<div class="controls">
						<Button class="mb-5" onclick={() => (expandDate = !expandDate)}>
							{#if expandDate}
								Simplify<Shrink class="ml-2 h-4 w-4" />
							{:else}
								Expand<Expand class="ml-2 h-4 w-4" />
							{/if}
						</Button>

						<div class="tp flex flex-row gap-1.5">
							<Label>From</Label>
							<AnyPickerDate
								data={reportSummaryMatched.tradeDates}
								handler={updateMatchedDateI}
								value={matchedDateI}
								pickerTitle="From Date"
							/>
						</div>

						<div class="tp mt-5 flex flex-row gap-1.5">
							<Label>To</Label>
							<AnyPickerDate
								data={reportSummaryMatched.tradeDates}
								handler={updateMatchedDateF}
								value={matchedDateF}
								pickerTitle="To Date"
								end
							/>
						</div>

						<Button class="mt-5" {disabled} onclick={() => genPdf("trade-report")}
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
							<strong>Orders:</strong>
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
				<div class="sum-tainer flex items-center justify-between">
					<p class="text-sm opacity-70">
						<strong>Buy (K):</strong>
						<span class="num">{numParse(summaryScreen.totalBuy.toFixed(2))}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Sell (K):</strong>
						<span class="num">{numParse(summaryScreen.totalSell.toFixed(2))}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Buy ($):</strong>
						<span class="num">{numParse(summaryScreen.totalBuyUSD.toFixed(2))}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Sell ($):</strong>
						<span class="num">{numParse(summaryScreen.totalSellUSD.toFixed(2))}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Clients:</strong>
						<span class="num">{numParse(summaryScreen.totalClients)}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Orders:</strong>
						<span class="num">{numParse(summaryScreen.totalTrades)}</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="text-sm opacity-70">
						<strong>Popular:</strong>
						{mrMateSymbols(summaryScreen.mostTraded)}
					</p>
				</div>

				<div class="flex flex-row items-center justify-end">
					<Button
						variant="outline"
						size="sm"
						onclick={() => tableScreen.previousPage()}
						disabled={!tableScreen.getCanPreviousPage()}
						><ChevronLeft class="mr-2 h-4 w-4" />Previous</Button
					>
					<Button class="mx-2" variant="outline" size="sm" disabled={true}
						>{paginationScreen.pageIndex + 1}</Button
					>
					<Button
						variant="outline"
						size="sm"
						onclick={() => tableScreen.nextPage()}
						disabled={!tableScreen.getCanNextPage()}
						>Next<ChevronRight class="ml-2 h-4 w-4" /></Button
					>
				</div>
			</div>
		</div>

		<AnySheet
			openTrigger={openTriggerScreen}
			width={undefined}
			big={true}
			title={sheetTitleScreen}
			description=""
		>
			{#snippet main()}
				<div class="holder">
					<section id="order-report" class="page-holder">
						<section class="page">
							<table class="top">
								<tbody>
									<tr>
										<td><img src={logos.sbz} alt="sbz logo" /></td>
										<td>
											<p class="title">On-Screen Order Report</p>
											<p class="exchange">
												{prettyDate(activeRowScreen.date)}
											</p>
											<p class="date">
												{activeRowScreen.luse_id}LI - {toTitleCase(activeRowScreen.names)}
											</p>
										</td>
									</tr>
								</tbody>
							</table>

							<p style="margin-top: 10px; margin-bottom: 20px;">
								Please take a look at your on-screen orders over the above date in the table below.
							</p>

							{#if reportSummaryScreen.ordersZmw.length}
								<table class="trade-summary">
									<thead>
										<tr>
											<th colspan="5">ZMW Orders</th>
										</tr>
										<tr>
											<th style="text-align: left;">Side</th>
											<th>Symbol</th>
											<th>Price</th>
											<th>Quantity</th>
											<th style="text-align: right;">Total</th>
										</tr>
									</thead>
									<tbody>
										{#each reportSummaryScreen.ordersZmw[0] as trade}
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
										{/each}

										<tr class="trades-total">
											<td colspan="5" style="text-align: right;"
												><strong
													>Total: <span class="num"
														>{numParse(reportSummaryScreen.zmwTotal.toFixed(2))}</span
													></strong
												></td
											>
										</tr>
									</tbody>
								</table>
							{/if}

							{#if reportSummaryScreen.ordersUsd.length}
								<table class="trade-summary" style="margin-top: 20px;">
									<thead>
										<tr>
											<th colspan="5">USD Trades</th>
										</tr>
										<tr>
											<th style="text-align: left;">Side</th>

											<th>Symbol</th>
											<th>Price</th>
											<th>Quantity</th>
											<th style="text-align: right;">Total</th>
										</tr>
									</thead>
									<tbody>
										{#each reportSummaryScreen.ordersUsd[0] as trade}
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
										{/each}
										<tr class="trades-total">
											<td colspan="5" style="text-align: right;"
												><strong
													>Total: <span class="num"
														>{numParse(reportSummaryScreen.usdTotal.toFixed(2))}</span
													></strong
												></td
											>
										</tr>
									</tbody>
								</table>
							{/if}

							<p
								class="pnum"
								style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"
							>
								<span>Prepared by {toTitleCase(data.admin)}</span>
								<span>1</span>
							</p>
						</section>

						{#each reportSummaryScreen.ordersZmw.slice(1) as trade, i}
							<section class="page ui-sp">
								<table class="trade-summary">
									<thead>
										<tr>
											<th colspan="5">ZMW Orders</th>
										</tr>
										<tr>
											<th style="text-align: left;">Side</th>

											<th>Symbol</th>
											<th>Price</th>
											<th>Quantity</th>
											<th style="text-align: right;">Total</th>
										</tr>
									</thead>
									<tbody>
										{#each trade as row}
											<tr>
												<td style="text-align: left;">{row.side}</td>

												<td style="text-align: center;">{row.symbol}</td>
												<td style="text-align: center;"
													><span class="num">{numParse(row.price.toFixed(2))}</span></td
												>
												<td style="text-align: center;"
													><span class="num">{numParse(row.qty)}</span></td
												>
												<td style="text-align: right;"
													><span class="num">{numParse(row.total.toFixed(2))}</span></td
												>
											</tr>
										{/each}

										<tr class="trades-total">
											<td colspan="5" style="text-align: right;"
												><strong
													>Total: <span class="num"
														>{numParse(reportSummaryScreen.zmwTotal.toFixed(2))}</span
													></strong
												></td
											>
										</tr>
									</tbody>
								</table>

								<p
									class="pnum"
									style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"
								>
									<span>Prepared by {toTitleCase(data.admin)}</span>
									<span>{i + 2}</span>
								</p>
							</section>
						{/each}
					</section>

					<div class="controls">
						<!--
						<AnyPickerDate
							data={reportSummaryScreen.orderDates}
							handler={updateScreenDateF}
							value={screenDateF}
							pickerTitle="Date"
							end
						/>
						-->

						<Button class="mt-5" {disabled} onclick={() => genPdf("order-report")}
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

	/**Exclude */
	.page.ui-sp {
		margin-top: 20px;
	}
</style>
