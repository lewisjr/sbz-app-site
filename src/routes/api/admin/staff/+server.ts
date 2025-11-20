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
		action: Types["StaffActionConfig"];
		obj: any;
	} = await request.json();

	switch (action) {
		case "new":
			if (!sender.permissions.includes("add-staff"))
				return json(
					{
						success: false,
						message: "Access denied.",
					},
					{ status: 400 },
				);

			const nObj: StaffInsertRow = {
				created_by: sender.username,
				department: obj.department,
				email: obj.email,
				full_names: obj.full_names,
				permissions: "",
				phone: obj.phone,
				username: obj.username,
				approved: true,
				ticketable: obj.ticketable,
			};
			const addStaff = await dbs.sbz.addStaffMember(nObj);

			return json(
				{
					success: addStaff.success,
					message: addStaff.message,
					data: addStaff.data,
				},
				{ status: addStaff.success ? 200 : 400 },
			);
		case "block":
			if (!sender.permissions.includes("block-staff"))
				return json(
					{
						success: false,
						message: "Access denied.",
					},
					{ status: 400 },
				);

			const blockStaff = await dbs.sbz.blockStaffMember(obj.username, sender.username);

			obj.approved = false;

			return json(
				{
					success: blockStaff.success,
					message: blockStaff.message,
					data: blockStaff.success ? obj : undefined,
				},
				{ status: blockStaff.success ? 200 : 400 },
			);
		case "unblock":
			if (!sender.permissions.includes("block-staff"))
				return json(
					{
						success: false,
						message: "Access denied.",
					},
					{ status: 400 },
				);

			const unblockStaff = await dbs.sbz.unblockStaffMember(obj.username, sender.username);

			obj.approved = true;

			return json(
				{
					success: unblockStaff.success,
					message: unblockStaff.message,
					data: unblockStaff.success ? obj : undefined,
				},
				{ status: unblockStaff.success ? 200 : 400 },
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
