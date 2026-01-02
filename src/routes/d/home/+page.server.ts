import dbs from "$lib/server/db";
import { scourgeOfInvestor } from "$lib/server/jwt";
import { redirect } from "@sveltejs/kit";
import { percentageHandler, print } from "$lib/utils";

import type { NFdb, SBZdb, ApexDataPresets, GetPortfolioData } from "$lib/types";
import { numParse } from "@cerebrusinc/qol";

/** docutypeRichTextIfier
const docutypeRichTextIfier = (ogText: string[], selection: string, modifier: string): string[] => {
	// og text (e.g "--text--dkmsdl")
const a = ogText.join();

// the selected text to be modified (e.g "text")
const _ = selection;

// the operation of segmenting the text
const b = a.split(_)

// the operation of reinserting this text BUT with the added custom modifier (e.g monospace or "==num")
b.splice(1, 0, modifier + _)

return b
}
*/

type ChartType = keyof ApexDataPresets | undefined;

interface SectionAnalysis<T> {
	summary: string[];
	chart: T;
}

interface QuickStats {
	portfolioValueUSD: number;
	portfolioValueZMW: number;
	investmentValueUSD: number;
	investmentValueZMW: number;
	overallPfolio: number;
	overalInv: number;
	pDelta: number;
}

interface PortfolioMacroAnalysis {
	ytd: SectionAnalysis<ApexDataPresets["RangeColumn"]>;
	comp: {
		stock: SectionAnalysis<ApexDataPresets["TreeMapPercent"]>;
		sector: SectionAnalysis<undefined>;
	};
	perf: SectionAnalysis<undefined>;
	vMarket: SectionAnalysis<undefined>;
	vFx: SectionAnalysis<undefined>;
	vInflation: SectionAnalysis<undefined>;
}

type CN = SBZdb["public"]["Tables"]["settled_trades"]["Row"][];
type DMR = NFdb["public"]["Tables"]["sbz-dmb"]["Row"][];

const genQuickStats = (pdata: GetPortfolioData): QuickStats => {
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
	cns: CN,
	firstDmr: DMR,
	currentDmr: DMR,
	fxUsd: { buy: { init: number; current: number }; sell: { init: number; current: number } },
): PortfolioMacroAnalysis => {
	const data: PortfolioMacroAnalysis = {
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

export const load = async (data) => {
	const client = scourgeOfInvestor(data);
	const [portfolio, firstDmr] = await Promise.all([
		dbs.sbz.getPortfolio(client.data.luseId),
		dbs.nf.getFirstStocks(),
	]);

	const initFx = (await dbs.nf.getLastFxData(firstDmr.market[0].date)).fx;

	const pdata = portfolio.data;
	const initUsd = initFx.find((item) => item.currency.toLowerCase() === "usd/zmw");

	if (pdata && initUsd) {
		const quickStats = genQuickStats(pdata);
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

		//

		return {
			portfolio: pdata,
			quickStats,
			macroAnalysis,
		};
	} else throw redirect(307, "/contact");
};
