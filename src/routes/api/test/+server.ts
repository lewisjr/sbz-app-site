import { json } from "@sveltejs/kit";
import { DEV } from "$env/static/private";

import dbs from "$lib/server/db";

const IS_DEV = DEV === "y";

import { scourgeOfInvestor } from "$lib/server/jwt";
import { redirect } from "@sveltejs/kit";
import { percentageHandler, print, chunkArray, mrMateSymbols, prettyDate } from "$lib/utils";

import type {
	NFdb,
	SBZdb,
	ApexDataPresets,
	GetPortfolioData,
	Types,
	NFHelp,
	PortfolioStandards,
} from "$lib/types";
import { numParse } from "@cerebrusinc/qol";
import { toTitleCase } from "@cerebrusinc/fstring";
import notif from "$lib/server/email/index.js";
import templates from "$lib/server/email/templates.js";

const genQuickStats = (pdata: GetPortfolioData): PortfolioStandards["QuickStats"] => {
	let portfolioValueZMW: number = 0;
	let portfolioValueUSD: number = 0;

	let investmentValueZMW: number = 0;
	let investmentValueUSD: number = 0;

	// ? overall Portfolio calcs
	pdata.settled.forEach((cn) => {
		if (cn.currency.toLowerCase() === "usd") {
			const currentPrice = pdata.dmr.find((item) => item.symbol === cn.symbol);

			if (cn.side === "buy") {
				if (currentPrice) portfolioValueUSD += cn.qty * currentPrice.market_price;
				investmentValueUSD += cn.value;
			} else {
				if (currentPrice) portfolioValueUSD -= cn.qty * currentPrice.market_price;
				investmentValueUSD -= cn.value;
			}
		} else {
			const currentPrice = pdata.dmr.find((item) => item.symbol === cn.symbol);

			if (cn.side === "buy") {
				if (currentPrice) portfolioValueZMW += cn.qty * currentPrice.market_price;
				investmentValueZMW += cn.value;
			} else {
				if (currentPrice) portfolioValueZMW -= cn.qty * currentPrice.market_price;
				investmentValueZMW -= cn.value;
			}
		}
	});

	const fxUsd = pdata["fxUsd"].buy;

	portfolioValueUSD = portfolioValueUSD * fxUsd;
	investmentValueUSD = investmentValueUSD * fxUsd;

	const overallPfolio = portfolioValueZMW + portfolioValueUSD;
	const overalInv = investmentValueZMW + investmentValueUSD;

	if (investmentValueUSD < 0) investmentValueUSD = 0;
	if (investmentValueZMW < 0) investmentValueZMW = 0;

	/*
	console.log({
		overallPfolio,
		overalInv,
		pDelta: (overallPfolio - overalInv) / overalInv,
	});
	*/

	return {
		portfolioValueUSD,
		portfolioValueZMW,
		investmentValueUSD,
		investmentValueZMW,
		overallPfolio,
		overalInv,
		pDelta: (overallPfolio - overalInv) / overalInv,
	};
};

const genAnalysis = (
	cns: PortfolioStandards["CN"],
	firstDmr: PortfolioStandards["DMR"],
	currentDmr: PortfolioStandards["DMR"],
	fxUsd: { buy: { init: number; current: number }; sell: { init: number; current: number } },
): PortfolioStandards["PortfolioMacroAnalysis"] => {
	const data: PortfolioStandards["PortfolioMacroAnalysis"] = {
		ytd: {
			summary: [],
			chart: [],
		},
		comp: {
			sector: {
				summary: [],
				chart: undefined,
			},
			stock: {
				summary: [],
				chart: [],
			},
		},
		vFx: {
			summary: [],
			chart: undefined,
		},
		vInflation: {
			summary: [],
			chart: undefined,
		},
		vMarket: {
			summary: [],
			chart: undefined,
		},
		perf: {
			chart: undefined,
			summary: [],
		},
	};

	// ? init and current portfolio calcs
	const year = Number(firstDmr[0].date.toString().substring(0, 4));
	const ytdFolio = cns.filter((item) => item.date <= firstDmr[0].date);

	const symbols: string[] = [];

	cns.forEach((cn) => {
		if (!symbols.includes(cn.symbol)) symbols.push(cn.symbol);
	});

	symbols.sort();

	interface FolioRaw {
		// the stock itself
		[key: string]: {
			initial: {
				vol: number;
				price: number;
				val: number;
				symbol: string;
				inv: number;
			};
			current: {
				vol: number;
				price: number;
				val: number;
				symbol: string;
				inv: number;
			};
		};
	}

	const portfolio: FolioRaw = {};

	symbols.forEach((s) => {
		portfolio[s] = {
			initial: { price: 0, val: 0, vol: 0, symbol: s, inv: 0 },
			current: { price: 0, val: 0, vol: 0, symbol: s, inv: 0 },
		};
	});

	// inital portfolio
	ytdFolio.forEach((cn) => {
		const k = cn.side === "buy" ? 1 : -1;

		if (!portfolio[cn.symbol].initial.price) {
			const actualFirstYearPrice = firstDmr.find((item) => item.symbol === cn.symbol);

			if (actualFirstYearPrice)
				portfolio[cn.symbol].initial.price = actualFirstYearPrice.market_price;
		}

		portfolio[cn.symbol].initial.vol += k * cn.qty;

		portfolio[cn.symbol].initial.inv += cn.price * cn.qty;
	});

	// current portfolio
	cns.forEach((cn) => {
		const k = cn.side === "buy" ? 1 : -1;

		if (!portfolio[cn.symbol].current.price) {
			const currentPrice = currentDmr.find((item) => item.symbol === cn.symbol);

			if (currentPrice) portfolio[cn.symbol].current.price = currentPrice.market_price;
		}

		portfolio[cn.symbol].current.vol += k * cn.qty;
		portfolio[cn.symbol].current.inv += cn.price * cn.qty;
	});

	let initPvalue: number = 0;
	let currentPvalue: number = 0;

	symbols.forEach((s) => {
		const ik = s.toLowerCase().includes("usd") ? fxUsd.buy.init : 1;
		const ck = s.toLowerCase().includes("usd") ? fxUsd.buy.current : 1;

		const iv = portfolio[s].initial.vol * portfolio[s].initial.price;
		const cv = portfolio[s].current.vol * portfolio[s].current.price;

		portfolio[s].initial.val = iv;
		initPvalue += iv * ik;

		portfolio[s].current.val = cv;
		currentPvalue += cv * ck;
	});

	const _colifier = (val: number): "--rd--" | "--gren--" | "" => {
		return val > 0 ? "--gren--" : val < 0 ? "--rd--" : "";
	};

	const _fStringifier = (
		cfg: "numeric" | "bold" | "underline" | "strikethrough" | "italic",
	): string => {
		switch (cfg) {
			case "numeric":
				return "==num==";
			case "bold":
				return "==font-bold==";
			case "underline":
				return "==underline==";
			case "strikethrough":
				return "==line-through==";
			case "italic":
				return "==italic==";
			default:
				return "";
		}
	};

	const folios = Object.values(portfolio);

	// ? YTD
	const ytdDelta = currentPvalue - initPvalue;
	const ytd = ytdDelta / initPvalue;

	const zkFolios = folios.filter((item) => !item.initial.symbol.includes("usd"));
	const zeroDInitInvZk = zkFolios.reduce((acc, obj) => acc + obj.initial.inv, 0);
	const currentInvZk = zkFolios.reduce((acc, obj) => acc + obj.current.inv, 0);

	const usdFolios = folios.filter((item) => item.initial.symbol.includes("usd"));
	const zeroDInitInvUs = usdFolios.reduce((acc, obj) => acc + obj.initial.inv, 0);
	const currentInvUs = usdFolios.reduce((acc, obj) => acc + obj.current.inv, 0);

	// print({ zkFolios, usdFolios });

	const zeroDInitInv = zeroDInitInvZk + zeroDInitInvUs * fxUsd.buy.init;
	const currentInv = currentInvZk + currentInvUs * fxUsd.buy.init;

	const investmentTotal = currentInv - zeroDInitInv;

	/**ROI numerator */
	const realYtdDelta = ytdDelta - investmentTotal;

	const _ytdEndEnder = (): string => {
		if (realYtdDelta !== 0)
			return (
				_fStringifier("numeric") +
				numParse(percentageHandler(realYtdDelta / investmentTotal).replace("%", "")) +
				"%"
			);

		return "0.00";
	};

	data.ytd.summary = [
		"At the beginning of ",
		year.toString() + " (the period under review)",
		", your overall portfolio had a holding of ",
		_fStringifier("numeric") + "K " + numParse(initPvalue.toFixed(2)),
		" (",
		_fStringifier("numeric") + "$ " + numParse((initPvalue / fxUsd.sell.init).toFixed(2)),
		") and has shown a YTD growth of ",
		_fStringifier("numeric") + numParse(percentageHandler(ytd).replace("%", "")) + "%",
		" with a current total value of ",
		_fStringifier("numeric") + "K " + numParse(currentPvalue.toFixed(2)),
		" (",
		_fStringifier("numeric") + "$ " + numParse((currentPvalue / fxUsd.sell.current).toFixed(2)),
		"). Based on your trading activity, you invested a total of ",
		_fStringifier("numeric") + "K " + numParse(investmentTotal.toFixed(2)),
		" (",
		_fStringifier("numeric") + "$ " + numParse((investmentTotal / fxUsd.sell.init).toFixed(2)),
		") which gives you an ROI of ",
		_ytdEndEnder(),
		".",
	];

	// console.log(data.ytd.summary);

	// ? Best & worst
	const _folios = JSON.parse(JSON.stringify(folios)) as typeof folios;
	_folios.sort((a, b) => {
		const vb = (b.current.val - b.initial.val) / b.initial.val;
		const va = (a.current.val - a.initial.val) / a.initial.val;

		return vb - va;
	});
	const best = JSON.parse(JSON.stringify(_folios[0])) as (typeof _folios)[0];
	const worst = JSON.parse(JSON.stringify(_folios[_folios.length - 1])) as (typeof _folios)[0];

	data.perf.summary = [
		"The ",
		_fStringifier("italic") + "best",
		" performing stock in your portfolio thus far is ",
		_fStringifier("italic") + best.initial.symbol,
		" with a YTD performance of ",
		_fStringifier("numeric") +
			numParse(
				percentageHandler((best.current.val - best.initial.val) / best.initial.val).replace(
					"%",
					"",
				),
			) +
			"%",
		", whereas your ",
		_fStringifier("italic") + "worst",
		" performing stock is ",
		_fStringifier("underline") + worst.initial.symbol,
		" at ",
		_fStringifier("numeric") +
			numParse(
				percentageHandler((worst.current.val - worst.initial.val) / worst.initial.val).replace(
					"%",
					"",
				),
			) +
			"%",
		".",
	];

	// ? Composition
	const zkVal = zkFolios.reduce((acc, obj) => acc + obj.current.val, 0);
	const usdVal = usdFolios.reduce((acc, obj) => acc + obj.current.val, 0);
	const compTotal = zkVal + fxUsd.buy.current * usdVal;

	const reasonableHeavy = _folios.filter((item) => {
		const weight = item.current.val / compTotal;

		return weight > 0.4 && weight < 0.6;
	});

	const superHeavy = _folios.filter((item) => {
		const weight = item.current.val / compTotal;

		return weight > 0.6;
	});

	// console.log({ superHeavy });

	const sup = () => [
		"Your portfolio is ",
		_fStringifier("bold") + " very",
		" heavy in: ",
		superHeavy.map((v) => v.current.symbol).join(", ") + ".",
	];

	const rea = () => [
		"Your portfolio is",
		_fStringifier("italic") + " reasonably",
		" heavy in the following: ",
		reasonableHeavy.map((v) => v.current.symbol).join(", ") + ".",
	];

	const reaSup = () => [
		"Your portfolio is ",
		_fStringifier("italic") + " reasonably",
		" heavy in the following: ",
		reasonableHeavy.map((v) => v.current.symbol).join(", "),
		" and",
		_fStringifier("bold") + " very",
		" heavy in: ",
		superHeavy.map((v) => v.current.symbol).join(", ") + ".",
	];

	data.comp.stock.summary = !_folios.length
		? ["Get started with your trading yourney to see relevant analytics here :)"]
		: !reasonableHeavy.length && !superHeavy.length && _folios.length
			? ["Your portfolio is reasonably balanced."]
			: reasonableHeavy.length && !superHeavy.length
				? rea()
				: reasonableHeavy.length && superHeavy.length
					? reaSup()
					: sup();

	// * Charts

	folios.forEach((stock) => {
		const delta = stock.current.val - stock.initial.val;
		// ? YTD
		data.ytd.chart.push({
			x: stock.initial.symbol,
			y: [stock.initial.val, stock.current.val],
			fillColor: delta > 0 ? "var(--sbz-green)" : delta < 0 ? "var(--sbz-red)" : undefined,
		});

		// ? Composition
		data.comp.stock.chart.push({
			x: stock.initial.symbol,
			y: stock.current.val / compTotal,
		});
	});

	return data;
};

const genPortfolio = (
	rawData: GetPortfolioData,
	luseId: number,
): PortfolioStandards["ClientTradeHistory"] => {
	const _genMatched = (matchedData: GetPortfolioData["matched"], luseId: number) => {
		if (!matchedData.length) return undefined;

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

	const _genScreen = (screenData: GetPortfolioData["onScreen"], luseId: number) => {
		if (!screenData.length) return undefined;

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

	const matched = _genMatched(rawData.matched, luseId);
	const screen = _genScreen(rawData.onScreen, luseId);

	let zmwTotal: number = 0;
	let usdTotal: number = 0;

	const portfolioCodexZmw: { [key: string]: PortfolioStandards["Portfolio"] } = {};
	const portfolioCodexUsd: { [key: string]: PortfolioStandards["Portfolio"] } = {};

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
	const portfolioZmw: PortfolioStandards["Portfolio"][][] = chunkArray<
		PortfolioStandards["Portfolio"]
	>(
		Object.values(portfolioCodexZmw)
			.filter((item) => item.value && item.volume)
			.sort((a, b) => a.symbol.localeCompare(b.symbol)),
		100,
	);
	const portfolioUsd: PortfolioStandards["Portfolio"][][] = chunkArray<
		PortfolioStandards["Portfolio"]
	>(
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

	const analysis: PortfolioStandards["Analysis"] = {
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

export const POST = async ({ request }) => {
	if (!IS_DEV) {
		return json("Method not allowed.", { status: 405 });
	}

	try {
		const { luseId, all }: { luseId: number; all?: boolean } = await request.json();

		const [portfolio, firstDmr] = await Promise.all([
			dbs.sbz.getPortfolio(luseId, 2025),
			dbs.nf.getFirstStocks(),
		]);

		const initFx = (await dbs.nf.getLastFxData(firstDmr.market[0].date)).fx;

		const pdata = portfolio.data;
		const initUsd = initFx.find((item) => item.currency.toLowerCase() === "usd/zmw");

		if (pdata && initUsd && firstDmr.market.length) {
			// const quickStats = genQuickStats(pdata);
			const macroAnalysis = genAnalysis(pdata.settled, firstDmr.market, pdata.dmr, {
				buy: {
					init: initUsd.buy,
					current: pdata.fxUsd.buy,
				},
				sell: {
					init: initUsd.sell,
					current: pdata.fxUsd.sell,
				},
			});

			const siteFolio = genPortfolio(pdata, luseId);

			// await notif.email.sendPortfolio()

			const data = templates.portfolio({
				folio: siteFolio,
				macroAnalysis,
				year: 2025,
				usd: { buy: pdata.fxUsd.buy, sell: pdata.fxUsd.sell },
				subject: "",
				title: "",
			});

			return new Response(data.html);
		}

		return json({ success: true, message: "Process failed.", data: undefined }, { status: 400 });
	} catch (ex) {
		console.error(ex);
		return json({ success: false, message: "Process failed.", data: String(ex) }, { status: 500 });
	}
};
