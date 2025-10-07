import { scourgeOfClients } from "$lib/server/jwt";
import dbs from "$lib/server/db/index.js";

export const load = (data) => {
	scourgeOfClients(data);

	return {
		tickets: dbs.sbz.getAllTickets(),
		socials: dbs.sbz.getAllSocials(),
		agentStatus: dbs.sbz.getAgentStatus(),
		siteStatus: dbs.sbz.getSiteStatus(),
	};
};
