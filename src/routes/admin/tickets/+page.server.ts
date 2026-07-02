import dbs from "$lib/server/db/index.js";
import { scourgeOfClients } from "$lib/server/jwt";

import { DB_URL, DB_ANON } from "$env/static/private";

export const load = async (data) => {
	scourgeOfClients(data);

	const agents = await dbs.sbz.getAgents();

	return {
		agents,
		tickets: dbs.sbz.getAllTickets(1000),
		dbUrl: DB_URL,
		dbAuth: DB_ANON,
	};
};
