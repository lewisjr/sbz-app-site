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
			const addStaff = await dbs.sbz.addStaffMember(obj);

			return json(
				{
					success: addStaff.success,
					message: addStaff.message,
					data: addStaff.data,
				},
				{ status: addStaff.success ? 200 : 400 },
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
