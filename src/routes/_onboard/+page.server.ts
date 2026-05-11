import { scourgeOfClients } from "$lib/server/jwt";
import { redirect } from "@sveltejs/kit";

export const load = (data) => {
	// scourgeOfClients(data);
	redirect(307, "/");

	return;
};
