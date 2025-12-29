<script lang="ts">
	//functions
	import { tick } from "svelte";
	import { toast } from "svelte-sonner";
	import {
		workDayEngines,
		getOldDate,
		percentageHandler,
		mrMateSymbols,
		prettyDate,
	} from "$lib/utils";
	import { numParse } from "@cerebrusinc/qol";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import Summary from "./Summary.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";
	import AnyDrawer from "$lib/components/AnyDrawer.svelte";
	import { StockChart } from "./(charts)";

	//components - shadcn
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import Label from "$lib/components/ui/label/label.svelte";
	import Button from "$lib/components/ui/button/button.svelte";

	//icons
	import { ChevronRight } from "@lucide/svelte";

	//stores
	import {
		stocksCacheStore,
		fxCacheStore,
		econCacheStore,
		expandedStockCacheStore,
		screenWidthStore,
	} from "$lib/stores";

	//types
	import type { ExpandedSymbol, NFHelp, GenericResponseWData } from "$lib/types";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let initStocks = $state<boolean>(true);
	let initFx = $state<boolean>(true);
	let initEcon = $state<boolean>(true);

	let stockData = $state<NFHelp["StockData"][]>([]);
	let fxData = $state<NFHelp["FxData"][]>([]);
	let econData = $state<NFHelp["EconData"][]>([]);
	let opinions = $state<NFHelp["OpinionsData"][]>([]);

	let isMobile = $derived($screenWidthStore < 767);

	$effect(() => {
		data.stocks
			.then((res) => {
				stockData = res.market;
				initStocks = false;
			})
			.catch(() => {
				toast.error("Failed to get stock data! Please refresh the browser in a few minutes.");
				initStocks = false;
			});
	});

	$effect(() => {
		data.fx
			.then((res) => {
				fxData = res.fx;
				initFx = false;
			})
			.catch(() => {
				toast.error("Failed to get FX! Please refresh the browser in a few minutes.");
				initFx = false;
			});
	});

	$effect(() => {
		data.opinions
			.then((res) => {
				opinions = res.recommendations;
			})
			.catch(() => {
				toast.error("Failed to get recommendations! Please refresh the browser in a few minutes.");
			});
	});

	let fxUsd = $derived.by(() => {
		if (fxData.length) {
			const usd = fxData
				.filter((item) => item.currency === "USD/ZMW")
				.sort((a, b) => b.date - a.date)[0];

			return { buy: usd.buy, sell: usd.sell };
		} else {
			return { buy: 0, sell: 0 };
		}
	});

	let globalSummarySetting = $state<"day" | "week">("day");

	interface CodexData {
		diff: number;
		symbol: string;
		vi: number;
		vf: number;
		sum: number;
		oldSum: number;
	}

	type GenericCodex = { [key: string]: CodexData };

	let stockSummary = $derived.by(() => {
		if (stockData.length) {
			const df = stockData[0].date;

			let di = stockData[0].date;

			const prevDayData = stockData
				.filter((item) => item.symbol === "LASI" && item.date !== df)
				.sort((a, b) => b.date - a.date)[0];

			let dOld = prevDayData.date;

			if (globalSummarySetting === "week") {
				di = workDayEngines.pastWeek(stockData, df, false);
				dOld = workDayEngines.pastWeek(stockData, di, false);
			}

			const cleanedData: NFHelp["StockData"][] = [];
			const oldData: NFHelp["StockData"][] = [];

			stockData.forEach((stock) => {
				// put trailing data in cleaned data
				if (stock.date >= di && stock.date <= df) {
					cleanedData.push(stock);
				}

				// put old data in old data
				if (stock.date >= dOld && stock.date <= di) {
					oldData.push(stock);
				}
			});

			cleanedData.sort((a, b) => a.date - b.date);
			oldData.sort((a, b) => a.date - b.date);

			const turnoverCodex: GenericCodex = {};
			const volCodex: GenericCodex = {};
			const deltaCodex: GenericCodex = {};

			const reizusdCodex: { turnover: CodexData; vol: CodexData; delta: CodexData } = {
				delta: { diff: 0, symbol: "REIZUSD", vf: 0, vi: -1, sum: 0, oldSum: -2 },
				vol: { diff: 0, symbol: "REIZUSD", vf: -2, vi: -1, sum: 0, oldSum: 0 },
				turnover: { diff: 0, symbol: "REIZUSD", vf: -2, vi: -1, sum: 0, oldSum: 0 },
			};

			const lasiCodex: { turnover: CodexData; vol: CodexData; delta: CodexData } = {
				delta: { diff: 0, symbol: "LASI", vf: 0, vi: -1, sum: 0, oldSum: -2 },
				vol: { diff: 0, symbol: "LASI", vf: -2, vi: -1, sum: 0, oldSum: 0 },
				turnover: { diff: 0, symbol: "LASI", vf: -2, vi: -1, sum: 0, oldSum: 0 },
			};

			// set trailing data
			cleanedData.forEach((stock) => {
				// lasi calcs
				if (stock.symbol === "LASI") {
					const turnoverLasi = stock.turnover;
					const volLasi = stock.traded_vol;
					const priceLasi = stock.market_price;

					// first (earliest date) setting
					if (stock.date === di) {
						lasiCodex.delta.vi = priceLasi;
					}

					// sum what needs to be summed
					lasiCodex.turnover.sum = lasiCodex.turnover.sum + turnoverLasi;
					lasiCodex.vol.sum = lasiCodex.vol.sum + volLasi;

					// get the final lasi delta
					if (stock.date === df) {
						lasiCodex.delta.vf = priceLasi;
						lasiCodex.delta.diff = priceLasi - lasiCodex.delta.vi;
					}

					lasiCodex.turnover.vf = turnoverLasi;
					lasiCodex.vol.vf = volLasi;
				}

				// reizusd calcs
				if (stock.symbol === "REIZUSD") {
					const turnoverReizusd = stock.turnover;
					const volReizusd = stock.traded_vol;
					const priceReizusd = stock.market_price;

					// first (earliest date) setting
					if (stock.date === di) {
						reizusdCodex.delta.vi = priceReizusd;
					}

					// sum what needs to be summed
					reizusdCodex.turnover.sum = reizusdCodex.turnover.sum + turnoverReizusd;
					reizusdCodex.vol.sum = reizusdCodex.vol.sum + volReizusd;

					// get the final reizusd delta
					if (stock.date === df) {
						reizusdCodex.delta.vf = priceReizusd;
						reizusdCodex.delta.diff = priceReizusd - reizusdCodex.delta.vi;

						reizusdCodex.turnover.vf = turnoverReizusd;
						reizusdCodex.vol.vf = volReizusd;
					}
				}

				// rest calcs
				if (stock.symbol !== "REIZUSD" && stock.symbol !== "LASI") {
					const symbol = stock.symbol;
					const turnoverSymbol = stock.turnover;
					const volSymbol = stock.traded_vol;
					const priceSymbol = stock.market_price;

					if (!turnoverCodex[symbol])
						turnoverCodex[symbol] = { diff: 0, symbol, vf: -2, vi: -1, sum: 0, oldSum: 0 };
					if (!volCodex[symbol])
						volCodex[symbol] = { diff: 0, symbol, vf: -2, vi: -1, sum: 0, oldSum: 0 };
					if (!deltaCodex[symbol])
						deltaCodex[symbol] = { diff: 0, symbol, vf: -2, vi: -1, sum: 0, oldSum: 0 };

					// first (earliest date) setting
					if (stock.date === di) {
						deltaCodex[symbol].vi = priceSymbol;
					}

					// sum what needs to be summed
					turnoverCodex[symbol].sum = turnoverCodex[symbol].sum + turnoverSymbol;
					volCodex[symbol].sum = volCodex[symbol].sum + volSymbol;

					// get the final symbol delta
					if (stock.date === df) {
						deltaCodex[symbol].vf = priceSymbol;
						deltaCodex[symbol].diff = priceSymbol - deltaCodex[symbol].vi;

						turnoverCodex[symbol].vf = turnoverSymbol;
						volCodex[symbol].vf = volSymbol;
					}
				}
			});

			// solely for turnover and tades; get values from old week
			oldData.forEach((stock) => {
				// lasi calcs
				if (stock.symbol === "LASI") {
					const turnoverLasi = stock.turnover;
					const volLasi = stock.traded_vol;
					const priceLasi = stock.market_price;

					if (stock.date === dOld && globalSummarySetting === "day") {
						lasiCodex.delta.vi = priceLasi;
						lasiCodex.delta.diff = lasiCodex.delta.vf - priceLasi;
					}

					// sum what needs to be summed
					lasiCodex.turnover.oldSum = lasiCodex.turnover.oldSum + turnoverLasi;
					lasiCodex.vol.oldSum = lasiCodex.vol.oldSum + volLasi;

					// figure out the final diffs
					if (stock.date === di) {
						lasiCodex.turnover.diff = lasiCodex.turnover.sum - lasiCodex.turnover.oldSum;
						lasiCodex.vol.diff = lasiCodex.vol.sum - lasiCodex.vol.oldSum;
					}
				}

				// reizusd calcs
				if (stock.symbol === "REIZUSD") {
					const turnoverReizusd = stock.turnover;
					const volReizusd = stock.traded_vol;
					const priceReizusd = stock.market_price;

					if (stock.date === dOld && globalSummarySetting === "day") {
						reizusdCodex.delta.vi = priceReizusd;
						reizusdCodex.delta.diff = reizusdCodex.delta.vf - priceReizusd;
					}

					// sum what needs to be summed
					reizusdCodex.turnover.oldSum = reizusdCodex.turnover.oldSum + turnoverReizusd;
					reizusdCodex.vol.oldSum = reizusdCodex.vol.oldSum + volReizusd;

					// figure out the final diffs
					if (stock.date === di) {
						reizusdCodex.turnover.diff = reizusdCodex.turnover.sum - reizusdCodex.turnover.oldSum;
						reizusdCodex.vol.diff = reizusdCodex.vol.sum - reizusdCodex.vol.oldSum;
					}
				}

				// rest calcs
				if (stock.symbol !== "REIZUSD" && stock.symbol !== "LASI") {
					const symbol = stock.symbol;
					const turnoverSymbol = stock.turnover;
					const volSymbol = stock.traded_vol;
					const priceSymbol = stock.market_price;

					if (stock.date === dOld && globalSummarySetting === "day") {
						deltaCodex[symbol].vi = priceSymbol;
						deltaCodex[symbol].diff = deltaCodex[symbol].vf - priceSymbol;
					}

					// sum what needs to be summed
					if (turnoverCodex[symbol] && volCodex[symbol]) {
						turnoverCodex[symbol].oldSum = turnoverCodex[symbol].oldSum + turnoverSymbol;
						volCodex[symbol].oldSum = volCodex[symbol].oldSum + volSymbol;
					}

					// figure out the final diffs
					if (stock.date === di) {
						turnoverCodex[symbol].diff = turnoverCodex[symbol].sum - turnoverCodex[symbol].oldSum;
						volCodex[symbol].diff = volCodex[symbol].sum - volCodex[symbol].oldSum;
					}
				}
			});

			const turnoverArr = Object.values(turnoverCodex).sort((a, b) => b.sum - a.sum);
			const volArr = Object.values(volCodex).sort((a, b) => b.sum - a.sum);
			// descending percetage change
			const deltaArrTop = Object.values(deltaCodex)
				.sort((a, b) => b.diff / b.vi - a.diff / a.vi)
				.filter((item) => item.diff > 0);
			const deltaArrBottom = Object.values(deltaCodex)
				.sort((a, b) => a.diff / a.vi - b.diff / b.vi)
				.filter((item) => item.diff < 0);

			// console.log({ deltaCodex, dOld, df, di }, Date.now());

			const lasiSummary = `The market ${lasiCodex.delta.diff > 0 ? "grew" : lasiCodex.delta.diff < 0 ? "dropped" : "stayed flat"}${lasiCodex.delta.diff !== 0 ? " by ||?" + percentageHandler(Math.abs(lasiCodex.delta.diff / lasiCodex.delta.vi)) + "||" : ""} closing at ||?${numParse(lasiCodex.delta.vf.toFixed(2))}|| points and recording ||?${numParse(lasiCodex.vol.sum)}|| shares traded and ||?${numParse(lasiCodex.turnover.sum.toFixed(2))}|| in turnover. The top contributor to turnover was ${mrMateSymbols(turnoverArr[0].symbol)} at ||?${numParse(turnoverArr[0].sum)} (${percentageHandler(turnoverArr[0].sum / lasiCodex.turnover.sum)})||, and the top contributor to trading volume was ${mrMateSymbols(volArr[0].symbol)} at ||?${numParse(volArr[0].vf)} (${percentageHandler(volArr[0].vf / lasiCodex.turnover.vf)})||.`;

			let reizSummary = "No trading or price activity recorded for Real Estate USD.";

			if (reizusdCodex.turnover.sum && !reizusdCodex.delta.diff) {
				reizSummary = `Real Estate USD reported a turnover of ||?${numParse(reizusdCodex.turnover.sum.toFixed(2))}|| and ||?${numParse(reizusdCodex.vol.sum)}|| shares traded with no price change reported.`;
			}

			if (!reizusdCodex.turnover.sum && reizusdCodex.delta.diff) {
				reizSummary = `Real Estate USD ${reizusdCodex.delta.diff > 0 ? "grew" : reizusdCodex.delta.diff < 0 ? "dropped" : "stayed flat"}${reizusdCodex.delta.diff !== 0 ? " by ||?" + percentageHandler(Math.abs(reizusdCodex.delta.diff / reizusdCodex.delta.vi)) + "||" : ""} closing at ||?${numParse(reizusdCodex.delta.vf.toFixed(2))}|| with no trading activity reported.`;
			}

			if (reizusdCodex.turnover.sum && reizusdCodex.delta.diff) {
				reizSummary = `Real Estate USD ${reizusdCodex.delta.diff > 0 ? "grew" : reizusdCodex.delta.diff < 0 ? "dropped" : "stayed flat"}${reizusdCodex.delta.diff !== 0 ? " by ||?" + percentageHandler(Math.abs(reizusdCodex.delta.diff / reizusdCodex.delta.vi)) + "||" : ""} closing at ||?${numParse(reizusdCodex.delta.vf.toFixed(2))}|| reporting a turnover of ||?${numParse(reizusdCodex.turnover.sum.toFixed(2))}|| and ||?${numParse(reizusdCodex.vol.sum)}|| shares traded.`;
			}

			return {
				di,
				df,
				deltaArrBottom,
				deltaArrTop,
				lasiSummary,
				reizSummary,
			};
		} else return undefined;
	});

	let symbolsPicker = $derived.by(() => {
		if (stockData.length) {
			const _symbols: { label: string; value: string }[] = [];

			_symbols.push({ label: "Market", value: "LASI" });

			const blacklist: string[] = ["LASI", "CECR", "EIZP", "FARM", "LUSE", "NANG", "VGIP"];

			stockData.forEach((stock) => {
				if (!blacklist.includes(stock.symbol)) {
					_symbols.push({ label: mrMateSymbols(stock.symbol), value: stock.symbol });
					blacklist.push(stock.symbol);
				}
			});

			_symbols.sort((a, b) => a.value.localeCompare(b.value));

			return _symbols;
		}
	});

	let selectedSymbol = $state<string>("");
	const handleSelectedSymbol = (val: string) => (selectedSymbol = val);

	const symbolMetrics: { label: string; value: NFHelp["DmbRowKey"] }[] = [
		{ label: "Change", value: "delta" },
		{ label: "% Change", value: "delta_abs" },
		{ label: "Price", value: "market_price" },
		{ label: "Volume", value: "traded_vol" },
		{ label: "Turnover", value: "turnover" },
		{ label: "Market Cap", value: "market_cap" },
	];

	let selectedKey = $state<NFHelp["DmbRowKey"]>("market_price");
	const handleSelectedKey = (val: NFHelp["DmbRowKey"]) => (selectedKey = val);

	const initExpandedSymbol: ExpandedSymbol = {
		currency: "ZMW",
		mcap: {
			usd: 0,
			zmw: 0,
		},
		price: {
			price: 0,
			change: 0,
			percentageChange: 0,
			ytd: 0,
			trail52H: 0,
			trail52L: 0,
		},
		bidask: {
			bid: 0,
			ask: 0,
			bidVol: 0,
			askVol: 0,
		},
		trades: {
			vol: 0,
			turn: 0,
			turnUsd: 0,
		},
		sentiment: {
			value: "Buy",
			class: "gren",
		},
		profitability: {
			cfps: 0,
			eps: 0,
		},
		return: {
			roe: 0,
			roa: 0,
			roi: 0,
		},
		margins: {
			gp: 0,
			pbit: 0,
			pbt: 0,
			np: 0,
			tax: 0,
		},
		liquidity: {
			quick: 0,
			current: 0,
		},
		efficiency: {
			acp: 0,
			app: 0,
			assTurn: 0,
		},
		intrinsic: {
			nav: 0,
			pe: 0,
			pb: 0,
			entVal: 0,
		},
		div: {
			net: 0,
			yield: 0,
		},
		capm: {
			beta: 0,
			alpha: 0,
			er: 0,
			fv: 0,
		},
		cashFlowYear: 983,
		cashFlowData: [],
		incomeYear: 983,
		incomeData: [],
		balanceYear: 983,
		balanceData: [],
	};

	let expandedSymbol = $state<ExpandedSymbol>(initExpandedSymbol);
	let expandedLoading = $state<boolean>(true);

	let openTrigger = $state<number>(0);

	const collateSymbol = (symbolData: NFHelp["ExpandedSymbolReturn"]): ExpandedSymbol => {
		const _opinions = JSON.parse(JSON.stringify(opinions));

		const opinionatedSymbols = Object.keys(_opinions[0].data);

		/* Console Log
		console.log({
			_opinions,
			selectedSymbol,
			op0: _opinions[0],
			opSymbs: opinionatedSymbols,
			// @ts-ignore
			val: opinionatedSymbols.includes(selectedSymbol) ? _opinions[0].data[selectedSymbol] : "N/A",
		});
		*/

		const returnData: ExpandedSymbol = initExpandedSymbol;

		const { balance, cashFlow, fundamentals, income } = symbolData;

		// set currency
		returnData.currency = income[0].currency;

		const symbolMarketData = stockData
			.filter((item) => item.symbol === selectedSymbol)
			.sort((a, b) => b.date - a.date)[0];

		// set price info
		returnData.price.price = symbolMarketData.market_price;
		returnData.price.change = symbolMarketData.delta_abs;
		returnData.price.percentageChange = symbolMarketData.delta;
		returnData.price.ytd = symbolMarketData.ytd;
		returnData.price.trail52H = symbolMarketData.trail_52_high;
		returnData.price.trail52L = symbolMarketData.trail_52_low;

		// set bid ask
		returnData.bidask.bidVol = symbolMarketData.bid_vol;
		returnData.bidask.bid = symbolMarketData.bid;
		returnData.bidask.ask = symbolMarketData.ask;
		returnData.bidask.askVol = symbolMarketData.ask_vol;

		// set trades and mcap
		returnData.trades.vol = symbolMarketData.traded_vol;

		if (selectedSymbol.includes("USD")) {
			returnData.trades.turn = symbolMarketData.turnover * fxUsd.buy;
			returnData.trades.turnUsd = symbolMarketData.turnover;

			returnData.mcap.zmw = symbolMarketData.market_cap * fxUsd.buy;
			returnData.mcap.usd = symbolMarketData.market_cap;
		} else {
			returnData.trades.turn = symbolMarketData.turnover;
			returnData.trades.turnUsd = symbolMarketData.turnover / fxUsd.sell;

			returnData.mcap.zmw = symbolMarketData.market_cap;
			returnData.mcap.usd = symbolMarketData.market_cap / fxUsd.sell;
		}

		// set sentiment
		const opinion = opinionatedSymbols.includes(selectedSymbol)
			? _opinions[0].data[selectedSymbol]
			: "N/A";

		returnData.sentiment.value = opinion;

		switch (opinion) {
			case "Accumulate":
				returnData.sentiment.class = "blu";
				break;
			case "Reduce":
				returnData.sentiment.class = "orng";
				break;
			case "Hold":
				returnData.sentiment.class = undefined;
				break;
			case "Sell":
				returnData.sentiment.class = "rd";
				break;
			case "Buy":
				returnData.sentiment.class = "gren";
				break;
			default:
				returnData.sentiment.class = undefined;
				break;
		}

		// console.log(fundamentals, Date.now());

		const sFun = fundamentals[0];

		// set profitability
		returnData.profitability.eps = sFun.eps;
		returnData.profitability.cfps = sFun.cfps;

		// set return metrics
		returnData.return.roa = sFun.roa;
		returnData.return.roi = sFun.roi;
		returnData.return.roe = sFun.roe;

		// set margin metrics
		returnData.margins.gp = sFun.gpm;
		returnData.margins.np = sFun.npm;
		returnData.margins.pbit = sFun.pbitm;
		returnData.margins.pbt = sFun.pbtm;
		returnData.margins.tax = sFun.tax_brd;

		// set margin metrics
		returnData.margins.gp = sFun.gpm;
		returnData.margins.np = sFun.npm;
		returnData.margins.pbit = sFun.pbitm;
		returnData.margins.pbt = sFun.pbtm;
		returnData.margins.tax = sFun.tax_brd;

		// set liquidity metrics
		returnData.liquidity.current = sFun.current;
		returnData.liquidity.quick = sFun.quick;

		// set efficiency metrics
		returnData.efficiency.acp = sFun.acp;
		returnData.efficiency.app = sFun.app;
		returnData.efficiency.assTurn = sFun.ass_turn;

		// set intrinsic metrics
		returnData.intrinsic.entVal = sFun.ent_val;
		returnData.intrinsic.nav = sFun.navps;
		returnData.intrinsic.pb = sFun.pbv;
		returnData.intrinsic.pe = sFun.pe;

		// set div metrics
		returnData.div.net = sFun.net_div;
		returnData.div.yield = sFun.div_yield;

		// set capm metrics
		returnData.capm.alpha = sFun.alpha;
		returnData.capm.beta = sFun.beta;
		returnData.capm.er = sFun.er;
		returnData.capm.fv = sFun.fv;

		// set cash flow
		const cFlow = cashFlow.slice(0, 3);
		cFlow.sort((a, b) => b.date - a.date);

		cFlow.forEach((row, i) => {
			if (!i) {
				const cYear = Number(prettyDate(row.date).split(" ")[2]);
				returnData.cashFlowYear = cYear;

				if (isMobile) {
					returnData.cashFlowData.push(["Net Op. Act.", row.op_act]);
					returnData.cashFlowData.push(["Net Inv. Act.", row.inv_act]);
					returnData.cashFlowData.push(["Cap Ex", row.capex]);
					returnData.cashFlowData.push(["Pref. Div.", row.pref_div_paid]);
					returnData.cashFlowData.push(["Net Fin. Act.", row.fin_act]);
					returnData.cashFlowData.push(["space"]);
					returnData.cashFlowData.push(["Beginning Balance", row.open_bal]);
					returnData.cashFlowData.push(["End Balance", row.per_cash]);
				} else {
					returnData.cashFlowData.push(["Net Operating Activities", row.op_act]);
					returnData.cashFlowData.push(["Net Investing Activities", row.inv_act]);
					returnData.cashFlowData.push(["Cap Ex", row.capex]);
					returnData.cashFlowData.push(["Preferred Dividend", row.pref_div_paid]);
					returnData.cashFlowData.push(["Net Financing Activities", row.fin_act]);
					returnData.cashFlowData.push(["space"]);
					returnData.cashFlowData.push(["Beginning of Period Balance", row.open_bal]);
					returnData.cashFlowData.push(["End of Period Balance", row.per_cash]);
				}
			} else {
				returnData.cashFlowData[0].push(row.op_act);
				returnData.cashFlowData[1].push(row.inv_act);
				returnData.cashFlowData[2].push(row.capex);
				returnData.cashFlowData[3].push(row.pref_div_paid);
				returnData.cashFlowData[4].push(row.fin_act);
				returnData.cashFlowData[6].push(row.open_bal);
				returnData.cashFlowData[7].push(row.per_cash);
			}
		});

		if (cFlow.length === 1) {
			returnData.cashFlowData[0].push(0);
			returnData.cashFlowData[0].push(0);

			returnData.cashFlowData[1].push(0);
			returnData.cashFlowData[1].push(0);

			returnData.cashFlowData[2].push(0);
			returnData.cashFlowData[2].push(0);

			returnData.cashFlowData[3].push(0);
			returnData.cashFlowData[3].push(0);

			returnData.cashFlowData[4].push(0);
			returnData.cashFlowData[4].push(0);

			returnData.cashFlowData[6].push(0);
			returnData.cashFlowData[6].push(0);

			returnData.cashFlowData[7].push(0);
			returnData.cashFlowData[7].push(0);
		}

		if (cFlow.length === 2) {
			returnData.cashFlowData[0].push(0);
			returnData.cashFlowData[1].push(0);
			returnData.cashFlowData[2].push(0);
			returnData.cashFlowData[3].push(0);
			returnData.cashFlowData[4].push(0);
			returnData.cashFlowData[6].push(0);
			returnData.cashFlowData[7].push(0);
		}

		// set income statement
		const icStat = income.slice(0, 3);
		icStat.sort((a, b) => b.date - a.date);

		icStat.forEach((row, i) => {
			if (!i) {
				const icYear = Number(prettyDate(row.date).split(" ")[2]);
				returnData.incomeYear = icYear;

				if (isMobile) {
					returnData.incomeData.push(["Revenue", row.revenue]);
					returnData.incomeData.push(["COGS", row.cogs]);
					returnData.incomeData.push(["Gross Profit", row.g_prof]);
					returnData.incomeData.push(["space"]);
					returnData.incomeData.push(["Admin Expenses", row.admin_exp]);
					returnData.incomeData.push(["Other Income/Expenses", row.other_op_exp]);
					returnData.incomeData.push(["PBIT", row.pbit]);
					returnData.incomeData.push(["space"]);
					returnData.incomeData.push(["Fin Expenses", row.fin_exp]);
					returnData.incomeData.push(["Other Income/Expenses", row.other_fin_exp]);
					returnData.incomeData.push(["PBT", row.pbt]);
					returnData.incomeData.push(["space"]);
					returnData.incomeData.push(["Tax", row.tax_exp]);
					returnData.incomeData.push(["Other Income/Expenses", row.other_inc_exp]);
					returnData.incomeData.push(["Net Income", row.other_inc_exp]);
					returnData.incomeData.push(["space"]);
					returnData.incomeData.push(["Total Compr. Income", row.tot_comp_inc]);
					returnData.incomeData.push(["space"]);
					returnData.incomeData.push(["Issued Shares", row.issued_shares]);
					returnData.incomeData.push(["EPS", row.eps * 1_000_000]);
				} else {
					returnData.incomeData.push(["Revenue", row.revenue]);
					returnData.incomeData.push(["Cost of Goods Sold", row.cogs]);
					returnData.incomeData.push(["Gross Profit", row.g_prof]);
					returnData.incomeData.push(["space"]);
					returnData.incomeData.push(["Administrative Expenses", row.admin_exp]);
					returnData.incomeData.push(["Other Operating Income/Expenses", row.other_op_exp]);
					returnData.incomeData.push(["PBIT", row.pbit]);
					returnData.incomeData.push(["space"]);
					returnData.incomeData.push(["Finance Expenses", row.fin_exp]);
					returnData.incomeData.push(["Other Finance Income/Expenses", row.other_fin_exp]);
					returnData.incomeData.push(["PBT", row.pbt]);
					returnData.incomeData.push(["space"]);
					returnData.incomeData.push(["Tax Expenses", row.tax_exp]);
					returnData.incomeData.push(["Other Income/Expenses", row.other_inc_exp]);
					returnData.incomeData.push(["Net Income", row.other_inc_exp]);
					returnData.incomeData.push(["space"]);
					returnData.incomeData.push(["Total Comprehensive Income", row.tot_comp_inc]);
					returnData.incomeData.push(["space"]);
					returnData.incomeData.push(["Issued Shares", row.issued_shares]);
					returnData.incomeData.push(["EPS", row.eps * 1_000_000]);
				}
			} else {
				returnData.incomeData[0].push(row.revenue);
				returnData.incomeData[1].push(row.cogs);
				returnData.incomeData[2].push(row.g_prof);
				returnData.incomeData[4].push(row.admin_exp);
				returnData.incomeData[5].push(row.other_op_exp);
				returnData.incomeData[6].push(row.pbit);
				returnData.incomeData[8].push(row.fin_exp);
				returnData.incomeData[9].push(row.other_fin_exp);
				returnData.incomeData[10].push(row.pbt);
				returnData.incomeData[12].push(row.tax_exp);
				returnData.incomeData[13].push(row.other_inc_exp);
				returnData.incomeData[14].push(row.other_inc_exp);
				returnData.incomeData[16].push(row.tot_comp_inc);
				returnData.incomeData[18].push(row.issued_shares);
				returnData.incomeData[19].push(row.eps * 1_000_000);
			}
		});

		if (icStat.length === 1) {
			returnData.incomeData[0].push(0);
			returnData.incomeData[0].push(0);

			returnData.incomeData[1].push(0);
			returnData.incomeData[1].push(0);

			returnData.incomeData[2].push(0);
			returnData.incomeData[2].push(0);

			returnData.incomeData[4].push(0);
			returnData.incomeData[4].push(0);

			returnData.incomeData[5].push(0);
			returnData.incomeData[5].push(0);

			returnData.incomeData[6].push(0);
			returnData.incomeData[6].push(0);

			returnData.incomeData[8].push(0);
			returnData.incomeData[8].push(0);

			returnData.incomeData[9].push(0);
			returnData.incomeData[9].push(0);

			returnData.incomeData[10].push(0);
			returnData.incomeData[10].push(0);

			returnData.incomeData[12].push(0);
			returnData.incomeData[12].push(0);

			returnData.incomeData[13].push(0);
			returnData.incomeData[13].push(0);

			returnData.incomeData[14].push(0);
			returnData.incomeData[14].push(0);

			returnData.incomeData[16].push(0);
			returnData.incomeData[16].push(0);

			returnData.incomeData[18].push(0);
			returnData.incomeData[18].push(0);

			returnData.incomeData[19].push(0);
			returnData.incomeData[19].push(0);
		}

		if (icStat.length === 2) {
			returnData.incomeData[0].push(0);
			returnData.incomeData[1].push(0);
			returnData.incomeData[2].push(0);
			returnData.incomeData[4].push(0);
			returnData.incomeData[5].push(0);
			returnData.incomeData[6].push(0);
			returnData.incomeData[8].push(0);
			returnData.incomeData[9].push(0);
			returnData.incomeData[10].push(0);
			returnData.incomeData[12].push(0);
			returnData.incomeData[13].push(0);
			returnData.incomeData[14].push(0);
			returnData.incomeData[16].push(0);
			returnData.incomeData[18].push(0);
			returnData.incomeData[19].push(0);
		}

		// set cash flow
		const bSheet = balance.slice(0, 3);
		bSheet.sort((a, b) => b.date - a.date);

		bSheet.forEach((row, i) => {
			if (!i) {
				const bYear = Number(prettyDate(row.date).split(" ")[2]);
				returnData.balanceYear = bYear;

				if (isMobile) {
					returnData.balanceData.push(["PPE", row.ppe]);
					returnData.balanceData.push(["Other Nonc. Assets", row.oth_nonc_ass]);
					returnData.balanceData.push(["Total Nonc Assets", row.tot_nonc_ass]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Cash and Bank", row.cce]);
					returnData.balanceData.push(["Inventories", row.inv]);
					returnData.balanceData.push(["Receivables", row.recvbl]);
					returnData.balanceData.push(["Other Current Assets", row.oth_cur_ass]);
					returnData.balanceData.push(["Total Current Assets", row.tot_cur_ass]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Total Assets", row.tot_ass]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Total Equity", row.tot_eq]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Long Term Debt", row.lon_trm_dbt]);
					returnData.balanceData.push(["Other Nonc Liab.", row.oth_nonc_liab]);
					returnData.balanceData.push(["Total Nonc Liab.", row.tot_nonc_liab]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Short Term Debt", row.shr_trm_dbt]);
					returnData.balanceData.push(["Payables", row.payables]);
					returnData.balanceData.push(["Other Current Liab.", row.oth_cur_liab]);
					returnData.balanceData.push(["Total Current Liab.", row.tot_cur_liab]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Total Liab.", row.tot_liab]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Total Equity and Liab.", row.tot_eq_liab]);
				} else {
					returnData.balanceData.push(["Property, Plant, and Equipment", row.ppe]);
					returnData.balanceData.push(["Other Non Current Assets", row.oth_nonc_ass]);
					returnData.balanceData.push(["Total Non Current Assets", row.tot_nonc_ass]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Cash and Cash Equivalents", row.cce]);
					returnData.balanceData.push(["Inventories", row.inv]);
					returnData.balanceData.push(["Receivables", row.recvbl]);
					returnData.balanceData.push(["Other Current Assets", row.oth_cur_ass]);
					returnData.balanceData.push(["Total Current Assets", row.tot_cur_ass]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Total Assets", row.tot_ass]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Total Equity", row.tot_eq]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Long Term Debt", row.lon_trm_dbt]);
					returnData.balanceData.push(["Other Non Current Liabilities", row.oth_nonc_liab]);
					returnData.balanceData.push(["Total Non Current Liabilities", row.tot_nonc_liab]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Short Term Debt", row.shr_trm_dbt]);
					returnData.balanceData.push(["Payables", row.payables]);
					returnData.balanceData.push(["Other Current Liabilities", row.oth_cur_liab]);
					returnData.balanceData.push(["Total Current Liabilities", row.tot_cur_liab]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Total Liabilities", row.tot_liab]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["space"]);
					returnData.balanceData.push(["Total Equity and Liabilities", row.tot_eq_liab]);
				}
			} else {
				returnData.balanceData[0].push(row.ppe);
				returnData.balanceData[1].push(row.oth_nonc_ass);
				returnData.balanceData[2].push(row.tot_nonc_ass);
				returnData.balanceData[4].push(row.cce);
				returnData.balanceData[5].push(row.inv);
				returnData.balanceData[6].push(row.recvbl);
				returnData.balanceData[7].push(row.oth_cur_ass);
				returnData.balanceData[8].push(row.tot_cur_ass);
				returnData.balanceData[10].push(row.tot_ass);
				returnData.balanceData[13].push(row.tot_eq);
				returnData.balanceData[16].push(row.lon_trm_dbt);
				returnData.balanceData[17].push(row.oth_nonc_liab);
				returnData.balanceData[18].push(row.tot_nonc_liab);
				returnData.balanceData[20].push(row.shr_trm_dbt);
				returnData.balanceData[21].push(row.payables);
				returnData.balanceData[22].push(row.oth_cur_liab);
				returnData.balanceData[23].push(row.tot_cur_liab);
				returnData.balanceData[24].push(row.tot_liab);
				returnData.balanceData[27].push(row.tot_eq_liab);
			}
		});

		if (bSheet.length === 1) {
			returnData.balanceData[0].push(0);
			returnData.balanceData[0].push(0);

			returnData.balanceData[1].push(0);
			returnData.balanceData[1].push(0);

			returnData.balanceData[2].push(0);
			returnData.balanceData[2].push(0);

			returnData.balanceData[4].push(0);
			returnData.balanceData[4].push(0);

			returnData.balanceData[5].push(0);
			returnData.balanceData[5].push(0);

			returnData.balanceData[6].push(0);
			returnData.balanceData[6].push(0);

			returnData.balanceData[7].push(0);
			returnData.balanceData[7].push(0);

			returnData.balanceData[8].push(0);
			returnData.balanceData[8].push(0);

			returnData.balanceData[10].push(0);
			returnData.balanceData[10].push(0);

			returnData.balanceData[13].push(0);
			returnData.balanceData[13].push(0);

			returnData.balanceData[16].push(0);
			returnData.balanceData[16].push(0);

			returnData.balanceData[17].push(0);
			returnData.balanceData[17].push(0);

			returnData.balanceData[18].push(0);
			returnData.balanceData[18].push(0);

			returnData.balanceData[20].push(0);
			returnData.balanceData[20].push(0);

			returnData.balanceData[21].push(0);
			returnData.balanceData[21].push(0);

			returnData.balanceData[22].push(0);
			returnData.balanceData[22].push(0);

			returnData.balanceData[23].push(0);
			returnData.balanceData[23].push(0);

			returnData.balanceData[24].push(0);
			returnData.balanceData[24].push(0);

			returnData.balanceData[27].push(0);
			returnData.balanceData[27].push(0);
		}

		if (bSheet.length === 2) {
			returnData.balanceData[0].push(0);
			returnData.balanceData[1].push(0);
			returnData.balanceData[2].push(0);
			returnData.balanceData[4].push(0);
			returnData.balanceData[5].push(0);
			returnData.balanceData[6].push(0);
			returnData.balanceData[7].push(0);
			returnData.balanceData[8].push(0);
			returnData.balanceData[10].push(0);
			returnData.balanceData[13].push(0);
			returnData.balanceData[16].push(0);
			returnData.balanceData[17].push(0);
			returnData.balanceData[18].push(0);
			returnData.balanceData[20].push(0);
			returnData.balanceData[21].push(0);
			returnData.balanceData[22].push(0);
			returnData.balanceData[23].push(0);
			returnData.balanceData[24].push(0);
			returnData.balanceData[27].push(0);
		}

		return returnData;
	};

	const fetchExpandedSymbol = async () => {
		try {
			const req = await fetch("/api/d/market", {
				method: "POST",
				body: JSON.stringify({ symbol: selectedSymbol }),
			});

			// toast.info(req.status.toString());
			// toast.info(req.url);

			const res: GenericResponseWData<NFHelp["ExpandedSymbolReturn"] | undefined> =
				await req.json();

			if (res.data) {
				const temp = JSON.parse(JSON.stringify($expandedStockCacheStore));
				const symbolExpanded = collateSymbol(res.data);

				temp[selectedSymbol] = symbolExpanded;
				expandedStockCacheStore.set(temp);

				await tick();

				expandedSymbol = symbolExpanded;
			}

			expandedLoading = false;
		} catch (ex) {
			// toast.error(String(ex));
			expandedLoading = false;
		}
	};

	const openSheet = () => {
		const isAvailable = $expandedStockCacheStore[selectedSymbol];

		if (isAvailable) {
			expandedLoading = false;
			expandedSymbol = isAvailable;
		} else {
			expandedLoading = true;
			expandedSymbol = initExpandedSymbol;
			fetchExpandedSymbol();
			/*
			const obj: NFHelp["ExpandedSymbolReturn"] = {
				balance: [
					{
						id: 33,
						created_at: "2024-12-30T00:02:23.772112+00:00",
						symbol: "ZABR",
						date: 20231231,
						period: "FY",
						ppe: 4501731000,
						oth_nonc_ass: 20002000,
						tot_nonc_ass: 4521733000,
						cce: 301705000,
						oth_cur_ass: 130812000,
						recvbl: 288203000,
						tot_cur_ass: 1456124000,
						tot_ass: 5977857000,
						tot_eq: 702651000,
						lon_trm_dbt: 0,
						oth_nonc_liab: 154361000,
						tot_nonc_liab: 154361000,
						shr_trm_dbt: 2035375000,
						payables: 3085470000,
						oth_cur_liab: 0,
						tot_cur_liab: 5120845000,
						tot_liab: 5275206000,
						tot_eq_liab: 5977857000,
						entity: "Group",
						exchange: "LuSE",
						inv: 735404000,
						currency: "ZMW",
					},
				],
				cashFlow: [
					{
						id: 32,
						created_at: "2024-12-29T23:52:19.903332+00:00",
						symbol: "ZABR",
						date: 20231231,
						period: "FY",
						op_act: 1137818000,
						inv_act: -1934144000,
						fin_act: 987500000,
						per_cash: 158830000,
						entity: "Group",
						exchange: "LuSE",
						open_bal: -34421000,
						currency: "ZMW",
						capex: -1944940000,
						pref_div_paid: 0,
					},
				],
				fundamentals: [
					{
						id: 7231,
						created_at: "2025-12-09T20:09:57.575762+00:00",
						symbol: "ZABR",
						date: 20251209,
						cfps: 2.08391575091575,
						roe: -0.762257507638927,
						roe_dupont: -0.762257507638928,
						roa: -0.08959749288081,
						roa_dupont: -0.08959749288081,
						navps: 1.28690659340659,
						ent_val: 5555670000,
						current: 0.284352289514719,
						quick: 0.140742397006744,
						roi: 0.0144927536231884,
						beta: -0.136972551029837,
						alpha: -0.164074724221242,
						er: 0.140071452562866,
						fv: 7.98050016794006,
						pe: -7.14285714285714,
						pbv: 5.43940021433115,
						gpm: 0.250357962812323,
						pbitm: -0.106290272321444,
						pbtm: -0.191549476890268,
						npm: -0.128977625457959,
						tax_brd: -0.326661562579751,
						ass_turn: 0.694674696969165,
						eq_mult: 8.50757630744139,
						acp: 25.3317013696743,
						app: 361.77059010033,
						div_yield: 0,
						ytd: 0.0144927536231884,
						exchange: "LuSE",
						net_div: 0,
						price: 7,
						eps: -0.98,
					},
				],
				income: [
					{
						id: 27,
						created_at: "2024-12-29T23:57:05.725095+00:00",
						symbol: "ZABR",
						date: 20231231,
						period: "FY",
						revenue: 4152666000,
						cogs: -3113013000,
						g_prof: 1039653000,
						admin_exp: -581833000,
						other_op_exp: -899208000,
						pbit: -441388000,
						fin_exp: -354085000,
						other_fin_exp: 32000,
						pbt: -795441000,
						tax_exp: 259840000,
						other_inc_exp: 0,
						net_inc: -535601000,
						tot_comp_inc: -535601000,
						eps: -0.98,
						entity: "Group",
						issued_shares: 546000000,
						exchange: "LuSE",
						currency: "ZMW",
					},
				],
			};
			expandedSymbol = collateSymbol(obj);
			*/
		}

		openTrigger = Date.now();
	};

	$effect(() => {
		console.log(expandedSymbol);
	});
</script>

<Head
	title="Market | SBZ Digital"
	ogTitle="Market"
	description="Take a look at neurally aided market data analysis and submit your trade instructions!"
	ogDescription="Take a look at neurally aided market data analysis and submit your trade instructions!"
/>

<div class="flex flex-row items-center justify-between">
	<div class="flex items-center">
		<h1>Market</h1>
		<Tabs.Root bind:value={globalSummarySetting} class="ml-5">
			<Tabs.List>
				<Tabs.Trigger class="cursor-pointer" value="day">Daily</Tabs.Trigger>
				<Tabs.Trigger class="ml-2 cursor-pointer" value="week">Weekly</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>
</div>

<Summary bind:isMobile>
	{#snippet chart()}
		{#if initStocks}
			<div class="loading no-padding mb-4 h-[530px] w-[98%]"></div>

			<div class={`flex w-full flex-${isMobile ? "col" : "row"}`}>
				<div class="flex w-fit flex-row gap-1.5">
					<Label class="loading no-padding text-right">Symbol</Label>
					<AnyCombobox
						handler={handleSelectedSymbol}
						data={{ grouped: [{ title: "Symbol", group: [] }], ungrouped: [] }}
						dataTitle="symbols"
						forceValue="LASI"
						disabled
						loader
					/>
				</div>

				<div class={`m${isMobile ? "t" : "l"}-5 flex w-fit flex-row gap-1.5`}>
					<Label class="loading no-padding text-right">Metric</Label>
					<AnyCombobox
						handler={handleSelectedKey}
						data={{ grouped: [{ title: "Symbol", group: symbolMetrics }], ungrouped: [] }}
						dataTitle="metrics"
						forceValue="market_price"
						disabled
						loader
					/>
				</div>
			</div>
		{:else if !symbolsPicker}
			<p>No data.</p>
		{:else}
			<StockChart key={selectedKey} {stockData} symbol={selectedSymbol} bind:isMobile />

			<div class={`flex w-full flex-${isMobile ? "col" : "row"}`}>
				<div class="flex w-fit flex-row gap-1.5">
					<Label class="text-right">Symbol</Label>
					<AnyCombobox
						handler={handleSelectedSymbol}
						data={{ grouped: [{ title: "Symbol", group: symbolsPicker }], ungrouped: [] }}
						dataTitle="symbols"
						forceValue="LASI"
					/>
				</div>

				<div class={`m${isMobile ? "t" : "l"}-5 flex w-fit flex-row gap-1.5`}>
					<Label class="text-right">Metric</Label>
					<AnyCombobox
						handler={handleSelectedKey}
						data={{ grouped: [{ title: "Symbol", group: symbolMetrics }], ungrouped: [] }}
						dataTitle="metrics"
						forceValue="market_price"
					/>
				</div>

				{#if selectedSymbol !== "LASI"}
					<Button class={`m${isMobile ? "t" : "l"}-5`} variant="outline" onclick={openSheet}
						>Expand<ChevronRight class="h-4 w-4" /></Button
					>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#snippet text()}
		{#if initStocks}
			<h3 class="loading no-padding w-fit max-w-[100%]">Lorem ipsum dolor sit amet amet</h3>
			<p class="loading no-padding mt-5 w-fit">
				Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet
				amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor
				sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum
				dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem
				ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet,
				Lorem ipsum dolor sit amet amet
			</p>

			<p class="loading no-padding mt-5 w-fit max-w-[100%]">
				Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet
				amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor
				sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum
				dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet, Lorem
				ipsum dolor sit amet amet, Lorem ipsum dolor sit amet amet
			</p>
		{:else if !stockSummary}
			<span></span>
		{:else}
			<!-- title -->
			{#if globalSummarySetting === "day"}
				<h3>Daily Market Summary: {prettyDate(stockSummary.df)}</h3>
			{:else}
				<h3>
					Weekly Market Summary: {prettyDate(stockSummary.di)} - {prettyDate(stockSummary.df)}
				</h3>
			{/if}

			<!-- Market Summary -->
			<p class="mt-5">
				{#each stockSummary.lasiSummary.split("||") as str}
					{#if str[0] === "?"}
						<span class="num">{str.replace("?", "")}</span>
					{:else}
						<span>{str}</span>
					{/if}
				{/each}
			</p>

			<!-- Gainers -->
			<table class="summary-table mt-5 table-fixed">
				<thead>
					<tr>
						<th colspan="4">Gainers</th>
					</tr>
					<tr>
						<th>Symbol</th>
						<th>Price</th>
						<th>Change</th>
						<th>% Change</th>
					</tr>
				</thead>
				<tbody>
					{#each stockSummary.deltaArrTop as stock}
						<tr>
							<td class="text-center">{mrMateSymbols(stock.symbol)}</td>
							<td class="num text-center">{numParse(stock.vf.toFixed(2))}</td>
							<td class="num text-center">{numParse(stock.diff.toFixed(2))}</td>
							<td class="text-center"
								><span class={stock.diff > 0 ? "gren num" : "rd num"}
									>{percentageHandler(stock.diff / stock.vi)}</span
								></td
							>
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- Decliners -->
			<table class="summary-table mt-5 table-fixed">
				<thead>
					<tr>
						<th colspan="4">Decliners</th>
					</tr>
					<tr>
						<th>Symbol</th>
						<th>Price</th>
						<th>Change</th>
						<th>% Change</th>
					</tr>
				</thead>
				<tbody>
					{#each stockSummary.deltaArrBottom as stock}
						<tr>
							<td class="text-center">{mrMateSymbols(stock.symbol)}</td>
							<td class="num text-center">{numParse(stock.vf.toFixed(2))}</td>
							<td class="num text-center">{numParse(stock.diff.toFixed(2))}</td>
							<td class="text-center"
								><span class={stock.diff > 0 ? "gren num" : "rd num"}
									>{percentageHandler(stock.diff / stock.vi)}</span
								></td
							>
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- REIZ USD -->
			<p class="mt-5">
				{#each stockSummary.reizSummary.split("||") as str}
					{#if str[0] === "?"}
						<span class="num">{str.replace("?", "")}</span>
					{:else}
						<span>{str}</span>
					{/if}
				{/each}
			</p>
		{/if}
	{/snippet}
</Summary>

{#if isMobile}
	<AnyDrawer
		title={`${selectedSymbol} Analysis`}
		description=""
		{openTrigger}
		width={undefined}
		big
		wImg={{ src: `${data.PHOTO_BASE}/img/${selectedSymbol}.png`, alt: selectedSymbol }}
	>
		{#snippet main()}
			<div class="holder">
				{#if expandedLoading}
					<h2 class="loading no-padding mb-5 w-fit">Market Data</h2>
					<div class="flex flex-row">
						<!-- Price Information -->
						<table class="loading no-padding w-full">
							<thead>
								<tr><th colspan="6">Price Information</th></tr>
								<tr>
									<th>Price</th>
									<th>Change</th>
									<th>% Change</th>
									<th>YTD</th>
									<th>Trail 52 High</th>
									<th>Trail 52 Low</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center">{numParse(expandedSymbol.price.price.toFixed(2))}</td>
									<td class="num text-center"
										>{!expandedSymbol.price.change
											? "-"
											: numParse(expandedSymbol.price.change.toFixed(2))}</td
									>
									<td class="text-center"
										><span class={undefined}
											>{!expandedSymbol.price.percentageChange
												? "-"
												: percentageHandler(expandedSymbol.price.percentageChange)}</span
										></td
									>
									<td class="text-center"
										><span class={undefined}
											>{!expandedSymbol.price.ytd
												? "-"
												: percentageHandler(expandedSymbol.price.ytd)}</span
										></td
									>
									<td class="num text-center"
										>{numParse(expandedSymbol.price.trail52H.toFixed(2))}</td
									>
									<td class="num text-center"
										>{numParse(expandedSymbol.price.trail52L.toFixed(2))}</td
									>
								</tr>
							</tbody>
						</table>

						<!-- Bid Ask -->
						<table class="loading no-padding ml-10 table-fixed">
							<thead>
								<tr><th colspan="4">Bid/Ask</th></tr>
								<tr>
									<th>Bid Vol</th>
									<th>Bid</th>
									<th>Ask</th>
									<th>Ask Vol</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center"
										>{!expandedSymbol.bidask.bidVol
											? "-"
											: numParse(expandedSymbol.bidask.bidVol)}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.bid
											? "-"
											: numParse(expandedSymbol.bidask.bid.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.ask
											? "-"
											: numParse(expandedSymbol.bidask.ask.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.askVol
											? "-"
											: numParse(expandedSymbol.bidask.askVol)}</td
									>
								</tr>
							</tbody>
						</table>

						<h3 class="loading no-padding ml-10 text-center">
							Recommendation<br /><span>{expandedSymbol.sentiment.value}</span>
						</h3>
					</div>

					<div class="mt-10 flex flex-row items-center">
						<!-- Trading Activity -->
						<table class="loading no-padding table-fixed">
							<thead>
								<tr><th colspan="3">Trading Activity</th></tr>
								<tr>
									<th>Volume</th>
									<th>Turnover</th>
									<th>Turnover (USD)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center"
										>{!expandedSymbol.trades.vol ? "-" : numParse(expandedSymbol.trades.vol)}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.trades.turn
											? "-"
											: numParse(expandedSymbol.trades.turn.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.trades.turnUsd
											? "-"
											: numParse(expandedSymbol.trades.turnUsd.toFixed(2))}</td
									>
								</tr>
							</tbody>
						</table>

						<!-- Price Information -->
						<table class="loading no-padding ml-10 table-fixed">
							<thead>
								<tr><th colspan="2">Market Cap</th></tr>
								<tr>
									<th>ZMW</th>
									<th>USD</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center">{numParse(expandedSymbol.mcap.zmw.toFixed(2))}</td>
									<td class="num text-center">{numParse(expandedSymbol.mcap.usd.toFixed(2))}</td>
								</tr>
							</tbody>
						</table>
					</div>
				{:else if expandedSymbol.balanceYear === 983}
					<p>No data.</p>
				{:else}
					<h2 class="mb-5">Market Data</h2>
					<div class="flex flex-col items-center">
						<!-- Price Information -->
						<table class="summary-table w-full">
							<thead>
								<tr><th colspan="6">Price Information</th></tr>
								<tr>
									<th>Price</th>
									<th>Change</th>
									<th>% Change</th>
									<th>YTD</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center">{numParse(expandedSymbol.price.price.toFixed(2))}</td>
									<td class="num text-center"
										>{!expandedSymbol.price.change
											? "-"
											: numParse(expandedSymbol.price.change.toFixed(2))}</td
									>
									<td class="text-center"
										><span
											class={!expandedSymbol.price.change
												? undefined
												: expandedSymbol.price.change > 0
													? "gren num"
													: "rd num"}
											>{!expandedSymbol.price.percentageChange
												? "-"
												: percentageHandler(expandedSymbol.price.percentageChange)}</span
										></td
									>
									<td class="text-center"
										><span
											class={!expandedSymbol.price.ytd
												? undefined
												: expandedSymbol.price.ytd > 0
													? "gren num"
													: "rd num"}
											>{!expandedSymbol.price.ytd
												? "-"
												: percentageHandler(expandedSymbol.price.ytd)}</span
										></td
									>
								</tr>
							</tbody>
							<thead>
								<tr>
									<th colspan="2">52 High</th>
									<th colspan="2">52 Low</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td colspan="2" class="num text-center"
										>{numParse(expandedSymbol.price.trail52H.toFixed(2))}</td
									>
									<td colspan="2" class="num text-center"
										>{numParse(expandedSymbol.price.trail52L.toFixed(2))}</td
									>
								</tr>
							</tbody>
						</table>

						<!-- Bid Ask -->
						<table class="summary-table mt-10 w-full">
							<thead>
								<tr><th colspan="4">Bid/Ask</th></tr>
								<tr>
									<th>Bid Vol</th>
									<th>Bid</th>
									<th>Ask</th>
									<th>Ask Vol</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center"
										>{!expandedSymbol.bidask.bidVol
											? "-"
											: numParse(expandedSymbol.bidask.bidVol)}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.bid
											? "-"
											: numParse(expandedSymbol.bidask.bid.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.ask
											? "-"
											: numParse(expandedSymbol.bidask.ask.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.askVol
											? "-"
											: numParse(expandedSymbol.bidask.askVol)}</td
									>
								</tr>
							</tbody>
						</table>

						<!-- Trading Activity -->
						<table class="summary-table mt-10 w-full">
							<thead>
								<tr><th colspan="3">Trading Activity</th></tr>
								<tr>
									<th>Volume</th>
									<th>Turnover</th>
									<th>Turnover (USD)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center"
										>{!expandedSymbol.trades.vol ? "-" : numParse(expandedSymbol.trades.vol)}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.trades.turn
											? "-"
											: numParse(expandedSymbol.trades.turn.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.trades.turnUsd
											? "-"
											: numParse(expandedSymbol.trades.turnUsd.toFixed(2))}</td
									>
								</tr>
							</tbody>
						</table>

						<!-- Market Cap -->
						<table class="summary-table mt-10 w-full">
							<thead>
								<tr><th colspan="2">Market Cap</th></tr>
								<tr>
									<th>ZMW</th>
									<th>USD</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center">{numParse(expandedSymbol.mcap.zmw.toFixed(2))}</td>
									<td class="num text-center">{numParse(expandedSymbol.mcap.usd.toFixed(2))}</td>
								</tr>
							</tbody>
						</table>

						<h3 class="mt-10 text-center">
							Recommendation<br /><span class={expandedSymbol.sentiment.class}
								>{expandedSymbol.sentiment.value}</span
							>
						</h3>
					</div>

					<!-- Cash Flow -->
					{#if expandedSymbol.cashFlowYear !== 983}
						<h2 class="mt-14 mb-5">Cash Flow Statements</h2>
						<p class="mb-4 text-sm text-muted-foreground">In {expandedSymbol.currency} millions.</p>
						<table class="summary-table table-fixed">
							<thead>
								<tr>
									<th></th>
									<th class="w-[150px]">{expandedSymbol.cashFlowYear}</th>
									<th class="w-[150px]">{expandedSymbol.cashFlowYear - 1}</th>
									<th class="w-[150px]">{expandedSymbol.cashFlowYear - 2}</th>
								</tr>
							</thead>
							<tbody>
								{#each expandedSymbol.cashFlowData as row}
									{#if row[0] === "space"}
										<tr>
											<td colspan="4" class="text-[transparent] select-none">space</td>
										</tr>
									{:else}
										<tr>
											<td class="whitespace-nowrap">{row[0]}</td>
											<td class="num text-center"
												>{!row[1] ? "-" : numParse(((row[1] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[2] ? "-" : numParse(((row[2] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[3] ? "-" : numParse(((row[3] as number) / 1_000_000).toFixed(2))}</td
											>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					{/if}

					<!-- Income -->
					{#if expandedSymbol.incomeYear !== 983}
						<h2 class="mt-14 mb-5">Income Statements</h2>
						<p class="mb-4 text-sm text-muted-foreground">In {expandedSymbol.currency} millions.</p>
						<table class="summary-table table-fixed">
							<thead>
								<tr>
									<th></th>
									<th class="w-[150px]">{expandedSymbol.incomeYear}</th>
									<th class="w-[150px]">{expandedSymbol.incomeYear - 1}</th>
									<th class="w-[150px]">{expandedSymbol.incomeYear - 2}</th>
								</tr>
							</thead>
							<tbody>
								{#each expandedSymbol.incomeData as row}
									{#if row[0] === "space"}
										<tr>
											<td colspan="4" class="text-[transparent] select-none">space</td>
										</tr>
									{:else}
										<tr>
											<td class="whitespace-nowrap">{row[0]}</td>
											<td class="num text-center"
												>{!row[1] ? "-" : numParse(((row[1] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[2] ? "-" : numParse(((row[2] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[3] ? "-" : numParse(((row[3] as number) / 1_000_000).toFixed(2))}</td
											>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					{/if}

					<!-- Balance Sheets -->
					{#if expandedSymbol.balanceYear !== 983}
						<h2 class="mt-14 mb-5">Balance Sheets</h2>
						<p class="mb-4 text-sm text-muted-foreground">In {expandedSymbol.currency} millions.</p>
						<table class="summary-table table-fixed">
							<thead>
								<tr>
									<th></th>
									<th class="w-[150px]">{expandedSymbol.balanceYear}</th>
									<th class="w-[150px]">{expandedSymbol.balanceYear - 1}</th>
									<th class="w-[150px]">{expandedSymbol.balanceYear - 2}</th>
								</tr>
							</thead>
							<tbody>
								{#each expandedSymbol.balanceData as row}
									{#if row[0] === "space"}
										<tr>
											<td colspan="4" class="text-[transparent] select-none">space</td>
										</tr>
									{:else}
										<tr>
											<td class="whitespace-nowrap">{row[0]}</td>
											<td class="num text-center"
												>{!row[1] ? "-" : numParse(((row[1] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[2] ? "-" : numParse(((row[2] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[3] ? "-" : numParse(((row[3] as number) / 1_000_000).toFixed(2))}</td
											>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					{/if}
				{/if}
			</div>
		{/snippet}

		{#snippet actionButton()}
			<span></span>
		{/snippet}
	</AnyDrawer>
{:else}
	<AnySheet title={`${selectedSymbol} Analysis`} description="" {openTrigger} width={undefined} big>
		{#snippet main()}
			<div class="holder">
				{#if expandedLoading}
					<h2 class="loading no-padding mb-5 w-fit">Market Data</h2>
					<div class="flex flex-row">
						<!-- Price Information -->
						<table class="loading no-padding table-fixed">
							<thead>
								<tr><th colspan="6">Price Information</th></tr>
								<tr>
									<th>Price</th>
									<th>Change</th>
									<th>% Change</th>
									<th>YTD</th>
									<th>Trail 52 High</th>
									<th>Trail 52 Low</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center">{numParse(expandedSymbol.price.price.toFixed(2))}</td>
									<td class="num text-center"
										>{!expandedSymbol.price.change
											? "-"
											: numParse(expandedSymbol.price.change.toFixed(2))}</td
									>
									<td class="text-center"
										><span class={undefined}
											>{!expandedSymbol.price.percentageChange
												? "-"
												: percentageHandler(expandedSymbol.price.percentageChange)}</span
										></td
									>
									<td class="text-center"
										><span class={undefined}
											>{!expandedSymbol.price.ytd
												? "-"
												: percentageHandler(expandedSymbol.price.ytd)}</span
										></td
									>
									<td class="num text-center"
										>{numParse(expandedSymbol.price.trail52H.toFixed(2))}</td
									>
									<td class="num text-center"
										>{numParse(expandedSymbol.price.trail52L.toFixed(2))}</td
									>
								</tr>
							</tbody>
						</table>

						<!-- Bid Ask -->
						<table class="loading no-padding ml-10 table-fixed">
							<thead>
								<tr><th colspan="4">Bid/Ask</th></tr>
								<tr>
									<th>Bid Vol</th>
									<th>Bid</th>
									<th>Ask</th>
									<th>Ask Vol</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center"
										>{!expandedSymbol.bidask.bidVol
											? "-"
											: numParse(expandedSymbol.bidask.bidVol)}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.bid
											? "-"
											: numParse(expandedSymbol.bidask.bid.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.ask
											? "-"
											: numParse(expandedSymbol.bidask.ask.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.askVol
											? "-"
											: numParse(expandedSymbol.bidask.askVol)}</td
									>
								</tr>
							</tbody>
						</table>

						<h3 class="loading no-padding ml-10 text-center">
							Recommendation<br /><span>{expandedSymbol.sentiment.value}</span>
						</h3>
					</div>

					<div class="mt-10 flex flex-row items-center">
						<!-- Trading Activity -->
						<table class="loading no-padding table-fixed">
							<thead>
								<tr><th colspan="3">Trading Activity</th></tr>
								<tr>
									<th>Volume</th>
									<th>Turnover</th>
									<th>Turnover (USD)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center"
										>{!expandedSymbol.trades.vol ? "-" : numParse(expandedSymbol.trades.vol)}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.trades.turn
											? "-"
											: numParse(expandedSymbol.trades.turn.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.trades.turnUsd
											? "-"
											: numParse(expandedSymbol.trades.turnUsd.toFixed(2))}</td
									>
								</tr>
							</tbody>
						</table>

						<!-- Price Information -->
						<table class="loading no-padding ml-10 table-fixed">
							<thead>
								<tr><th colspan="2">Market Cap</th></tr>
								<tr>
									<th>ZMW</th>
									<th>USD</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center">{numParse(expandedSymbol.mcap.zmw.toFixed(2))}</td>
									<td class="num text-center">{numParse(expandedSymbol.mcap.usd.toFixed(2))}</td>
								</tr>
							</tbody>
						</table>
					</div>
				{:else if expandedSymbol.balanceYear === 983}
					<p>No data.</p>
				{:else}
					<h2 class="mb-5">Market Data</h2>
					<div class="flex flex-row">
						<!-- Price Information -->
						<table class="summary-table table-fixed">
							<thead>
								<tr><th colspan="6">Price Information</th></tr>
								<tr>
									<th>Price</th>
									<th>Change</th>
									<th>% Change</th>
									<th>YTD</th>
									<th>Trail 52 High</th>
									<th>Trail 52 Low</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center">{numParse(expandedSymbol.price.price.toFixed(2))}</td>
									<td class="num text-center"
										>{!expandedSymbol.price.change
											? "-"
											: numParse(expandedSymbol.price.change.toFixed(2))}</td
									>
									<td class="text-center"
										><span
											class={!expandedSymbol.price.change
												? undefined
												: expandedSymbol.price.change > 0
													? "gren num"
													: "rd num"}
											>{!expandedSymbol.price.percentageChange
												? "-"
												: percentageHandler(expandedSymbol.price.percentageChange)}</span
										></td
									>
									<td class="text-center"
										><span
											class={!expandedSymbol.price.ytd
												? undefined
												: expandedSymbol.price.ytd > 0
													? "gren num"
													: "rd num"}
											>{!expandedSymbol.price.ytd
												? "-"
												: percentageHandler(expandedSymbol.price.ytd)}</span
										></td
									>
									<td class="num text-center"
										>{numParse(expandedSymbol.price.trail52H.toFixed(2))}</td
									>
									<td class="num text-center"
										>{numParse(expandedSymbol.price.trail52L.toFixed(2))}</td
									>
								</tr>
							</tbody>
						</table>

						<!-- Bid Ask -->
						<table class="summary-table ml-10 table-fixed">
							<thead>
								<tr><th colspan="4">Bid/Ask</th></tr>
								<tr>
									<th>Bid Vol</th>
									<th>Bid</th>
									<th>Ask</th>
									<th>Ask Vol</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center"
										>{!expandedSymbol.bidask.bidVol
											? "-"
											: numParse(expandedSymbol.bidask.bidVol)}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.bid
											? "-"
											: numParse(expandedSymbol.bidask.bid.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.ask
											? "-"
											: numParse(expandedSymbol.bidask.ask.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.bidask.askVol
											? "-"
											: numParse(expandedSymbol.bidask.askVol)}</td
									>
								</tr>
							</tbody>
						</table>

						<h3 class="ml-10 text-center">
							Recommendation<br /><span class={expandedSymbol.sentiment.class}
								>{expandedSymbol.sentiment.value}</span
							>
						</h3>
					</div>

					<div class="mt-10 flex flex-row items-center">
						<!-- Trading Activity -->
						<table class="summary-table table-fixed">
							<thead>
								<tr><th colspan="3">Trading Activity</th></tr>
								<tr>
									<th>Volume</th>
									<th>Turnover</th>
									<th>Turnover (USD)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center"
										>{!expandedSymbol.trades.vol ? "-" : numParse(expandedSymbol.trades.vol)}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.trades.turn
											? "-"
											: numParse(expandedSymbol.trades.turn.toFixed(2))}</td
									>
									<td class="num text-center"
										>{!expandedSymbol.trades.turnUsd
											? "-"
											: numParse(expandedSymbol.trades.turnUsd.toFixed(2))}</td
									>
								</tr>
							</tbody>
						</table>

						<!-- Market Cap -->
						<table class="summary-table ml-10 table-fixed">
							<thead>
								<tr><th colspan="2">Market Cap</th></tr>
								<tr>
									<th>ZMW</th>
									<th>USD</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="num text-center">{numParse(expandedSymbol.mcap.zmw.toFixed(2))}</td>
									<td class="num text-center">{numParse(expandedSymbol.mcap.usd.toFixed(2))}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<!-- Cash Flow -->
					{#if expandedSymbol.cashFlowYear !== 983}
						<h2 class="mt-14 mb-5">Cash Flow Statements</h2>
						<p class="mb-4 text-sm text-muted-foreground">In {expandedSymbol.currency} millions.</p>
						<table class="summary-table table-fixed">
							<thead>
								<tr>
									<th></th>
									<th class="w-[150px]">{expandedSymbol.cashFlowYear}</th>
									<th class="w-[150px]">{expandedSymbol.cashFlowYear - 1}</th>
									<th class="w-[150px]">{expandedSymbol.cashFlowYear - 2}</th>
								</tr>
							</thead>
							<tbody>
								{#each expandedSymbol.cashFlowData as row}
									{#if row[0] === "space"}
										<tr>
											<td colspan="4" class="text-[transparent] select-none">space</td>
										</tr>
									{:else}
										<tr>
											<td class="whitespace-nowrap">{row[0]}</td>
											<td class="num text-center"
												>{!row[1] ? "-" : numParse(((row[1] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[2] ? "-" : numParse(((row[2] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[3] ? "-" : numParse(((row[3] as number) / 1_000_000).toFixed(2))}</td
											>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					{/if}

					<!-- Income -->
					{#if expandedSymbol.incomeYear !== 983}
						<h2 class="mt-14 mb-5">Income Statements</h2>
						<p class="mb-4 text-sm text-muted-foreground">In {expandedSymbol.currency} millions.</p>
						<table class="summary-table table-fixed">
							<thead>
								<tr>
									<th></th>
									<th class="w-[150px]">{expandedSymbol.incomeYear}</th>
									<th class="w-[150px]">{expandedSymbol.incomeYear - 1}</th>
									<th class="w-[150px]">{expandedSymbol.incomeYear - 2}</th>
								</tr>
							</thead>
							<tbody>
								{#each expandedSymbol.incomeData as row}
									{#if row[0] === "space"}
										<tr>
											<td colspan="4" class="text-[transparent] select-none">space</td>
										</tr>
									{:else}
										<tr>
											<td class="whitespace-nowrap">{row[0]}</td>
											<td class="num text-center"
												>{!row[1] ? "-" : numParse(((row[1] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[2] ? "-" : numParse(((row[2] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[3] ? "-" : numParse(((row[3] as number) / 1_000_000).toFixed(2))}</td
											>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					{/if}

					<!-- Balance Sheets -->
					{#if expandedSymbol.balanceYear !== 983}
						<h2 class="mt-14 mb-5">Balance Sheets</h2>
						<p class="mb-4 text-sm text-muted-foreground">In {expandedSymbol.currency} millions.</p>
						<table class="summary-table table-fixed">
							<thead>
								<tr>
									<th></th>
									<th class="w-[150px]">{expandedSymbol.balanceYear}</th>
									<th class="w-[150px]">{expandedSymbol.balanceYear - 1}</th>
									<th class="w-[150px]">{expandedSymbol.balanceYear - 2}</th>
								</tr>
							</thead>
							<tbody>
								{#each expandedSymbol.balanceData as row}
									{#if row[0] === "space"}
										<tr>
											<td colspan="4" class="text-[transparent] select-none">space</td>
										</tr>
									{:else}
										<tr>
											<td class="whitespace-nowrap">{row[0]}</td>
											<td class="num text-center"
												>{!row[1] ? "-" : numParse(((row[1] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[2] ? "-" : numParse(((row[2] as number) / 1_000_000).toFixed(2))}</td
											>
											<td class="num text-center"
												>{!row[3] ? "-" : numParse(((row[3] as number) / 1_000_000).toFixed(2))}</td
											>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					{/if}
				{/if}
			</div>
		{/snippet}

		{#snippet actionButton()}
			<span></span>
		{/snippet}
	</AnySheet>
{/if}

<style lang="scss">
	.summary-table {
		border: 1px solid var(--shadow);

		th,
		td {
			padding: 5px 10px;
		}

		tbody tr:nth-child(odd) {
			background-color: var(--muted);
		}
	}

	.holder {
		display: flex;
		flex-direction: column;
		height: fit-content;
		width: 100%;
		position: relative;
	}

	.orng {
		color: #fc8403;
	}

	.blu {
		color: #037ffc;
	}

	@media screen and (max-width: 767px) {
		.holder {
			border-radius: 1px solid red;
		}

		.summary-table {
			&* {
				font-size: 0.9em;
			}
		}
	}
</style>
