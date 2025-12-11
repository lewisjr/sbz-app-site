import { DEV } from "$env/static/private";
import kratos from "$lib/server/kratos";
import dbs from "$lib/server/db/index.js";
import { json } from "@sveltejs/kit";

export const POST = async (event) => {
	const sender = await kratos.client(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const { id }: { id: number } = await request.json();

	const res = await dbs.nf.getArticleJson(id);

	return json(res, { status: res.success ? 200 : 400 });
};
