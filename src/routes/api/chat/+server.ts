import { json } from "@sveltejs/kit";
import dbs from "$lib/server/db";
import kratos from "$lib/server/kratos.js";
import Tokenise from "$lib/server/tokenise";

import type { SBZdb } from "$lib/types/index";
import type { NotifConfigObj } from "$lib/server/db/utils.js";
import { genJwt } from "$lib/server/jwt.js";

const tokenise = new Tokenise();

export const POST = async ({ request, cookies }) => {
	const { user, otp }: { user: string; otp: number } = await request.json();

	const correct = await dbs.sbz.checkOtp({ otp, user });

	// console.log({ correct, user, otp, location: "API Route" });

	if (correct.success) {
		cookies.set("sbz-nootp", genJwt("true", "4h"), {
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

export const PATCH = async (event) => {
	const sender = await kratos.chat(event);
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
	const sender = await kratos.chat(event);
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
