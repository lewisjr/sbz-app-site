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
		admin,
	}: {
		action: Types["ActionConfig"];
		obj: any;
		admin: string | undefined;
	} = await request.json();

	switch (action) {
		case "reassign":
			if (!sender.permissions.split(",,").includes("reassign-ticket"))
				return json(
					{
						success: false,
						message: "Access denied.",
					},
					{ status: 400 },
				);

			const reassignReq = await dbs.sbz.reassignWebTicket({ sender: sender.username, ...obj });
			return json(
				{
					success: reassignReq.success,
					message: reassignReq.message,
				},
				{ status: reassignReq.success ? 200 : 400 },
			);
		case "audit":
			if (!sender.permissions.split(",,").includes("audit-ticket"))
				return json(
					{
						success: false,
						message: "Access denied.",
					},
					{ status: 400 },
				);

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

			/*
			if (!sender.permissions.split(",,").includes("close-ticket") || sender.username !== admin)
				return json(
					{
						success: false,
						message: "Access denied.",
					},
					{ status: 400 },
				);
			*/

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
