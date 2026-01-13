import dbs from "$lib/server/db";
import { scourgeOfInvestor } from "$lib/server/jwt";
import { redirect, text } from "@sveltejs/kit";
import { chunkArray, mrMateSymbols, percentageHandler, prettyDate, print } from "$lib/utils";

import type { NFdb, SBZdb, ApexDataPresets, GetPortfolioData, NFHelp, Types } from "$lib/types";
import { numParse, randomColour } from "@cerebrusinc/qol";
import { toTitleCase } from "@cerebrusinc/fstring";
import { portfolio } from "$lib/server/email/templates.js";
import { genYtdFolio } from "$lib/server/utils.js";

export const load = async (data) => {
	const client = scourgeOfInvestor(data);
	const folio = await genYtdFolio({ luseId: client.data.luseId });
	const d = new Date();

	if (folio) {
		// @ts-ignore
		folio["year"] = d.getFullYear();

		return folio;
	} else throw redirect(307, "/contact");
};
