import { scourgeOfInvestor } from "$lib/server/jwt";
import dbs from "$lib/server/db/index.js";
import { redirect } from "@sveltejs/kit";

import { NF_PHOTO_BASE } from "$env/static/private";

export const load = (data) => {
	redirect(307, "/access");

	return;
	scourgeOfInvestor(data);

	return {
		stocks: dbs.nf.getStocks(),
		opinions: dbs.nf.getRecommendations(),
		fx: dbs.nf.getLastFxData(),
		PHOTO_BASE: NF_PHOTO_BASE,
	};
};
