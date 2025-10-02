import { json } from "@sveltejs/kit";
import dbs from "$lib/server/db";
import Tokenise from "$lib/server/tokenise";
import kratos from "$lib/server/kratos.js";

import { SERVER_API_KEY, SERVER_BASE_URL } from "$env/static/private";

import type { SBZdb } from "$lib/types/index";
import type { NotifConfigObj } from "$lib/server/db/utils.js";

const tokenise = new Tokenise();

export const GET = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { url } = event;
	const ticketId = url.searchParams.get("t");

	if (!ticketId)
		return json({ success: false, message: "Invalid URL provided.", data: [] }, { status: 400 });

	const data = await dbs.sbz.getAllChatMessages(ticketId);

	return json({ success: true, message: "", data }, { status: 200 });
};

export const PATCH = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const { txt }: { txt: string } = await request.json();

	try {
		const decoded = tokenise.decode(txt);

		return json({ success: true, message: "", data: decoded }, { status: 200 });
	} catch {
		return json({ success: false, message: "", data: "Error decrypting." }, { status: 200 });
	}
};

export const PUT = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	type ChatInsert = SBZdb["public"]["Tables"]["odyn-chats"]["Insert"];
	const { obj, notifConfig }: { obj: ChatInsert; notifConfig?: NotifConfigObj } =
		await request.json();

	if (notifConfig) {
		const [msgId, subject] = notifConfig.msgId.split(",,");

		notifConfig.msgId = msgId;
		notifConfig.subject = subject;
	}

	try {
		const req = await dbs.sbz.sendChat(obj, notifConfig);

		return json(
			{
				success: req,
				message: req ? "Failed to send message, please try again in a few minutes." : "",
			},
			{ status: req ? 201 : 400 },
		);
	} catch {
		return json(
			{ success: false, message: "Server error, please try again in a few minutes." },
			{ status: 500 },
		);
	}
};
