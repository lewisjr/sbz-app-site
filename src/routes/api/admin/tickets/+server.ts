import { json } from "@sveltejs/kit";
import kratos from "$lib/server/kratos";
import dbs from "$lib/server/db";

import type { Types } from "$lib/types";
import type { CloseTicketObj } from "$lib/server/db/utils.js";

export const POST = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const {
		action,
		obj,
	}: {
		action: Types["ActionConfig"];
		obj: any;
	} = await request.json();

	switch (action) {
		case "reassign":
			const reassignReq = await dbs.sbz.reassignWebTicket({ sender: sender.username, ...obj });
			return json(
				{
					success: reassignReq.success,
					message: reassignReq.message,
				},
				{ status: reassignReq.success ? 200 : 400 },
			);
		case "audit":
			const auditReq = await dbs.sbz.auditTicket(obj.ticketId);
			return json(
				{
					success: auditReq.success,
					message: auditReq.message,
					data: auditReq.data,
				},
				{ status: auditReq.success ? 200 : 400 },
			);
		case "close":
			const _obj: CloseTicketObj = obj;

			const closeReq = await dbs.sbz.closeTicket({
				admin: sender.username,
				adminEmail: sender.email,
				..._obj,
			});
			return json(
				{
					success: closeReq.success,
					message: closeReq.message,
					data: closeReq.data,
				},
				{ status: closeReq.success ? 200 : 400 },
			);
		default:
			return json(
				{
					success: false,
					message: "Received a malformed request, please contact the developer.",
				},
				{ status: 400 },
			);
	}
};
