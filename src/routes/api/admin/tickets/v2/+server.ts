import { json } from "@sveltejs/kit";
import kratos from "$lib/server/kratos";
import dbs from "$lib/server/db";

import type { Types } from "$lib/types";
import type { CloseTicketObj } from "$lib/server/db/utils.js";

type V2Action = "fetch_extra";

export const POST = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const { action }: { action: V2Action } = await request.json();

	let message: string = "";
	let success: boolean = false;
	let data: any | undefined = undefined;
	let status: 200 | 400 = 400;

	try {
		switch (action) {
			case "fetch_extra":
				const [_p2, _p3] = await Promise.all([
					dbs.sbz.paginateTickets(2),
					dbs.sbz.paginateTickets(3),
				]);
				const extra_tickets = [..._p2, ..._p3];

				data = extra_tickets;
				success = true;

				status = 200;

				break;
			default:
				message = "Malformed requet received.";
				break;
		}

		return json({ success, message, data }, { status });
	} catch (ex) {
		return json({ success: false, message: String(ex) }, { status: 500 });
	}
};
