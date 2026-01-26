import dbs from "$lib/server/db/index.js";
import { scourgeOfInvestor } from "$lib/server/jwt";

export const load = async (data) => {
	const client = scourgeOfInvestor(data);

	const folio = await dbs.sbz.getPortfolio(client.data.luseId);

	interface MatchedCodex {
		luseId: number;
		date: number;
		sells: number;
		buys: number;
	}

	if (!folio) {
		return {
			noData: true,
			rawMatched: [],
			matchedSummary: [],
		};
	}

	const matchedCodex: { [key: string]: MatchedCodex } = {};

	if (!folio.data) {
		return {
			noData: true,
			rawMatched: [],
			matchedSummary: [],
		};
	}

	folio.data.matched.forEach((m) => {
		if (!matchedCodex[`${m.luse_id}${m.trade_date}`]) {
			const sells = m.trade_side === "buy" ? 0 : m.qty * m.price;
			const buys = m.trade_side !== "buy" ? 0 : m.qty * m.price;

			matchedCodex[`${m.luse_id}${m.trade_date}`] = {
				luseId: m.luse_id,
				date: m.trade_date,
				buys,
				sells,
			};
		} else {
			const sells = m.trade_side === "buy" ? 0 : m.qty * m.price;
			const buys = m.trade_side !== "buy" ? 0 : m.qty * m.price;

			matchedCodex[`${m.luse_id}${m.trade_date}`].buys =
				matchedCodex[`${m.luse_id}${m.trade_date}`].buys + buys;
			matchedCodex[`${m.luse_id}${m.trade_date}`].sells =
				matchedCodex[`${m.luse_id}${m.trade_date}`].sells + sells;
		}
	});

	return {
		noData: false,
		rawMatched: folio.data.matched,
		matchedSummary: Object.values(matchedCodex),
	};
};
