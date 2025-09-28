import dbs from "$lib/server/db/index.js";
import notif from "$lib/server/email";
import { genOTP } from "$lib/utils.js";

import type { SBZdb } from "$lib/types/index.js";
import type { TicketRowLean } from "$lib/types/index.js";

import { DB_URL, DB_ANON } from "$env/static/private";

export const load = async ({ cookies, params }) => {
	const cookie = cookies.get("sbz-nootp");

	let ticket: TicketRowLean = {
		assigned: "",
		close_date: "",
		closed_by: "",
		created_at: "",
		email: "",
		email_vars: "",
		assignee_email_vars: "",
		id: "",
		id_num: "",
		is_closed: false,
		luse_id: -1,
		names: "",
		phone: "",
		platform: "",
		query: "",
		query_type: "",
		referral_source: "",
		uid: "",
		close_reason: "",
	};

	let assigneeEmail: string = "";

	const messages: SBZdb["public"]["Tables"]["odyn-chats"]["Row"][] = [];

	const _ticket = await dbs.sbz.getOneTicket(params.ticket);

	if (_ticket.platform === "") {
		return {
			otp: false,
			ticketId: params.ticket,
			ticket,
			assigneeEmail,
			messages,
			dbUrl: DB_URL,
			dbAuth: DB_ANON,
			error: true,
		};
	}

	if (!cookie) {
		const otp = genOTP();

		const emailReq = notif.email.sendOtp(
			{ otp, subject: "OTP | Stockbrokers Zambia", title: "One Time Passcode" },
			_ticket.uid ?? _ticket.email,
		);

		await Promise.all([dbs.sbz.setOtp({ otp, user: _ticket.email }), emailReq]);

		return {
			otp: true,
			ticketId: params.ticket,
			ticket: _ticket,
			assigneeEmail,
			messages,
			dbUrl: DB_URL,
			dbAuth: DB_ANON,
			error: false,
		};
	}

	const [assignee, _messages] = await Promise.all([
		dbs.sbz.getAdmin(_ticket.assigned),
		dbs.sbz.getAllChatMessages(params.ticket),
	]);

	return {
		otp: false,
		ticketId: params.ticket,
		ticket: _ticket,
		assigneeEmail: assignee.length ? assignee[0].email : "none",
		messages: _messages,
		dbUrl: DB_URL,
		dbAuth: DB_ANON,
		error: false,
	};
};
