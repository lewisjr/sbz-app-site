import { json } from "@sveltejs/kit";
import dbs from "$lib/server/db";
import notif from "$lib/server/email";

import { genDbTimestamp, genOTP } from "$lib/utils";
import { genJwt } from "$lib/server/jwt";

import type { UserObj } from "../su/+server.js";
import type { OTPBulkObj } from "$lib/server/db/utils.js";

export const PUT = async ({ request }) => {
	const { id, label }: { label: "Admin Username" | "LuSE ID"; id: string } = await request.json();

	const emails: string[] = [];

	switch (label) {
		case "Admin Username":
			const isApprovedAdmin = await dbs.sbz.getAdmin(id);

			if (!isApprovedAdmin.length)
				return json(
					{ success: false, message: "Please double check your username and try again." },
					{ status: 400 },
				);

			emails.push(isApprovedAdmin[0].email);
			break;
		case "LuSE ID":
			const isApprovedClient = await dbs.sbz.getClient(Number(id));

			if (!isApprovedClient.length)
				return json(
					{ success: false, message: "Please double check your LuSE ID and try again." },
					{ status: 400 },
				);

			if (isApprovedClient[0].acc_type === "individual" && !isApprovedClient[0].is_in_trust_of) {
				emails.push(isApprovedClient[0].email);
			}

			if (isApprovedClient[0].acc_type === "individual" && isApprovedClient[0].is_in_trust_of) {
				emails.push(isApprovedClient[0].manag_email);
			}

			if (isApprovedClient[0].acc_type === "joint") {
				// @ts-ignore
				isApprovedClient[0].joint_partners.push((row: UserObj) => {
					emails.push(row.email);
				});
			}

			if (isApprovedClient[0].acc_type === "institution") {
				// @ts-ignore
				isApprovedClient[0].comp_managers.push((row: UserObj) => {
					emails.push(row.email);
				});
			}
			break;
		default:
			return json(
				{
					success: false,
					message: "Failed to send an OTP, please try again after 10 minutes.",
				},
				{ status: 400 },
			);
	}

	const obj: OTPBulkObj[] = [];

	const otp = genOTP();

	emails.forEach((email) => {
		obj.push({ id: email, otp, updated_at: genDbTimestamp() });
	});

	const emailReqs = emails.map((address) =>
		notif.email.sendOtp(
			{ otp, subject: "Sign In OTP | Stockbrokers Zambia", title: "One Time Passcode" },
			address,
		),
	);

	const [otpRes, emailReq] = await Promise.all([dbs.sbz.setBulkOtp(obj), ...emailReqs]);

	if (!otpRes.success)
		return json(
			{ success: false, message: "Failed to create OTP. Please wait a few minutes and try again." },
			{ status: 400 },
		);

	return json({ success: true, message: otpRes.message }, { status: 201 });
};

export const POST = async ({ request, cookies }) => {
	const { id, label, otp }: { label: "Admin Username" | "LuSE ID"; id: string; otp: number } =
		await request.json();

	const emails: string[] = [];

	switch (label) {
		case "Admin Username":
			const isApprovedAdmin = await dbs.sbz.getAdmin(id);

			if (!isApprovedAdmin.length)
				return json(
					{ success: false, message: "Please double check your username and try again." },
					{ status: 400 },
				);

			emails.push(isApprovedAdmin[0].email);
			break;
		case "LuSE ID":
			const isApprovedClient = await dbs.sbz.getClient(Number(id));

			if (!isApprovedClient.length)
				return json(
					{ success: false, message: "Please double check your LuSE ID and try again." },
					{ status: 400 },
				);

			if (isApprovedClient[0].acc_type === "individual" && !isApprovedClient[0].is_in_trust_of) {
				emails.push(isApprovedClient[0].email);
			}

			if (isApprovedClient[0].acc_type === "individual" && isApprovedClient[0].is_in_trust_of) {
				emails.push(isApprovedClient[0].manag_email);
			}

			if (isApprovedClient[0].acc_type === "joint") {
				// @ts-ignore
				isApprovedClient[0].joint_partners.push((row: UserObj) => {
					emails.push(row.email);
				});
			}

			if (isApprovedClient[0].acc_type === "institution") {
				// @ts-ignore
				isApprovedClient[0].comp_managers.push((row: UserObj) => {
					emails.push(row.email);
				});
			}
			break;
		default:
			return json(
				{
					success: false,
					message: "Failed to confirm an OTP, please try again after 10 minutes.",
				},
				{ status: 400 },
			);
	}

	const correct = await dbs.sbz.checkOtp({ otp, user: emails[0] });

	switch (correct.success) {
		case true:
			const admin = await dbs.sbz.getAdmin(id);
			dbs.sbz.log({ message: `Admin ${id} just logged in.`, title: "Login Attempt" });

			cookies.set("sbz-admin", genJwt(admin[0], "30d"), {
				path: "/",
				httpOnly: true,
				maxAge: 60 * 60 * 168,
				secure: true,
			});
			break;
		default:
			const client = await dbs.sbz.getClient(Number(id));
			dbs.sbz.log({ message: `Client ${id} just logged in.`, title: "Login Attempt" });

			cookies.set("sbz-client", genJwt(client[0], "30d"), {
				path: "/",
				httpOnly: true,
				maxAge: 60 * 60 * 168,
				secure: true,
			});
			break;
	}

	return json(
		{
			success: correct.success,
			message: correct.message,
			redirect: label === "Admin Username" ? "/admin/home" : "/dashboard/home", // correct.success ? "//home" : undefined,
		},
		{ status: correct.success ? 200 : 400 },
	);
};
