import dbs from "$lib/server/db/index.js";
import { scourgeOfInvestor } from "$lib/server/jwt";

export const load = async (data) => {
	scourgeOfInvestor(data);

	return {
		news: dbs.nf.getNewsLean(),
	};
};
