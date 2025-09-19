import dbs from "$lib/server/db/index.js";
import { scourgeOfClients } from "$lib/server/jwt";

export const load = async (data) => {
	scourgeOfClients(data);

	return {
		otps: dbs.sbz.getAllOtps(),
	};
};
