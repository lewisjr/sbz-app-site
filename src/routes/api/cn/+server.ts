import dbs from "$lib/server/db";
import notif from "$lib/server/email";
import { genOTP } from "$lib/utils";
import { json } from "@sveltejs/kit";
import { toTitleCase } from "@cerebrusinc/fstring";

import type { SBZdb } from "$lib/types";
import type { FileData } from "$lib/server/db/utils.js";

export interface UserObj {
	//details
	fname: string;
	lname: string;
	phone: string;
	email: string;
	dob: string;
	gender: string;
	mstatus: string;
	nationality: string;
	//address
	street: string;
	city: string;
	country: string;
	//identity
	idType: string;
	idNum: string;
}

type InsertTicket = SBZdb["public"]["Tables"]["odyn-tickets"]["Insert"];

export const POST = async ({ request, cookies }) => {
	const data: InsertTicket = await request.json();

	switch (data.query_type) {
		case "Other":
			const agent = await dbs.sbz.getTicketCandidate();
			const ticketResOther = await dbs.sbz.createTicket(data, agent.data);

			if (!ticketResOther.success)
				return json(
					{
						success: false,
						message: "Failed to create chat room. Please try again in a few minutes.",
					},
					{ status: 400 },
				);

			const updateAgentReq = dbs.sbz.updateTicketCandidate(agent.data);

			const historyReq = dbs.sbz.appendHistory({
				creator: "odyn",
				message: `Odyn assigned this ticket to ${toTitleCase(agent.data.agentId)}.`,
				ticketId: ticketResOther.data,
			});

			await Promise.all([updateAgentReq, historyReq]);

			return json(ticketResOther, { status: ticketResOther.success ? 201 : 400 });
		default:
			const ticketRes = await dbs.sbz.createAIticket(data);

			if (ticketRes.success) {
				cookies.set("sbz-nootp", "true", {
					path: "/",
					httpOnly: true,
					maxAge: 60 * 60 * 1,
					secure: true,
				});
			}

			return json(ticketRes, { status: ticketRes.success ? 201 : 400 });
	}
};

export const PUT = async ({ request }) => {
	const data: InsertTicket = await request.json();

	const res = await dbs.sbz.createCompliment(data);

	return json(res, { status: res.success ? 201 : 400 });
};
