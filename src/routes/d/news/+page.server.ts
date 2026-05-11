import dbs from "$lib/server/db/index.js";
import { scourgeOfInvestor } from "$lib/server/jwt";
import { redirect } from "@sveltejs/kit";

export const load = async (data) => {
	redirect(307, "/access");

	return;
	scourgeOfInvestor(data);

	return {
		news: dbs.nf.getNewsLean(),
	};
};
