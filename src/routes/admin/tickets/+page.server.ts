import dbs from "$lib/server/db/index.js";
import { scourgeOfClients } from "$lib/server/jwt";

export const load = (data) => {
	scourgeOfClients(data);

	return {
		tickets: dbs.sbz.getAllTickets(),
	};
};
