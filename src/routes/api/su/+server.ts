import dbs from "$lib/server/db";
import { genOTP } from "$lib/utils";
import { json } from "@sveltejs/kit";
import notif from "$lib/server/email";

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

	if (err)
		return json(
			{
				success: false,
				msg: "Failed to send an OTP to one or more of your provided emails. Please get in touch with tech support.",
			},
			{ status: 400 },
		);

	return json(otpReq, { status: 200 });
};
