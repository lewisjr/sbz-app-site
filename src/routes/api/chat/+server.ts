import { json } from "@sveltejs/kit";
import dbs from "$lib/server/db";
import notif from "$lib/server/email";
import Tokenise from "$lib/server/tokenise";

import { genDbTimestamp, genOTP } from "$lib/utils";
import { genJwt } from "$lib/server/jwt";

import type { UserObj } from "../su/+server";
import type { OTPBulkObj } from "$lib/server/db/utils";

import type { SBZdb } from "$lib/types/index";
import type { NotifConfigObj } from "$lib/server/db/utils.js";

const tokenise = new Tokenise();

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

export const PATCH = async ({ request, cookies }) => {
	const { txt }: { txt: string } = await request.json();

	try {
		const decoded = tokenise.decode(txt);

		return json({ success: true, message: "", data: decoded }, { status: 200 });
	} catch {
		return json({ success: false, message: "", data: "Error decrypting." }, { status: 200 });
	}
};

export const PUT = async ({ request, cookies }) => {
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
