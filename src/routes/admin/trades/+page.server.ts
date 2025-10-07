import dbs from "$lib/server/db/index.js";
import { scourgeOfClients } from "$lib/server/jwt";

export const load = async (data) => {
	scourgeOfClients(data);

	return {
		matchedTrades: dbs.nf.getMatchedTrades(),
		onScreenTrades: dbs.nf.getOnScreenOrders(),
	};
};
