import { scourgeOfInvestor } from "$lib/server/jwt";
import dbs from "$lib/server/db/index.js";

export const load = (data) => {
	scourgeOfInvestor(data);

	return {
		stocks: dbs.nf.getStocks(),
		opinions: dbs.nf.getRecommendations(),
		fx: dbs.nf.getLastFxData(),
	};
};
