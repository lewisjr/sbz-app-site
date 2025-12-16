import { scourgeOfClients } from "$lib/server/jwt";

export const load = (data) => {
	scourgeOfClients(data);

	return;
};
