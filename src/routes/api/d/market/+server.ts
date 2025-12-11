import kratos from "$lib/server/kratos";
import dbs from "$lib/server/db/index.js";
import { json } from "@sveltejs/kit";

export const POST = async (event) => {
	console.log("hit");
	const sender = await kratos.client(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const { symbol }: { symbol: string } = await request.json();

	const res = await dbs.nf.expandStock(symbol);

	return json(res, { status: res.success ? 200 : 400 });
};
