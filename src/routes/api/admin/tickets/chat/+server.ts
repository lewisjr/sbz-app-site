import { json } from "@sveltejs/kit";
import dbs from "$lib/server/db";
import Tokenise from "$lib/server/tokenise";
import kratos from "$lib/server/kratos.js";

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

/*
export const POST = async ({ request, cookies }) => {
	const { user, otp }: { user: string; otp: number } = await request.json();

	const correct = await dbs.sbz.checkOtp({ otp, user });

	if (correct.success) {
		cookies.set("sbz-nootp", "true", {
			path: "/",
			httpOnly: true,
			maxAge: 60 * 60 * 1,
			secure: true,
		});
	}

	return json(
		{
			success: correct.success,
			message: correct.success ? "Succesfully verified your identity!" : correct.message,
		},
		{ status: correct.success ? 200 : 400 },
	);
};
*/

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
