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
import { genYtdFolio } from "$lib/server/utils.js";

export const POST = async ({ request }) => {
	if (!IS_DEV) {
		return json("Method not allowed.", { status: 405 });
	}

	console.log("HIT");
	const { luseId, all, year }: { luseId: number; all?: boolean; year: number } =
		await request.json();

	console.log({ luseId, all, year });

	const [] = await Promise.all([
		//
	]);

	const client = await dbs.sbz.getClient(luseId);
	const pfolio = await genYtdFolio({ luseId, year });

	console.log(client);

	const res = await notif.email.sendPortfolio(
		{
			// @ts-ignore
			folio: pfolio.portfolio,
			// @ts-ignore
			macroAnalysis: pfolio.macroAnalysis,
			year: year,
			usd: { buy: pfolio.pdata.fxUsd.buy, sell: pfolio.pdata.fxUsd.buy },
			subject: "",
			title: "",
			luseId: luseId,
			fname: client[0].fname.split(" ")[0],
			// bcc: "jkanyanga@sbz.com.zm",
			cc: "jkanyanga@sbz.com.zm",
			bcc: "ops@futur.limited",
		},
		client[0].email,
	);

	return json({ success: true, message: "Process ran.", data: undefined }, { status: 201 });
};
