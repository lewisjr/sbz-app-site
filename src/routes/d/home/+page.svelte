<script lang="ts">
	import { numParse } from "@cerebrusinc/qol";
	import type { PageProps } from "./$types";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { prettyDate, percentageHandler, mrMateSymbols, chunkArray } from "$lib/utils";

	import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "@lucide/svelte";
	import { toast } from "svelte-sonner";

	import type { GetPortfolioData, NFHelp, Types } from "$lib/types";

	let { data }: PageProps = $props();

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

	const genPortfolio = (rawData: GetPortfolioData): ClientTradeHistory => {
		const _genMatched = (matchedData: GetPortfolioData["matched"]) => {
			if (!matchedData.length) return undefined;

			const luseId = data.luseId;

			let tradesRaw = matchedData.filter((item) => item.luse_id === luseId);

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

					symbol = symbol + trade.trade_date;

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

			const luseId = data.luseId;

			const ordersRaw = screenData.filter((item) => item.luse_id === luseId);

			let currDate: number = ordersRaw[0].date;

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
			100,
		);
		const portfolioUsd: Portfolio[][] = chunkArray<Portfolio>(
			Object.values(portfolioCodexUsd)
				.filter((item) => item.value)
				.sort((a, b) => a.symbol.localeCompare(b.symbol)),
			100,
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

	let portfolio = $derived.by(() => {
		return genPortfolio(data.portfolio);
	});
</script>

<div class="flex flex-row items-center justify-between">
	<h3>Hi <u>{data.names.split(" ")[0]}</u>!</h3>
	<p class="text-[0.9em] italic opacity-70">
		<span class="num"
			>{data.luseId}{data.isLocal ? "L" : "F"}{data.accountType.toLowerCase() === "institution"
				? "C"
				: "I"}</span
		><span class="mx-1">•</span>{toTitleCase(data.accountType)}
	</p>
</div>

<p class="mt-5 text-[0.8em] opacity-70">Current Portfolio Value</p>
<h1 class="num -mb-2">ZMW {numParse(data.overallPfolio)}</h1>

<p
	class={data.pDelta > 0
		? "gren flex flex-row items-center"
		: data.pDelta === 0
			? "flex flex-row items-center"
			: "rd flex flex-row items-center"}
>
	{#if data.pDelta === 0}
		<Minus class="h-3 w-3" />
	{:else if data.pDelta < 0}
		<TrendingDown class="h-3 w-3" />{:else}<TrendingUp class="h-3 w-3" />
	{/if}<span class="num ml-1 text-[0.9em]"
		>{numParse(percentageHandler(data.pDelta).replace("%", ""))}%</span
	>
</p>
<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
	Please note that the above value includes all USD holdings converted at the <i>Bank of Zambia</i>
	average buy rate of <span class="num">{numParse(data.portfolio.fxUsd.buy.toFixed(2))}</span> on {prettyDate(
		data.portfolio.fxUsd.date,
	)}
</p>

<table class="summary-table mt-5 w-full">
	<thead>
		<tr>
			<th colspan="5">Kwacha Holdings: <span>{numParse(data.portfolioValueZMW)}</span></th>
		</tr>
		<tr>
			<th>Stock</th>
			<th>Price</th>
			<th>Qty</th>
			<th>Value</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each portfolio.portfolioZmw[0] as entry}
			<tr>
				<td class="text-center">{entry.symbol}</td>
				<td class="num text-center">{numParse(entry.price.toFixed(2))}</td>
				<td class="num text-center">{numParse(entry.volume)}</td>
				<td class="num text-center">{numParse(entry.value.toFixed(2))}</td>
				<td class="text-center"
					><span
						class={data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta > 0
							? "gren"
							: data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta < 0
								? "rd"
								: undefined}
						>{#if data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta > 0}
							<ArrowUp class="h-4 w-4" />
						{:else if data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta < 0}
							<ArrowDown class="h-4 w-4" />
						{:else}
							<Minus class="h-4 w-4" />
						{/if}</span
					></td
				>
			</tr>
		{/each}
	</tbody>
</table>
<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
	You invested a total of <span class="num">{numParse(data.investmentValueZMW.toFixed(2))}</span>
	into your kwacha holdings. The above and below values are as at {prettyDate(
		data.portfolio.dmr[0].date,
	)}.
</p>

<table class="summary-table mt-5 w-full">
	<thead>
		<tr>
			<th colspan="5"
				>Dollar Holdings: <span class="num">{numParse(data.portfolioValueUSD.toFixed(2))}</span></th
			>
		</tr>
		<tr>
			<th>Stock</th>
			<th>Price</th>
			<th>Qty</th>
			<th>Value</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each portfolio.portfolioUsd[0] as entry}
			<tr>
				<td class="text-center">{entry.symbol}</td>
				<td class="num text-center">{numParse(entry.price.toFixed(2))}</td>
				<td class="num text-center">{numParse(entry.volume)}</td>
				<td class="num text-center">{numParse(entry.value.toFixed(2))}</td>
				<td class="text-center"
					><span
						class={data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta > 0
							? "gren"
							: data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta < 0
								? "rd"
								: undefined}
						>{#if data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta > 0}
							<ArrowUp class="h-4 w-4" />
						{:else if data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta < 0}
							<ArrowDown class="h-4 w-4" />
						{:else}
							<Minus class="h-4 w-4" />
						{/if}</span
					></td
				>
			</tr>
		{/each}
	</tbody>
</table>
<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
	You invested a total of <span class="num"
		>{numParse(data.investmentValueUSD.toFixed(2))} (K {numParse(
			(data.investmentValueUSD * data.portfolio.fxUsd.buy).toFixed(2),
		)})</span
	>
	into your dollar holdings. Your portfolio has an estimated kwacha value of
	<span class="num"
		>{numParse((data.portfolioValueUSD / data.portfolio.fxUsd.sell).toFixed(2))}</span
	>
	at a <i>Bank of Zambia</i> average sell rate of
	<span class="num">{numParse(data.portfolio.fxUsd.sell.toFixed(2))}</span>.
</p>

<style lang="scss">
	h1 {
		font-size: 1.6em !important;
	}

	.summary-table {
		//border: 1px solid var(--shadow);

		th,
		td {
			padding: 5px 10px;
		}

		tbody tr:nth-child(odd) {
			background-color: var(--muted);
		}
	}

	@media screen and (max-width: 767px) {
		.holder {
			border-radius: 1px solid red;
		}

		.summary-table {
			&* {
				font-size: 0.8em;
			}
		}
	}
</style>
