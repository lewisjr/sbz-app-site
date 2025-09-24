import { json } from "@sveltejs/kit";
import dbs from "$lib/server/db";
import notif from "$lib/server/email";

import { genDbTimestamp, genOTP } from "$lib/utils";
import { genJwt } from "$lib/server/jwt";

import type { UserObj } from "../su/+server.js";
import type { OTPBulkObj } from "$lib/server/db/utils.js";

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
