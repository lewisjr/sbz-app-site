import { nfdb, sbzdb } from "$lib/server/db/db";
import { scourgeOfInvestor } from "$lib/server/jwt";
import { redirect } from "@sveltejs/kit";

import type { ApexDataPresets, PortfolioStandards } from "$lib/types/others";
import { randomColour } from "@cerebrusinc/qol";

const getTempFolio = async (luseId: number) => {
	try {
		const { data, error } = await sbzdb.from("pfs").select().filter("luse_id", "eq", luseId);

		if (error) {
			console.error("\n\n=== getTempFolio error\n", error, "\n===\n\n");
			return [];
		}

		return data;
	} catch (ex) {
		console.error("\n\n=== getTempFolio ex\n", ex, "\n===\n\n");
		return [];
	}
};

const folioUpdateDisabled = async (luseId: number) => {
	try {
		const { data, error } = await sbzdb.from("pf-reqs").select().filter("id", "eq", luseId);

		if (error) {
			console.error("\n\n=== getTempFolio error\n", error, "\n===\n\n");
			return true;
		}

		if (data.length) {
			return true;
		}

		return false;
	} catch (ex) {
		console.error("\n\n=== getTempFolio ex\n", ex, "\n===\n\n");
		return true;
	}
};

const getRecentStockPrices = async () => {
	try {
		const { data, error } = await nfdb
			.from("sbz-dmb")
			.select()
			.order("date", { ascending: false })
			.limit(80);

		if (error) {
			console.error("\n\n=== getRecentStockPrices error\n", error, "\n===\n\n");
			return [];
		}

		if (!data.length) return [];

		const date = data[0].date;

		const _data = data.filter((entry) => entry.date === date);

		return _data;
	} catch (ex) {
		console.error("\n\n=== getRecentStockPrices ex\n", ex, "\n===\n\n");
		return [];
	}
};

const getRecentFx = async () => {
	try {
		const { data, error } = await nfdb
			.from("fx")
			.select()
			.filter("source", "eq", "BOZ")
			.order("date", { ascending: false })
			.limit(12);

		if (error) {
			console.error("\n\n=== getRecentFx error\n", error, "\n===\n\n");
			return [];
		}

		if (!data.length) return [];

		const date = data[0].date;

		const _data = data.filter((entry) => entry.date === date);

		return _data;
	} catch (ex) {
		console.error("\n\n=== getRecentFx ex\n", ex, "\n===\n\n");
		return [];
	}
};

const getMatched = async (luseId: number) => {
	try {
		const { data, error } = await nfdb
			.from("sbz-matched-trades")
			.select()
			.filter("luse_id", "eq", luseId)
			.order("trade_date", { ascending: false });

		if (error) {
			console.error("\n\n=== getMatched error\n", error, "\n===\n\n");
			return [];
		}

		if (!data.length) return [];

		return data;
	} catch (ex) {
		console.error("\n\n=== getMatched ex\n", ex, "\n===\n\n");
		return [];
	}
};

const getScreen = async (luseId: number, date: number) => {
	try {
		const { data, error } = await nfdb
			.from("on-screen-orders")
			.select()
			.filter("date", "eq", date)
			.filter("luse_id", "eq", luseId)
			.order("date", { ascending: false });

		if (error) {
			console.error("\n\n=== getMatched error\n", error, "\n===\n\n");
			return [];
		}

		if (!data.length) return [];

		return data;
	} catch (ex) {
		console.error("\n\n=== getMatched ex\n", ex, "\n===\n\n");
		return [];
	}
};

const genAnalysisV2 = async (luseId: number) => {
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

	const [_folio, dmr, fx, updateDisabled, matched] = await Promise.all([
		getTempFolio(luseId),
		getRecentStockPrices(),
		getRecentFx(),
		folioUpdateDisabled(luseId),
		getMatched(luseId),
	]);

	const portfolio: PortfolioStandards["PortfolioV2"][] = [];

	const fxUsd = fx.find((item) => item.currency.toLowerCase().includes("usd"));
	const usdBuy = fxUsd ? fxUsd.buy : 1;
	const usdSell = fxUsd ? fxUsd.buy : 1;
	const usdMid = fxUsd ? fxUsd.buy : 1;
	const usdDate = fxUsd ? fxUsd.date : 20200101;

	const dmrDate = dmr[0] ? dmr[0].date : 20200101;

	const screen = await getScreen(luseId, dmrDate);

	_folio.forEach((f) => {
		const stock = dmr.find((entry) => entry.symbol === f.symbol);
		if (stock) {
			if (fxUsd) {
				portfolio.push({
					delta: stock.delta_abs,
					price: stock.market_price,
					qty: f.qty,
					value: stock.market_price * f.qty,
					symbol: f.symbol,
				});
			}
		}
	});

	const zkVal = portfolio
		.filter((item) => !item.symbol.includes("USD"))
		.filter((item) => item.value > 0)
		.reduce((acc, obj) => acc + obj.value, 0);

	const usdVal = portfolio
		.filter((item) => item.symbol.includes("USD"))
		.filter((item) => item.value > 0)
		.reduce((acc, obj) => acc + obj.value, 0);

	const pTotal = zkVal + usdBuy * usdVal;

	const reasonableHeavy = portfolio.filter((item) => {
		const val = item.symbol.toLowerCase().includes("usd") ? item.value * usdBuy : item.value;
		const weight = val / pTotal;

		return weight > 0.4 && weight < 0.6;
	});

	const superHeavy = portfolio.filter((item) => {
		const val = item.symbol.toLowerCase().includes("usd") ? item.value * usdBuy : item.value;
		const weight = val / pTotal;

		return weight > 0.6;
	});

	const sup = () => [
		"Your portfolio is ",
		_fStringifier("bold") + " very",
		" heavy in: ",
		superHeavy.map((v) => v.symbol).join(", ") + ".",
	];

	const rea = () => [
		"Your portfolio is",
		_fStringifier("italic") + " reasonably",
		" heavy in the following: ",
		reasonableHeavy.map((v) => v.symbol).join(", ") + ".",
	];

	const reaSup = () => [
		"Your portfolio is ",
		_fStringifier("italic") + " reasonably",
		" heavy in the following: ",
		reasonableHeavy.map((v) => v.symbol).join(", "),
		" and",
		_fStringifier("bold") + " very",
		" heavy in: ",
		superHeavy.map((v) => v.symbol).join(", ") + ".",
	];

	const data: PortfolioStandards["GenAnalysisV2Return"] = {
		year: new Date().getUTCFullYear(),
		portfolio,
		dmr,
		pOverall: pTotal,
		pZk: zkVal,
		pUsd: usdVal,
		fxUsd: {
			buy: usdBuy,
			date: usdDate,
			mid: usdMid,
			sell: usdSell,
		},
		macroAnalysis: {
			comp: {
				stock: {
					summary: [],
					chart: [],
				},
			},
		},
		matched,
		updateDisabled,
		screen,
	};

	data.macroAnalysis.comp.stock.summary = !portfolio.length
		? ["Get started with your trading yourney to see relevant analytics here :)"]
		: !reasonableHeavy.length && !superHeavy.length && portfolio.length
			? ["Your portfolio is reasonably balanced."]
			: reasonableHeavy.length && !superHeavy.length
				? rea()
				: reasonableHeavy.length && superHeavy.length
					? reaSup()
					: sup();

	portfolio.forEach((f) => {
		const val = f.symbol.toLowerCase().includes("usd") ? f.value * usdBuy : f.value;

		data.macroAnalysis.comp.stock.chart.push({
			x: f.symbol,
			y: val / pTotal,
			fillColor: randomColour(),
		});
	});

	console.log({ portfolio });

	return data;
};

export const load = async (event) => {
	redirect(307, "/access");

	return;

	const client = scourgeOfInvestor(event);
	const { luseId } = client.data;

	const data = await genAnalysisV2(luseId);

	return data;
};
