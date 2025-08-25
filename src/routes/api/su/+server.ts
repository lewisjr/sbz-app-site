import dbs from "$lib/server/db";
import { genOTP } from "$lib/utils";
import { json } from "@sveltejs/kit";
import notif from "$lib/server/email";

import type { SBZdb } from "$lib/types";

// Set an OTP
export const PUT = async ({ request }) => {
	const { emails, phones }: { emails: string[]; phones: string[] } = await request.json();

	const otp = genOTP();

	const otpReq = await dbs.sbz.setOtp({ otp, user: emails.join(",,") });

	// if the DB fails to set the OTP
	if (!otpReq.success) return json(otpReq, { status: 400 });

	const emailReqs = await Promise.all(
		emails.map((address) =>
			notif.email.sendOtp(
				{ otp, subject: "Sign In OTP | Stockbrokers Zambia", title: "One Time Passcode" },
				address,
			),
		),
	);

	let err = emailReqs.find((item) => !item);

	if (err) {
		return json(
			{
				success: false,
				msg: "Failed to send an OTP to one or more of your provided emails. Please get in touch with tech support.",
			},
			{ status: 400 },
		);
	}

	return json(otpReq, { status: 200 });
};

// Confirm OTP and make account opening ticket
export const POST = async ({ request }) => {
	const formData = await request.formData();

	const otp = Number(formData.get("otp")); // comes in as string → cast to number
	const emails = JSON.parse(formData.get("emails") as string) as string[]; // if multiple inputs named "emails"
	const obj = JSON.parse(
		formData.get("obj") as string,
	) as SBZdb["public"]["Tables"]["clients"]["Insert"];

	// now otp, emails, and obj have the right types
	console.log({ otp, emails, obj });

	const serverOtp = await dbs.sbz.checkOtp({ otp, user: emails.join(",,") });

	if (!serverOtp.success)
		return json(
			{
				success: false,
				msg: "Failed to confirm your OTP, please ensure that it is correct and try again.",
			},
			{ status: 400 },
		);

	return json({ success: true, message: "w.i.p" }, { status: 200 });
};
