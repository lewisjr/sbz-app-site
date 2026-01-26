import dbs from "$lib/server/db/index.js";
import { scourgeOfInvestor } from "$lib/server/jwt";

export const load = async (data) => {
	const client = scourgeOfInvestor(data);

	const [folio, fx] = await Promise.all([
		dbs.sbz.getPortfolio(client.data.luseId),
		dbs.nf.getLastFxData(),
	]);

	interface Codex {
		luseId: number;
		date: number;
		sells: number;
		buys: number;
	}

	if (!folio)
		return {
			noData: true,
			matchedSummary: [],
			cnSummary: [],
			fx: { buy: 0, sell: 0 },
		};

	if (!fx.fx.length)
		return {
			noData: true,
			matchedSummary: [],
			cnSummary: [],
			fx: { buy: 0, sell: 0 },
		};

	const matchedCodex: { [key: string]: Codex } = {};

	if (!folio.data) {
		return {
			noData: true,
			matchedSummary: [],
			cnSummary: [],
			fx: { buy: 0, sell: 0 },
		};
	}

	fx.fx.sort((b, a) => b.date - a.date);
	const usd = fx.fx.find((item) => item.currency.toLowerCase().includes("usd"));

	if (!usd) {
		return {
			noData: true,
			matchedSummary: [],
			cnSummary: [],
			fx: { buy: 0, sell: 0 },
		};
	}

	folio.data.matched.forEach((m) => {
		const k = m.symbol.toLowerCase().includes("usd") ? usd.buy : 1;

		if (!matchedCodex[`${m.luse_id}${m.trade_date}`]) {
			const sells = m.trade_side === "buy" ? 0 : m.qty * m.price;
			const buys = m.trade_side !== "buy" ? 0 : m.qty * m.price;

			matchedCodex[`${m.luse_id}${m.trade_date}`] = {
				luseId: m.luse_id,
				date: m.trade_date,
				buys: buys * k,
				sells: sells * k,
			};
		} else {
			const _sells = m.trade_side === "buy" ? 0 : m.qty * m.price;
			const _buys = m.trade_side !== "buy" ? 0 : m.qty * m.price;

			const sells = _sells * k;
			const buys = _buys * k;

			matchedCodex[`${m.luse_id}${m.trade_date}`].buys =
				matchedCodex[`${m.luse_id}${m.trade_date}`].buys + buys;
			matchedCodex[`${m.luse_id}${m.trade_date}`].sells =
				matchedCodex[`${m.luse_id}${m.trade_date}`].sells + sells;
		}
	});

	const cnCodex: { [key: string]: Codex } = {};

	folio.data.settled.sort((a, b) => b.date - a.date);
	folio.data.settled.forEach((m) => {
		const k = m.symbol.toLowerCase().includes("usd") ? usd.buy : 1;

		if (!cnCodex[`${m.luse_id}${m.trade_date}`]) {
			const _sells = m.side === "buy" ? 0 : m.qty * m.price;
			const _buys = m.side !== "buy" ? 0 : m.qty * m.price;

			const sellComms = (m.broker_comission + m.luse_comission + m.sec_commision) * _sells;
			const sells = _sells - sellComms;

			const buysComms = (m.broker_comission + m.luse_comission + m.sec_commision) * _buys;
			const buys = _buys + buysComms;

			cnCodex[`${m.luse_id}${m.trade_date}`] = {
				luseId: m.luse_id,
				date: m.date,
				buys: buys * k,
				sells: sells * k,
			};
		} else {
			const _sells = m.side === "buy" ? 0 : m.qty * m.price;
			const _buys = m.side !== "buy" ? 0 : m.qty * m.price;

			const sellComms = (m.broker_comission + m.luse_comission + m.sec_commision) * _sells;
			const sells = _sells - sellComms;

			const buysComms = (m.broker_comission + m.luse_comission + m.sec_commision) * _buys;
			const buys = _buys + buysComms;

			cnCodex[`${m.luse_id}${m.trade_date}`].buys =
				cnCodex[`${m.luse_id}${m.trade_date}`].buys + buys;
			cnCodex[`${m.luse_id}${m.trade_date}`].sells =
				cnCodex[`${m.luse_id}${m.trade_date}`].sells + sells;
		}
	});

	return {
		noData: false,
		matchedSummary: Object.values(matchedCodex),
		cnSummary: Object.values(cnCodex),
		fx: { buy: usd.buy, sell: usd.sell },
	};
};
