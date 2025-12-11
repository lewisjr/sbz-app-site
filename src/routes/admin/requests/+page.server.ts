import dbs from "$lib/server/db/index.js";
import { scourgeOfClients } from "$lib/server/jwt";

export const load = async (data) => {
	scourgeOfClients(data);

	const customSignUpUrl = "/admin/_sign-up";

	return {
		requests: dbs.sbz.getRequests(),
		customSignUpUrl,
	};
};
