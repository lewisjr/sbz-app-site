import { json } from "@sveltejs/kit";
import { DEV } from "$env/static/private";

import dbs from "$lib/server/db";

const IS_DEV = DEV === "y";

export const GET = async () => {
	if (!IS_DEV) {
		return json("POST method not allowed", { status: 405 });
	}

	return json({ success: true, message: "Process ran.", data: "" }, { status: 200 });
};
