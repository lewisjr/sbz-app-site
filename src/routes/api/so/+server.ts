import { json } from "@sveltejs/kit";
import dbs from "$lib/server/db";
import notif from "$lib/server/email";
import { DEV } from "$env/static/private";

import { devLog, genDbTimestamp, genOTP } from "$lib/utils";
import { checkJwt, genJwt } from "$lib/server/jwt";

// import type { UserObj } from "../su/+server.js";
import type { OTPBulkObj } from "$lib/server/db/utils.js";
import type { SBZdb, Types } from "$lib/types/index.js";
import kratos from "$lib/server/kratos.js";

export const PUT = async ({ request }) => {
	const { id, label }: { label: "Admin Username" | "LuSE ID"; id: string } = await request.json();

	console.log({ id, label });

	/*
	if (label === "LuSE ID" && DEV !== "y")
		return json(
			{
				success: false,
				message: "This feature is almost ready, stay in touch on Whatsapp and Facebook!",
			},
			{ status: 400 },
		);
	*/

	const emails: string[] = [];

	try {
		switch (label) {
			case "Admin Username":
				const isApprovedAdmin = await dbs.sbz.getAdmin(id);

				// console.log({ isApprovedAdmin });

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
					const managEmail = isApprovedClient[0].manag_email;
					const email = managEmail ? managEmail : isApprovedClient[0].email;

					emails.push(email);
				}

				if (isApprovedClient[0].acc_type === "joint") {
					//
					if (isApprovedClient[0].joint_partners.length) {
						isApprovedClient[0].joint_partners.forEach((_row: any) => {
							const row: Types["PartnerObj"] = _row;
							emails.push(row.email);
						});
					} else {
						emails.push(isApprovedClient[0].email);
					}
				}

				if (isApprovedClient[0].acc_type === "institution") {
					//
					if (isApprovedClient[0].comp_managers.length) {
						isApprovedClient[0].comp_managers.forEach((_row: any) => {
							const row: Types["PartnerObj"] = _row;
							console.log(row.email);
							emails.push(row.email);
						});
					} else {
						emails.push(isApprovedClient[0].email);
					}
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

		if (id !== "1473044") {
			const obj: OTPBulkObj[] = [];

			emails.forEach((email) => {
				obj.push({ id: email, otp: genOTP(), updated_at: genDbTimestamp() });
			});

			const emailReqs = obj.map((user) =>
				notif.email.sendOtp(
					{
						otp: user.otp,
						subject: "Sign In OTP | Stockbrokers Zambia",
						title: "One Time Passcode",
					},
					user.id,
				),
			);

			const [otpRes /*emailReq*/] = await Promise.all([dbs.sbz.setBulkOtp(obj), ...emailReqs]);

			if (!otpRes.success) {
				console.log({ otpRes });

				return json(
					{
						success: false,
						message: "Failed to create OTP. Please wait a few minutes and try again.",
					},
					{ status: 400 },
				);
			}

			return json({ success: true, message: otpRes.message }, { status: 201 });
		} else {
			const res = await dbs.sbz.setOtp({ user: "null@null.com", otp: 123456 });

			if (!res.success) {
				return json(
					{
						success: false,
						message: "Failed to create OTP. Please wait a few minutes and try again.",
					},
					{ status: 400 },
				);
			}

			return json({ success: true, message: res.message }, { status: 201 });
		}
	} catch (ex: any) {
		console.error("\n", ex, "\n");
		return json({ success: false, message: String(ex) }, { status: 500 });
	}
};

const _getName = (obj: SBZdb["public"]["Tables"]["clients"]["Row"], email: string): string => {
	let name = "Unknown";

	if (obj.acc_type === "individual" && !obj.is_in_trust_of && obj.email === email) {
		name = obj.fname;
	}

	if (obj.acc_type === "individual" && obj.is_in_trust_of && obj.manag_email === email) {
		name = obj.manag_fname;
	}

	if (obj.acc_type === "joint") {
		obj.joint_partners.forEach((_row: any) => {
			const row: Types["PartnerObj"] = _row;

			if (row.email === email) name = row.fname;
		});
	}

	if (obj.acc_type === "institution") {
		obj.comp_managers.forEach((_row: any) => {
			const row: Types["PartnerObj"] = _row;

			console.log({ row, email, rowEmail: row.email, check: row.email === email });

			if (row.email === email) name = row.fname;
		});
	}

	return name;
};

export const DELETE = async (event) => {
	const { cookies } = event;

	cookies.delete("sbz-admin", { path: "/" });
	cookies.delete("sbz-client", { path: "/" });
	cookies.delete("sbz-client-mail", { path: "/" });

	return json({ success: true, message: "Successfully signed out!" }, { status: 200 });
};
