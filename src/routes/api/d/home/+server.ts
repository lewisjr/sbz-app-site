import { json } from "@sveltejs/kit";
import kratos from "$lib/server/kratos.js";
import { genYtdFolio } from "$lib/server/utils.js";

import type { Types } from "$lib/types";

type YTDFolio = Types["YTDFolio"];

export const POST = async (event) => {
	const user = await kratos.client(event);

	const { luseId, year, cfg }: { luseId: number; year: number; cfg: "ytd-folio" } =
		await event.request.json();

	// console.log({ year });

	let message: string = "";
	let success: boolean = false;
	let data: YTDFolio | undefined = undefined;

	switch (cfg) {
		case "ytd-folio":
			data = await genYtdFolio({ luseId, year });
			break;
		default:
			message = "Invalid data provided.";
			break;
	}

	return json({ success, message, data }, { status: success ? 200 : 400 });
};
