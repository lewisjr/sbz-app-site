<script lang="ts">
	//functions
	import { tick } from "svelte";
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { numParse } from "@cerebrusinc/qol";
	import {
		prettyDate,
		logos,
		contactDetails,
		genDate,
		mrMateSymbols,
		chunkArray,
		percentageHandler,
	} from "$lib/utils";
	import { createRawSnippet, onMount } from "svelte";
	import { renderSnippet, renderComponent } from "$lib/components/ui/data-table/index";
	import { toTitleCase } from "@cerebrusinc/fstring";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";
	import AnyPicker from "$lib/components/AnyPicker.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";
	import Actions from "./Actions.svelte";
	import PortfolioComposition from "./PortfolioComposition.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Table from "$lib/components/ui/table/index";

	//stores
	import { screenWidthStore, filesCacheStore } from "$lib/stores";

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
	import type { SBZdb, NFHelp, Types, GetPortfolioData, GenericResponseWData } from "$lib/types";
	import type { ColumnDef, PaginationState } from "@tanstack/table-core";

	type TempClient = SBZdb["public"]["Tables"]["clients"]["Row"];
	type GetPortfolioAPIResponse = GenericResponseWData<GetPortfolioData | undefined>;

	let { data }: PageProps = $props();

	let clientsData = $state<TempClient[]>([]);
	let initialising = $state<boolean>(true);
	let date = $state<number>(genDate());

	$effect(() => {
		data.clients
			.then((res) => {
				clientsData = res;
				initialising = false;
			})
			.catch(() => {
				toast.error("Failed to get clients! Please refresh the browser in a few minutes.");
				initialising = false;
			});
	});

	let isMobile = $derived($screenWidthStore < 767);
	let disabled = $state<boolean>(false);

	const initRow: TempClient = {
		acc_type: "individual",
		bank_acc_name: "",
		bank_acc_num: "",
		bank_name: "",
		branch_code: "",
		branch_name: "",
		broker_comission: 0,
		city: "",
		comp_directors: [],
		comp_managers: [],
		country: "",
		created_at: "",
		cv_num: "",
		dob: "",
		email: "",
		fname: "",
		gender: "",
		id_num: "",
		id_type: "",
		is_approved: false,
		is_in_trust_of: false,
		joint_partners: [],
		lname: "",
		luseId: -1,
		manag_city: "",
		manag_country: "",
		manag_dob: "",
		manag_email: "",
		manag_fname: "",
		manag_gender: "",
		manag_id_num: "",
		manag_id_type: "",
		manag_lname: "",
		manag_mstatus: "",
		manag_nationality: "",
		manag_phone: -1,
		manag_street: "",
		mstatus: "",
		nationality: "",
		phone: -1,
		referral_src: "",
		signatures: {},
		signing_arrangement: 0,
		street: "",
		swift_code: "",
		approve_date: "",
		approved_by: "",
	};

	let activeRow = $state<TempClient>(initRow);
	let config = $state<"portfolio" | "file">("file");

	type PDO = "port" | "matched" | "screen";
	let portfolioDisplayOption = $state<PDO>("port");
	const updatePortfolioDisplayOption = (val: PDO) => (portfolioDisplayOption = val);

	let openTrigger = $state<number>(0);
	let sheetTitle = $state<string>("");

	interface Portfolio {
		symbol: string;
		price: number;
		volume: number;
		value: number;
	}

	interface AnalysisObj {
		symbol: string;
		value: number;
	}

	interface Analysis {
		best: AnalysisObj;
		worst: AnalysisObj;
		heaviest: AnalysisObj;
		lightest: AnalysisObj;
		totalGrowthZmw: number;
		totalInvestmentZmw: number;
		totalGrowthUsd: number;
		totalInvestmentUsd: number;
		chart: {
			symbols: string[];
			turnovers: number[];
			pfolio: Types["Folio"][];
		};
	}

	interface Matched {
		zmwTotal: number;
		zmwTotalBuy: number;
		zmwTotalSell: number;
		usdTotal: number;
		usdTotalBuy: number;
		usdTotalSell: number;
		tradesZmw: NFHelp["SimpleTrade"][][];
		tradesUsd: NFHelp["SimpleTrade"][][];
		initDate: number;
		finDate: number;
		tradesRaw: NFHelp["MatchedTrade"][];
		tradeDates: Types["AnyPickerObj"][];
	}

	interface Screen {
		zmwTotal: number;
		zmwTotalBuy: number;
		zmwTotalSell: number;
		usdTotal: number;
		usdTotalBuy: number;
		usdTotalSell: number;
		ordersZmw: NFHelp["SimpleOrder"][][];
		ordersUsd: NFHelp["SimpleOrder"][][];
		ordersRaw: NFHelp["OnScreenOrder"][];
		orderDates: Types["AnyPickerObj"][];
	}

	interface ClientTradeHistory {
		portfolioZmw: Portfolio[][];
		portfolioUsd: Portfolio[][];
		portfolioTotalZmw: number;
		portfolioTotalUsd: number;
		usdBuy: number;
		usdSell: number;
		analysis: Analysis;
		matched: Matched | undefined;
		screen: Screen | undefined;
	}

	let clientPortfolio = $state<ClientTradeHistory | undefined>(undefined);

	let expandDate = $state<boolean>(true);

	let dateImatched = $state<number>(0);
	const updateDateImatched = (val: number) => (dateImatched = val);

	let dateFmatched = $state<number>(0);
	const updateDateFmatched = (val: number) => (dateFmatched = val);

	let dateScreen = $state<number>(0);
	const updateDateScreen = (val: number) => (dateScreen = val);

	const genPortfolio = (rawData: GetPortfolioData): ClientTradeHistory => {
		const _genMatched = (matchedData: GetPortfolioData["matched"]) => {
			if (!matchedData.length) return undefined;

			const { luseId } = activeRow;

			let tradesRaw = matchedData.filter((item) => item.luse_id === luseId);

			if (dateImatched && dateFmatched)
				tradesRaw = tradesRaw.filter(
					(item) => item.trade_date >= dateImatched && item.trade_date <= dateFmatched,
				);

			let zmwTotal: number = 0;
			let zmwTotalBuy: number = 0;
			let zmwTotalSell: number = 0;

			let usdTotal: number = 0;
			let usdTotalBuy: number = 0;
			let usdTotalSell: number = 0;

			const tradesObjZmw: {
				[key: string]: NFHelp["SimpleTrade"];
			} = {};
			const tradesObjUsd: {
				[key: string]: NFHelp["SimpleTrade"];
			} = {};

			if (tradesRaw.length) {
				tradesRaw.forEach((trade) => {
					let symbol = mrMateSymbols(trade.symbol) + trade.price.toString();

					if (expandDate) {
						symbol = symbol + trade.trade_date;
					}

					if (trade.symbol.includes("USD")) {
						const usdConsidertaion = trade.price * trade.qty;
						usdTotal = usdTotal + usdConsidertaion;

						switch (trade.trade_side) {
							case "buy":
								usdTotalBuy += usdConsidertaion;
								break;
							case "sell":
								usdTotalSell += usdConsidertaion;
								break;
						}

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
						const zmwConsideration = trade.price * trade.qty;
						zmwTotal = zmwTotal + zmwConsideration;

						switch (trade.trade_side) {
							case "buy":
								zmwTotalBuy += zmwConsideration;
								break;
							case "sell":
								zmwTotalSell += zmwConsideration;
								break;
						}

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

			let initDate = dateImatched;
			const finDate = dateFmatched;

			if (initDate === finDate) {
				initDate = 0;
			}

			const tradesZmw = chunkArray<NFHelp["SimpleTrade"]>(
				Object.values(tradesObjZmw).sort((a, b) => a.symbol.localeCompare(b.symbol)),
			);
			const tradesUsd = chunkArray<NFHelp["SimpleTrade"]>(
				Object.values(tradesObjUsd).sort((a, b) => a.symbol.localeCompare(b.symbol)),
			);

			const tradeDates = tradesRaw.map((trade) => {
				return { label: prettyDate(trade.trade_date), value: trade.trade_date };
			});

			return {
				zmwTotal,
				usdTotal,
				tradesZmw,
				tradesUsd,
				initDate,
				finDate,
				tradesRaw,
				tradeDates,
				zmwTotalBuy,
				zmwTotalSell,
				usdTotalBuy,
				usdTotalSell,
			};
		};

		const _genScreen = (screenData: GetPortfolioData["onScreen"]) => {
			if (!screenData.length) return undefined;

			const { luseId } = activeRow;

			const ordersRaw = screenData.filter((item) => item.luse_id === luseId);

			let currDate: number = ordersRaw[0].date;

			if (dateScreen) currDate = dateScreen;
			if (!dateScreen) updateDateScreen(currDate);

			const ordersRawDated = ordersRaw.filter((item) => item.date === currDate);

			let zmwTotal: number = 0;
			let zmwTotalBuy: number = 0;
			let zmwTotalSell: number = 0;

			let usdTotal: number = 0;
			let usdTotalBuy: number = 0;
			let usdTotalSell: number = 0;

			const ordersObjZmw: {
				[key: string]: NFHelp["SimpleOrder"];
			} = {};
			const ordersObjUsd: {
				[key: string]: NFHelp["SimpleOrder"];
			} = {};

			if (ordersRawDated.length) {
				ordersRawDated.forEach((trade) => {
					let symbol = mrMateSymbols(trade.symbol) + trade.price.toString();

					if (trade.symbol.includes("USD")) {
						const usdConsidertaion = trade.price * trade.qty;
						usdTotal = usdTotal + usdConsidertaion;

						switch (trade.order_side) {
							case "buy":
								usdTotalBuy += usdConsidertaion;
								break;
							case "sell":
								usdTotalSell += usdConsidertaion;
								break;
						}

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
						const zmwConsideration = trade.price * trade.qty;
						zmwTotal = zmwTotal + zmwConsideration;

						switch (trade.order_side) {
							case "buy":
								zmwTotalBuy += zmwConsideration;
								break;
							case "sell":
								zmwTotalSell += zmwConsideration;
								break;
						}

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

			const ordersZmw = chunkArray<NFHelp["SimpleOrder"]>(
				Object.values(ordersObjZmw).sort((a, b) => a.symbol.localeCompare(b.symbol)),
			);
			const ordersUsd = chunkArray<NFHelp["SimpleOrder"]>(
				Object.values(ordersObjUsd).sort((a, b) => a.symbol.localeCompare(b.symbol)),
			);

			const orderDates = ordersRaw.map((trade) => {
				return { label: prettyDate(trade.date), value: trade.date };
			});

			return {
				zmwTotal,
				usdTotal,
				ordersZmw,
				ordersUsd,
				ordersRaw,
				orderDates,
				zmwTotalBuy,
				zmwTotalSell,
				usdTotalBuy,
				usdTotalSell,
			};
		};

		const matched = _genMatched(rawData.matched);
		const screen = _genScreen(rawData.onScreen);

		let zmwTotal: number = 0;
		let usdTotal: number = 0;

		const portfolioCodexZmw: { [key: string]: Portfolio } = {};
		const portfolioCodexUsd: { [key: string]: Portfolio } = {};

		// invSum is the initial invested amount; It's a sum because we sum the values at their prices based on settlement
		const analysisCodex: {
			[key: string]: {
				symbol: string;
				invSum: number;
				currentVal: number;
				weight: number;
				growth: number;
			};
		} = {};

		const usdBuy = rawData.fxUsd.buy;
		const usdSell = rawData.fxUsd.sell;

		const currentPricesCodex: { [key: string]: number } = {};

		rawData.dmr.forEach((stock) => {
			currentPricesCodex[stock.symbol] = stock.market_price;
		});

		let totalInvestmentZmw: number = 0;
		let totalInvestmentUsd: number = 0;

		rawData.settled.forEach((row) => {
			const { symbol, qty, side } = row;
			const currentPrice = currentPricesCodex[symbol] ? currentPricesCodex[symbol] : 0;
			const computedValue = qty * currentPrice;

			// only work with listed symbols; One that is not listed will not have a price
			if (currentPrice) {
				// analysis first
				if (!analysisCodex[symbol]) {
					analysisCodex[symbol] = { currentVal: 0, invSum: 0, symbol, weight: 0, growth: 0 };
				}

				if (side === "buy") {
					analysisCodex[symbol].invSum += row.value;
					analysisCodex[symbol].currentVal += computedValue;
				} else {
					analysisCodex[symbol].invSum -= row.value;
					analysisCodex[symbol].currentVal -= computedValue;
				}

				// portfolio
				if (!symbol.includes("USD")) {
					if (!portfolioCodexZmw[symbol]) {
						portfolioCodexZmw[symbol] = { price: currentPrice, symbol, value: 0, volume: 0 };
					}

					if (side === "buy") {
						zmwTotal += computedValue;
						portfolioCodexZmw[symbol].value += computedValue;
						portfolioCodexZmw[symbol].volume += qty;
					} else {
						zmwTotal -= computedValue;
						portfolioCodexZmw[symbol].value -= computedValue;
						portfolioCodexZmw[symbol].volume -= qty;
					}
				}

				if (symbol.includes("USD")) {
					if (!portfolioCodexUsd[symbol]) {
						portfolioCodexUsd[symbol] = { price: currentPrice, symbol, value: 0, volume: 0 };
					}

					if (side === "buy") {
						usdTotal += computedValue;
						portfolioCodexUsd[symbol].value += computedValue;
						portfolioCodexUsd[symbol].volume += qty;
					} else {
						usdTotal -= computedValue;
						portfolioCodexUsd[symbol].value -= computedValue;
						portfolioCodexUsd[symbol].volume -= qty;
					}
				}
			}
		});

		// filter by item.value (e.g !== 0) to remove stocks that have been sold off
		const portfolioZmw: Portfolio[][] = chunkArray<Portfolio>(
			Object.values(portfolioCodexZmw)
				.filter((item) => item.value && item.volume)
				.sort((a, b) => a.symbol.localeCompare(b.symbol)),
			18,
		);
		const portfolioUsd: Portfolio[][] = chunkArray<Portfolio>(
			Object.values(portfolioCodexUsd)
				.filter((item) => item.value)
				.sort((a, b) => a.symbol.localeCompare(b.symbol)),
			18,
		);

		const grandTotal = usdTotal * usdBuy + zmwTotal;

		Object.values(analysisCodex).forEach((row) => {
			const { symbol, currentVal, invSum } = row;

			// modifier to change value to ZMW if the stock is usd denominated
			let k = 1;

			if (symbol.includes("USD")) k = usdBuy;

			const sanitisedCurrentValue = currentVal * k;
			const weight = sanitisedCurrentValue / grandTotal;

			const sanitisedInvestmentValue = invSum * k;
			const growth = (sanitisedCurrentValue - sanitisedInvestmentValue) / sanitisedInvestmentValue;

			if (symbol.includes("USD")) totalInvestmentUsd += invSum;
			else totalInvestmentZmw += invSum;

			analysisCodex[symbol].weight = weight;
			analysisCodex[symbol].growth = growth;
		});

		const analyticsArr = Object.values(analysisCodex);

		const initBest = {
			symbol: "",
			invSum: 0,
			currentVal: 0,
			weight: 0,
			growth: 0,
		};

		const initHeaviest = {
			symbol: "",
			invSum: 0,
			currentVal: 0,
			weight: 0,
			growth: 0,
		};

		const best = analyticsArr.sort((a, b) => b.growth - a.growth)[0] ?? initBest;
		const worst = analyticsArr.sort((a, b) => a.growth - b.growth)[0] ?? initBest;
		const heaviest = analyticsArr.sort((a, b) => b.weight - a.weight)[0] ?? initHeaviest;
		const lightest = analyticsArr.sort((a, b) => a.weight - b.weight)[0] ?? initHeaviest;

		const chartArr = [
			...Object.values(portfolioCodexZmw).filter((item) => item.value && item.volume),
			...Object.values(portfolioCodexUsd).filter((item) => item.value),
		];

		chartArr.sort((a, b) => b.value - a.value);

		const pfolio: Types["Folio"][] = [];
		const symbols: string[] = [];
		const turnovers: number[] = [];

		chartArr.forEach((stock) => {
			const { symbol, volume, value } = stock;

			let k = 1;

			if (symbol.includes("USD")) k = usdBuy;

			const sanitisedValue = value * k;

			pfolio.push({ symbol, volume, value: sanitisedValue });
		});

		pfolio.sort((a, b) => b.value - a.value);

		pfolio.forEach((row) => {
			const { symbol, value } = row;

			symbols.push(symbol);
			turnovers.push(value);
		});

		const analysis: Analysis = {
			best: { symbol: best.symbol, value: best.growth },
			worst: { symbol: worst.symbol, value: worst.growth },
			heaviest: { symbol: heaviest.symbol, value: heaviest.weight },
			lightest: { symbol: lightest.symbol, value: lightest.weight },
			totalInvestmentZmw,
			totalInvestmentUsd,
			totalGrowthZmw: (zmwTotal - totalInvestmentZmw) / totalInvestmentZmw,
			totalGrowthUsd: (usdTotal - totalInvestmentUsd) / totalInvestmentUsd,
			chart: {
				pfolio,
				symbols,
				turnovers,
			},
		};

		return {
			matched,
			screen,
			portfolioTotalZmw: zmwTotal,
			portfolioTotalUsd: usdTotal,
			portfolioZmw,
			portfolioUsd,
			analysis,
			usdBuy,
			usdSell,
		};
	};

	let portfolioLoading = $state<boolean>(false);

	const getPortfolio = async () => {
		try {
			const req = await fetch("/api/admin/clients", {
				method: "POST",
				body: JSON.stringify({ uid: activeRow.luseId.toString(), config }),
			});

			const res: GetPortfolioAPIResponse = await req.json();

			if (res.data) {
				clientPortfolio = genPortfolio(res.data);
			} else {
				toast.error(res.message);
			}

			portfolioLoading = false;
		} catch (ex) {
			toast.error("No portdolio found.");
			console.error(ex);
			portfolioLoading = false;
		}
	};

	const idSanitiser = (idNum: string): string => {
		return idNum.replace(/[^a-zA-Z0-9]/g, "");
	};

	let filesLoading = $state<boolean>(false);

	const getFile = async () => {
		toast.info("Getting files...");

		const uid = idSanitiser(activeRow.id_num);

		try {
			const req = await fetch("/api/admin/clients", {
				method: "POST",
				body: JSON.stringify({ uid, config }),
			});

			const res: GenericResponseWData<Types["ClientKyc"][]> = await req.json();

			if (res.success) {
				const temp = JSON.parse(JSON.stringify($filesCacheStore));
				temp[uid] = res.data;

				// console.log({ res: res.data });

				filesCacheStore.set(temp);

				await tick();
			} else {
				toast.error(res.message);
			}

			filesLoading = false;
		} catch (ex) {
			toast.error(String(ex));

			filesLoading = false;
		}
	};

	const openSheet = (cfg: "portfolio" | "file", row: TempClient) => {
		clientPortfolio = undefined;
		portfolioLoading = true;

		filesLoading = true;

		config = cfg;

		switch (cfg) {
			case "portfolio":
				sheetTitle = `${toTitleCase(row.fname)}'s Portfolio`;
				activeRow = row;
				getPortfolio();
				break;
			case "file":
				sheetTitle = `${toTitleCase(row.fname)}'s File`;
				activeRow = row;

				if (!Object.keys($filesCacheStore).includes(idSanitiser(row.id_num))) {
					getFile();
				}

				break;
			default:
				return;
		}

		openTrigger = Date.now();
	};

	const columns: ColumnDef<TempClient>[] = [
		{
			accessorKey: "luseId",
			header: "LuSE ID",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as number;
					return {
						render: () => `<span class="num">${value}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "cv_num",
			header: "CV",
			cell: ({ row }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					let value: string = "";

					value = row.original.cv_num.toString();

					return {
						render: () =>
							!value.length || value === "-1"
								? "-"
								: `<span class="whitespace-nowrap num">${value}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			id: "names",
			header: "Names",
			cell: ({ row }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const { fname, lname } = row.original;
					const value = `${fname} ${lname}`;
					return {
						render: () => `<span class="whitespace-nowrap">${toTitleCase(value)}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "id_num",
			header: "ID",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () =>
							!value.length ? "-" : `<span class="whitespace-nowrap num">${value}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "nationality",
			header: "Nationality",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => (!value.length ? "-" : `<span class="whitespace-nowrap">${value}</span>`),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "phone",
			header: "Phone",
			cell: ({ row }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					let value: string = "";

					value = row.original.phone.toString();

					return {
						render: () =>
							!value.length || value === "-1"
								? "-"
								: `<span class="whitespace-nowrap num">${value}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "email",
			header: "Email",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => (!value.length ? "-" : `<span class="whitespace-nowrap">${value}</span>`),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			id: "client-action",
			cell: ({ row }) =>
				renderComponent(Actions, {
					data: row.original,
					openSheet: openSheet,
				}),
		},
	];

	let filterValue = $state<string>("");

	// ! could be a search error here
	let filtered = $derived.by(() => {
		return clientsData.filter((entry) => {
			let res: boolean = false;

			const _sanitize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
			const _compare = (value: string) => _sanitize(value).includes(_sanitize(filterValue));

			if (_compare(entry.luseId.toString())) res = true;
			if (_compare(entry.cv_num.toString())) res = true;
			if (_compare(entry.fname)) res = true;
			if (_compare(entry.lname)) res = true;
			if (_compare(entry.nationality)) res = true;
			if (_compare(entry.id_num)) res = true;
			if (_compare(entry.phone.toString())) res = true;
			if (_compare(entry.email)) res = true;

			return res;
		});
	});

	let summary = $derived.by(() => {
		let locals: number = 0;
		let foreign: number = 0;
		let individuals: number = 0;
		let companies: number = 0;

		let total: number = 0;

		filtered.forEach((client) => {
			total++;
			switch (client.acc_type) {
				case "individual":
					if (client.nationality === "Zambian") {
						// LI
						locals++;
					} else {
						// FI
						foreign++;
					}
					individuals++;
					break;
				case "joint":
					if (client.nationality === "Zambian") {
						// LI
						locals++;
					} else {
						// FI
						foreign++;
					}
					break;
				case "institution":
					if (client.country === "Zambian") {
						// LC
						locals++;
					} else {
						// FC
						foreign++;
					}
					companies++;
				default:
					break;
			}
		});

		return {
			locals,
			foreign,
			individuals,
			companies,
			total,
		};
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

	let selectedIndex = $state<number>(0);
	const handleSelectedIndex = (val: number) => (selectedIndex = val);

	let iFrameHelper = $derived.by(() => {
		let src: string | undefined = undefined;
		let title: string | undefined = undefined;
		const options: string[] = [];

		if (
			$filesCacheStore[idSanitiser(activeRow.id_num)] &&
			$filesCacheStore[idSanitiser(activeRow.id_num)].length
		) {
			const { url, title: tit } = $filesCacheStore[idSanitiser(activeRow.id_num)][selectedIndex];

			src = url;
			title = tit;

			options.push(...$filesCacheStore[idSanitiser(activeRow.id_num)].map((v) => v.title));
		}

		return { src, title, options };
	});

	const combineNames = (): string => {
		if (activeRow.fname.length) {
			return `${activeRow.fname} ${activeRow.lname}`;
		} else {
			return "Unknown";
		}
	};

	const genPdf = async (id: string) => {
		toast.info(`Generating ${toTitleCase(activeRow.fname)}'s portfolio...`);
		disabled = true;
		const html = document.getElementById(id)?.innerHTML;

		try {
			const response = await fetch("/api/admin/trades/reports", {
				method: "POST",
				body: JSON.stringify({ html }),
			});

			const blob = await response.blob();
			const blobURL = URL.createObjectURL(blob);

			let docTitle = `${toTitleCase(combineNames())}'s Portfolio - ${prettyDate(date)}.pdf`;

			switch (portfolioDisplayOption) {
				case "matched":
					docTitle = `${toTitleCase(combineNames())}'s Trade Report - ${prettyDate(date)}.pdf`;
					break;
				case "screen":
					docTitle = `${toTitleCase(combineNames())}'s On-Ccreen Report - ${prettyDate(date)}.pdf`;
				default:
					break;
			}

			const a = document.createElement("a");
			a.href = blobURL;
			a.download = docTitle; // Optional: set the filename
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			// Clean up
			URL.revokeObjectURL(blobURL);

			disabled = false;

			toast.success("Portfolio downloaded!");

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

	/*
	onMount(() => {
		
		clientPortfolio = {
			matched: {
				zmwTotal: 295494,
				usdTotal: 0,
				tradesZmw: [
					[
						{
							price: 25.5,
							qty: 11588,
							symbol: "CHIL",
							total: 295494,
							side: "Buy",
							date: "28 Nov 2024",
						},
					],
				],
				tradesUsd: [],
				initDate: 0,
				finDate: 0,
				tradesRaw: [
					{
						id: 11928,
						market: "LUSE",
						counterparty_name: "BRIAN MUKUBI MOONGA",
						counterparty_luseId: 457354,
						counterparty_broker: "SBZL",
						created_at: "2024-12-03T14:10:03.260515+00:00",
						trader: "BWA",
						luseId: 88129,
						broker: "SBZL",
						names: "MALOZI FELIX CHINGEZHI",
						symbol: "CHIL",
						settlement_date: 20241203,
						trade_side: "buy",
						qty: 11588,
						price: 25.5,
						trade_time: "13:45:23",
						trade_date: 20241128,
					},
				],
				tradeDates: [
					{
						label: "28 Nov 2024",
						value: 20241128,
					},
				],
			},
			screen: undefined,
			portfolioTotalZmw: 17038910.98,
			portfolioTotalUsd: 3204.54,
			portfolioZmw: [
				[
					{
						price: 120.17,
						symbol: "AECI",
						value: 2735790.22,
						volume: 22766,
					},
					{
						price: 140,
						symbol: "ATEL",
						value: 87640,
						volume: 626,
					},
					{
						price: 6.2,
						symbol: "BATA",
						value: 24800,
						volume: 4000,
					},
					{
						price: 16,
						symbol: "BATZ",
						value: 231920,
						volume: 14495,
					},
					{
						price: 23.87,
						symbol: "CECZ",
						value: 9427528.11,
						volume: 394953,
					},
					{
						price: 38.47,
						symbol: "CHIL",
						value: 445790.36,
						volume: 11588,
					},
					{
						price: 1.8,
						symbol: "MAFS",
						value: 17658,
						volume: 9810,
					},
					{
						price: 3,
						symbol: "NATB",
						value: 12000,
						volume: 4000,
					},
					{
						price: 4.35,
						symbol: "PUMA",
						value: 1097870.4,
						volume: 252384,
					},
					{
						price: 2.6,
						symbol: "SCBL",
						value: 240838,
						volume: 92630,
					},
					{
						price: 6.9,
						symbol: "ZABR",
						value: 234199.80000000002,
						volume: 33942,
					},
					{
						price: 3.44,
						symbol: "ZFCO",
						value: 59512,
						volume: 17300,
					},
					{
						price: 2.3,
						symbol: "ZMBF",
						value: 472620.1,
						volume: 205487,
					},
					{
						price: 66,
						symbol: "ZMFA",
						value: 258522,
						volume: 3917,
					},
					{
						price: 60.01,
						symbol: "ZSUG",
						value: 1692221.99,
						volume: 28199,
					},
				],
			],
			portfolioUsd: [
				[
					{
						price: 0.09,
						symbol: "REIZUSD",
						value: 3204.54,
						volume: 35606,
					},
				],
			],
			analysis: {
				best: {
					symbol: "ATEL",
					value: 139,
				},
				worst: {
					symbol: "REIZUSD",
					value: 0.12500000000000006,
				},
				heaviest: {
					symbol: "CECZ",
					value: 0.5509472571988492,
				},
				lightest: {
					symbol: "NATB",
					value: 0.000701283200563821,
				},
				totalInvestmentZmw: 1096097,
				totalInvestmentUsd: 2848.48,
				totalGrowthZmw: 14.545075828142947,
				totalGrowthUsd: 0.12499999999999999,
				chart: {
					pfolio: [
						{
							symbol: "CECZ",
							volume: 394953,
							value: 9427528.11,
						},
						{
							symbol: "AECI",
							volume: 22766,
							value: 2735790.22,
						},
						{
							symbol: "ZSUG",
							volume: 28199,
							value: 1692221.99,
						},
						{
							symbol: "PUMA",
							volume: 252384,
							value: 1097870.4,
						},
						{
							symbol: "ZMBF",
							volume: 205487,
							value: 472620.1,
						},
						{
							symbol: "CHIL",
							volume: 11588,
							value: 445790.36,
						},
						{
							symbol: "ZMFA",
							volume: 3917,
							value: 258522,
						},
						{
							symbol: "SCBL",
							volume: 92630,
							value: 240838,
						},
						{
							symbol: "ZABR",
							volume: 33942,
							value: 234199.80000000002,
						},
						{
							symbol: "BATZ",
							volume: 14495,
							value: 231920,
						},
						{
							symbol: "ATEL",
							volume: 626,
							value: 87640,
						},
						{
							symbol: "ZFCO",
							volume: 17300,
							value: 59512,
						},
						{
							symbol: "BATA",
							volume: 4000,
							value: 24800,
						},
						{
							symbol: "MAFS",
							volume: 9810,
							value: 17658,
						},
						{
							symbol: "NATB",
							volume: 4000,
							value: 12000,
						},
						{
							symbol: "REIZUSD",
							volume: 35606,
							value: 72578.344644,
						},
					],
					symbols: [
						"CECZ",
						"AECI",
						"ZSUG",
						"PUMA",
						"ZMBF",
						"CHIL",
						"ZMFA",
						"SCBL",
						"ZABR",
						"BATZ",
						"ATEL",
						"ZFCO",
						"BATA",
						"MAFS",
						"NATB",
						"REIZUSD",
					],
					turnovers: [
						9427528.11, 2735790.22, 1692221.99, 1097870.4, 472620.1, 445790.36, 258522, 240838,
						234199.80000000002, 231920, 87640, 59512, 24800, 17658, 12000, 72578.344644,
					],
				},
			},
			usdBuy: 22.6486,
			usdSell: 22.6986,
		};

		openSheet("portfolio", {
			created_at: "",
			email: "test@email.com",
			luseId: 88129,
			names: "Malozi Felix Chingezhi",
			nationality: "Zambian",
			id_num: "554721/10/1",
			phone: "260776552592",
			type: "LI",
		});
		
	});
	*/
</script>

<Head
	title="Clients | SBZ Admin"
	ogTitle="Clients"
	description="Introspect your client base."
	ogDescription="Introspect your client base."
/>

{#if initialising}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Clients</h1>
			<Button variant="secondary" class="loading ml-2" disabled
				>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter clients..." type="text" disabled />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<div class="flex flex-row items-center">
				<h1>Clients</h1>
			</div>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter clients..." type="text" disabled />
			</div>
		</div>

		<div class="main-tainer">
			<div class="table-tainer loading mt-3 flex items-center rounded-md border"></div>

			<div class="mt-2 flex items-center justify-between space-x-4">
				<div class="flex items-center justify-between">
					<p class="loading text-sm opacity-70">
						<strong>Total:</strong> <span class="num">999,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading text-sm opacity-70">
						<strong>Locals:</strong> <span class="num">999,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading text-sm opacity-70">
						<strong>Foreign:</strong>
						<span class="num">999,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading text-sm opacity-70">
						<strong>Individuals:</strong>
						<span class="num">999,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading text-sm opacity-70">
						<strong>Companies:</strong> <span class="num">999</span>
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
{:else if !clientsData.length}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Clients</h1>
			<Button variant="secondary" class="loading ml-2" disabled
				>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter clients..." type="text" disabled />
		</div>
		<h3 class="mx-auto mt-4 text-center">No data.</h3>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<div class="flex flex-row items-center">
				<h1>Clients</h1>
			</div>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter clients..." type="text" disabled />
			</div>
		</div>

		<div class="main-tainer">
			<div class="table-tainer mt-3 flex items-center rounded-md border">
				<h3 class="mx-auto">No data.</h3>
			</div>
		</div>
	{/if}
{:else if isMobile}
	<div class="flex flex-row items-center justify-between">
		<h1>Clients</h1>
		<Button variant="secondary" class="loading ml-2" disabled
			>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
		>
	</div>
	<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
		<Search class="mr-4" />
		<Input class="w-[100%]" placeholder="Filter clients..." type="text" disabled />
	</div>
	<h3 class="mx-auto mt-4 text-center">W.I.P</h3>
{:else}
	<div class="flex flex-row items-center justify-between">
		<div class="flex flex-row items-center">
			<h1>Clients</h1>
		</div>

		<div class="flex w-[50%] items-center">
			<Search class="mr-4 h-10 w-10" />
			<Input
				class="w-[100%]"
				placeholder="Filter clients..."
				type="text"
				bind:value={filterValue}
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
			<div class="flex items-center justify-between">
				<p class=" text-sm opacity-70">
					<strong>Total:</strong> <span class="num">{numParse(summary.total)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class=" text-sm opacity-70">
					<strong>Locals:</strong> <span class="num">{numParse(summary.locals)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class=" text-sm opacity-70">
					<strong>Foreign:</strong>
					<span class="num">{numParse(summary.foreign)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class=" text-sm opacity-70">
					<strong>Individuals:</strong>
					<span class="num">{numParse(summary.individuals)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class=" text-sm opacity-70">
					<strong>Companies:</strong> <span class="num">{numParse(summary.companies)}</span>
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
			{#if config === "portfolio"}
				<div class="holder">
					{#if portfolioLoading}
						<section class="page-holder">
							<section class="page loading"></section>
						</section>
					{:else if !clientPortfolio}
						<p>No data.</p>
					{:else}
						<!-- pages -->
						{#if portfolioDisplayOption === "port"}
							<section id="port" class="page-holder">
								{#if clientPortfolio.analysis.best.symbol !== ""}
									{#each clientPortfolio.portfolioZmw as portfolio, i}
										<section class="page ui-sp">
											{#if !i}
												<table class="top">
													<tbody>
														<tr>
															<td><img src={logos.sbz} alt="sbz logo" /></td>
															<td>
																<p class="title">Portfolio Statement</p>
																<p class="exchange">
																	{prettyDate(date)}
																</p>
																<p class="date">
																	{activeRow.luseId}LI - {toTitleCase(combineNames())}
																</p>
															</td>
														</tr>
													</tbody>
												</table>

												<p style="margin-top: 10px; margin-bottom: 20px;">
													Please take a look at your portfolio and it's analysis for the above
													stated date.
												</p>
											{/if}

											<table class="trade-summary">
												<thead>
													<tr>
														<th colspan="4">ZMW Holdings</th>
													</tr>
													<tr>
														<th style="text-align: left;">Symbol</th>
														<th>Price</th>
														<th>Volume</th>
														<th style="text-align: right;">Total</th>
													</tr>
												</thead>
												<tbody>
													{#each portfolio as row}
														<tr>
															<td style="text-align: left;">{mrMateSymbols(row.symbol)}</td>
															<td style="text-align: center;"
																><span class="num">{numParse(row.price.toFixed(2))}</span></td
															>
															<td style="text-align: center;"
																><span class="num">{numParse(row.volume)}</span></td
															>
															<td style="text-align: right;"
																><span class="num">{numParse(row.value.toFixed(2))}</span></td
															>
														</tr>
													{/each}
													{#if i === clientPortfolio.portfolioZmw.length - 1}
														<tr class="trades-total">
															<td colspan="4" style="text-align: right;"
																><strong
																	>Total: <span class="num"
																		>{numParse(clientPortfolio.portfolioTotalZmw.toFixed(2))}</span
																	></strong
																></td
															>
														</tr>
													{/if}
												</tbody>
											</table>

											{#if i === clientPortfolio.portfolioZmw.length - 1}
												<table class="trade-summary" style="margin-top: 25px;">
													<thead>
														<tr>
															<th colspan="4">USD Holdings</th>
														</tr>
														<tr>
															<th style="text-align: left;">Symbol</th>
															<th>Price</th>
															<th>Volume</th>
															<th style="text-align: right;">Total</th>
														</tr>
													</thead>
													<tbody>
														{#each clientPortfolio.portfolioUsd[0] as row}
															<tr>
																<td style="text-align: left;">{mrMateSymbols(row.symbol)}</td>
																<td style="text-align: center;"
																	><span class="num">{numParse(row.price.toFixed(2))}</span></td
																>
																<td style="text-align: center;"
																	><span class="num">{numParse(row.volume)}</span></td
																>
																<td style="text-align: right;"
																	><span class="num">{numParse(row.value.toFixed(2))}</span></td
																>
															</tr>
														{/each}
														<tr class="trades-total">
															<td colspan="4" style="text-align: right;"
																><strong
																	>Total: <span class="num"
																		>{numParse(clientPortfolio.portfolioTotalUsd.toFixed(2))}</span
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
												<span>{i + 1}</span>
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

									<section class="page ui-sp">
										<p style="font-size: 2em; font-weight: 700;">Portfolio Highlights</p>

										<table style="width: 100%;">
											<tbody>
												<tr>
													<td style="text-align: center;"
														><p style="font-weight: 500;">Best Performing Stock</p>
														<p>
															{mrMateSymbols(clientPortfolio.analysis.best.symbol)} | {numParse(
																percentageHandler(clientPortfolio.analysis.best.value).replace(
																	"%",
																	"",
																),
															)}%
														</p></td
													>
													<td style="text-align: center; border-left: 1px solid black;"
														><p style="font-weight: 500;">Worst Performing Stock</p>
														<p>
															{mrMateSymbols(clientPortfolio.analysis.worst.symbol)} | {numParse(
																percentageHandler(clientPortfolio.analysis.worst.value).replace(
																	"%",
																	"",
																),
															)}%
														</p></td
													>
												</tr>
												<tr>
													<td style="text-align: center; padding: 0px"
														><span style="font-weight: 500;">Most Exposure</span>
														<span class="num">
															{mrMateSymbols(clientPortfolio.analysis.heaviest.symbol)} | {numParse(
																percentageHandler(clientPortfolio.analysis.heaviest.value).replace(
																	"%",
																	"",
																),
															)}%
														</span></td
													>
													<td style="text-align: center; border-left: 1px solid black;"
														><span style="font-weight: 500;">Least Exposure</span>
														<span class="num">
															{mrMateSymbols(clientPortfolio.analysis.lightest.symbol)} | {numParse(
																percentageHandler(clientPortfolio.analysis.lightest.value).replace(
																	"%",
																	"",
																),
															)}%
														</span></td
													>
												</tr>
											</tbody>
										</table>

										<table style="width: 100%; margin-top: 20px; border-top: 1px solid black;">
											<tbody>
												<tr>
													<td style="text-align: center;"
														><p>
															<b>ZMW Investment:</b>{" "}<span class="num"
																>{numParse(
																	clientPortfolio.analysis.totalInvestmentZmw.toFixed(2),
																)}</span
															>
														</p>
														<p>
															<b>Growth:</b>{" "}<span class="num"
																>{numParse(
																	percentageHandler(
																		clientPortfolio.analysis.totalGrowthZmw,
																	).replace("%", ""),
																)}%</span
															>
														</p></td
													>

													<td style="text-align: center;"
														><p>
															<b>USD Investment:</b>{" "}<span class="num"
																>{numParse(
																	clientPortfolio.analysis.totalInvestmentUsd.toFixed(2),
																)}</span
															>
														</p>
														<p>
															<b>Growth:</b>{" "}<span class="num"
																>{numParse(
																	percentageHandler(
																		clientPortfolio.analysis.totalGrowthUsd,
																	).replace("%", ""),
																)}%</span
															>
														</p></td
													>
												</tr>
											</tbody>
										</table>

										<table style="width: 100%; position: absolute;">
											<tbody>
												<tr>
													<td
														><PortfolioComposition
															pfolio={clientPortfolio.analysis.chart.pfolio}
															symbols={clientPortfolio.analysis.chart.symbols}
															turnovers={clientPortfolio.analysis.chart.turnovers}
														/></td
													>
												</tr>
											</tbody>
										</table>

										<p
											class="pnum"
											style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"
										>
											<span>Prepared by {toTitleCase(data.admin)}</span>
											<span>{clientPortfolio.portfolioZmw.length + 1}</span>
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
								{:else}
									<section class="page ui-sp">
										<table class="top">
											<tbody>
												<tr>
													<td><img src={logos.sbz} alt="sbz logo" /></td>
													<td>
														<p class="title">Portfolio Statement</p>
														<p class="exchange">
															{prettyDate(date)}
														</p>
														<p class="date">
															{activeRow.luseId}LI - {toTitleCase(combineNames())}
														</p>
													</td>
												</tr>
											</tbody>
										</table>

										<p style="margin-top: 10px; margin-bottom: 20px;">
											This client has no holdings in their portfolio... yet!
										</p>

										<p
											class="pnum"
											style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"
										>
											<span>Prepared by {toTitleCase(data.admin)}</span>
											<span>{1}</span>
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
								{/if}
							</section>
						{:else if portfolioDisplayOption === "matched"}
							<section id="matched" class="page-holder">
								{#if clientPortfolio.matched}
									<section class="page">
										<table class="top">
											<tbody>
												<tr>
													<td><img src={logos.sbz} alt="sbz logo" /></td>
													<td>
														<p class="title">Trade Report</p>
														<p class="exchange">
															{prettyDate(date)}
														</p>
														<p class="date">
															{activeRow.luseId}LI - {toTitleCase(combineNames())}
														</p>
													</td>
												</tr>
											</tbody>
										</table>

										<p style="margin-top: 10px; margin-bottom: 20px;">
											Please take a look at your matched trades over the above stated period in the
											table below.
										</p>

										{#if clientPortfolio.matched.tradesZmw.length}
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
													{#each clientPortfolio.matched.tradesZmw[0] as trade}
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
																>Total Buys: <span class="num"
																	>{numParse(clientPortfolio.matched.zmwTotalBuy.toFixed(2))}</span
																></strong
															>{" • "}<strong
																>Total Sell: <span class="num"
																	>{numParse(clientPortfolio.matched.zmwTotalSell.toFixed(2))}</span
																></strong
															>
														</td>
													</tr>
												</tbody>
											</table>
										{/if}

										{#if clientPortfolio.matched.tradesUsd.length}
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
													{#each clientPortfolio.matched.tradesUsd[0] as trade}
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
																>Total Buys: <span class="num"
																	>{numParse(clientPortfolio.matched.usdTotalBuy.toFixed(2))}</span
																></strong
															>{" • "}<strong
																>Total Sell: <span class="num"
																	>{numParse(clientPortfolio.matched.usdTotalSell.toFixed(2))}</span
																></strong
															>
														</td>
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

										<p class="contact-btm">
											<MapPin style="height: 20px; width: 20px;" />
											<span style="margin-right: 10px;">{contactDetails.address}</span>
											<Phone style="height: 20px; width: 20px;" />
											<span style="margin-right: 10px;">{contactDetails.tel}</span>
											<Mail style="height: 20px; width: 20px;" />
											<span style="margin-right: 10px;">{contactDetails.email}</span>
										</p>
									</section>

									{#each clientPortfolio.matched.tradesZmw.slice(1) as trade, i}
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
																>Total Buys: <span class="num"
																	>{numParse(clientPortfolio.matched.zmwTotalBuy.toFixed(2))}</span
																></strong
															>{" • "}<strong
																>Total Sell: <span class="num"
																	>{numParse(clientPortfolio.matched.zmwTotalSell.toFixed(2))}</span
																></strong
															>
														</td>
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
								{:else}
									<section class="page ui-sp">
										<table class="top">
											<tbody>
												<tr>
													<td><img src={logos.sbz} alt="sbz logo" /></td>
													<td>
														<p class="title">Trade Report</p>
														<p class="exchange">
															{prettyDate(date)}
														</p>
														<p class="date">
															{activeRow.luseId}LI - {toTitleCase(combineNames())}
														</p>
													</td>
												</tr>
											</tbody>
										</table>

										<p style="margin-top: 10px; margin-bottom: 20px;">
											This client has no trade history... yet!
										</p>

										<p
											class="pnum"
											style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"
										>
											<span>Prepared by {toTitleCase(data.admin)}</span>
											<span>{1}</span>
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
								{/if}
							</section>
						{:else if portfolioDisplayOption === "screen"}
							<section id="screen" class="page-holder">
								{#if clientPortfolio.screen}
									<section class="page">
										<table class="top">
											<tbody>
												<tr>
													<td><img src={logos.sbz} alt="sbz logo" /></td>
													<td>
														<p class="title">On-Screen Order Report</p>
														<p class="exchange">
															{clientPortfolio.screen.orderDates[0].label}
														</p>
														<p class="date">
															{activeRow.luseId}LI - {combineNames()}
														</p>
													</td>
												</tr>
											</tbody>
										</table>

										<p style="margin-top: 10px; margin-bottom: 20px;">
											Please take a look at your on-screen orders over the above date in the table
											below.
										</p>

										{#if clientPortfolio.screen.ordersZmw.length}
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
													{#each clientPortfolio.screen.ordersZmw[0] as trade}
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
																>Total Buys: <span class="num"
																	>{numParse(clientPortfolio.screen.zmwTotalBuy.toFixed(2))}</span
																></strong
															>{" • "}<strong
																>Total Sells: <span class="num"
																	>{numParse(clientPortfolio.screen.zmwTotalSell.toFixed(2))}</span
																></strong
															></td
														>
													</tr>
												</tbody>
											</table>
										{/if}

										{#if clientPortfolio.screen.ordersUsd.length}
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
													{#each clientPortfolio.screen.ordersUsd[0] as trade}
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
																>Total Buys: <span class="num"
																	>{numParse(clientPortfolio.screen.usdTotalBuy.toFixed(2))}</span
																></strong
															>{" • "}<strong
																>Total Sells: <span class="num"
																	>{numParse(clientPortfolio.screen.usdTotalSell.toFixed(2))}</span
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

										<p class="contact-btm">
											<MapPin style="height: 20px; width: 20px;" />
											<span style="margin-right: 10px;">{contactDetails.address}</span>
											<Phone style="height: 20px; width: 20px;" />
											<span style="margin-right: 10px;">{contactDetails.tel}</span>
											<Mail style="height: 20px; width: 20px;" />
											<span style="margin-right: 10px;">{contactDetails.email}</span>
										</p>
									</section>

									{#each clientPortfolio.screen.ordersZmw.slice(1) as trade, i}
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
																>Total Buys: <span class="num"
																	>{numParse(clientPortfolio.screen.zmwTotalBuy.toFixed(2))}</span
																></strong
															>{" • "}<strong
																>Total Sells: <span class="num"
																	>{numParse(clientPortfolio.screen.zmwTotalSell.toFixed(2))}</span
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
								{:else}
									<section class="page ui-sp">
										<table class="top">
											<tbody>
												<tr>
													<td><img src={logos.sbz} alt="sbz logo" /></td>
													<td>
														<p class="title">On-Screen Order Report</p>
														<p class="exchange">
															{prettyDate(date)}
														</p>
														<p class="date">
															{activeRow.luseId}LI - {toTitleCase(combineNames())}
														</p>
													</td>
												</tr>
											</tbody>
										</table>

										<p style="margin-top: 10px; margin-bottom: 20px;">
											This client has no on-screen orders!
										</p>

										<p
											class="pnum"
											style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"
										>
											<span>Prepared by {toTitleCase(data.admin)}</span>
											<span>{1}</span>
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
								{/if}
							</section>
						{/if}
						<!-- end pages -->
					{/if}

					<div class="controls">
						{#if !clientPortfolio}
							<span></span>
						{:else}
							<AnyCombobox
								handler={updatePortfolioDisplayOption}
								data={{
									grouped: [
										{
											title: "Reports",
											group: [
												{ label: "Portfolio", value: "port" },
												{ label: "Matched", value: "matched" },
												{ label: "Screen", value: "screen" },
											],
										},
									],
									ungrouped: [],
								}}
								dataTitle="Report"
								forceValue={"port"}
							/>

							<Button class="mt-5" {disabled} onclick={() => genPdf(portfolioDisplayOption)}
								>Download<Download class="ml-2 h-4 w-4" /></Button
							>
						{/if}
					</div>
				</div>
			{/if}

			{#if config === "file"}
				<div class="holder">
					{#if filesLoading}
						<div class="kyc-doc loading no-padding"></div>

						<div class="controls">
							<AnyCombobox
								handler={(v) => null}
								data={{
									grouped: [],
									ungrouped: [],
								}}
								dataTitle="Document"
								classes="loading"
							/>
						</div>
					{:else if $filesCacheStore[idSanitiser(activeRow.id_num)] && $filesCacheStore[idSanitiser(activeRow.id_num)].length}
						<div>
							<iframe src={iFrameHelper.src} class="kyc-doc" title="kyc document"></iframe>
						</div>

						<div class="controls">
							<AnyCombobox
								handler={handleSelectedIndex}
								data={{
									grouped: [
										{
											title: "Documents",
											group: iFrameHelper.options.map((v, i) => {
												return { label: v, value: i };
											}),
										},
									],
									ungrouped: [],
								}}
								dataTitle="Document"
								forceValue={0}
							/>
						</div>
					{:else}
						No documents found.
					{/if}
				</div>
			{/if}
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

	.kyc-doc {
		// border: 1px solid red;
		width: 800px;
		height: 78vh;
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
