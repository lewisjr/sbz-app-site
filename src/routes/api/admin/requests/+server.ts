import { json } from "@sveltejs/kit";
import kratos from "$lib/server/kratos";
import dbs from "$lib/server/db";

import type { Types } from "$lib/types";
import type { StaffInsertRow } from "$lib/server/db/utils.js";

export const POST = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const {
		action,
		obj,
	}: {
		action: "approve" | "reject" | "kyc";
		obj: any;
	} = await request.json();

	// console.log({ action, obj });

	switch (action) {
		case "approve":
			const approveClient = await dbs.sbz.approveRequest(
				obj.idNum,
				obj.fname,
				sender.username,
				obj.email,
			);

			return json(
				{
					success: approveClient.success,
					message: approveClient.message,
				},
				{ status: approveClient.success ? 200 : 400 },
			);
		case "reject":
			const rejectClient = await dbs.sbz.rejectRequest(
				obj.idName,
				obj.luseId,
				obj.fname,
				sender.username,
				obj.email,
				obj.reason,
			);

			return json(
				{
					success: rejectClient.success,
					message: rejectClient.message,
					data: rejectClient.success ? obj : undefined,
				},
				{ status: rejectClient.success ? 200 : 400 },
			);
		case "kyc":
			const kyc = await dbs.sbz.getFiles(obj.idNum);

			return json(kyc, { status: kyc.success ? 200 : 400 });
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
