import { scourgeOfClients } from "$lib/server/jwt";
import dbs from "$lib/server/db/index.js";

export const load = (data) => {
	scourgeOfClients(data);

	return {
		//stocks: dbs.nf.getStocks(),
	};
};
