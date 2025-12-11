import { json } from "@sveltejs/kit";
import dbs from "$lib/server/db";
import notif from "$lib/server/email";

import { devLog, genDbTimestamp, genOTP } from "$lib/utils";
import { genJwt } from "$lib/server/jwt";

// import type { UserObj } from "../su/+server.js";
import type { OTPBulkObj } from "$lib/server/db/utils.js";
import type { SBZdb, Types } from "$lib/types/index.js";

export const PUT = async ({ request }) => {
	const { id, label }: { label: "Admin Username" | "LuSE ID"; id: string } = await request.json();

	console.log({ id, label });

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

		const obj: OTPBulkObj[] = [];

		emails.forEach((email) => {
			obj.push({ id: email, otp: genOTP(), updated_at: genDbTimestamp() });
		});

		const emailReqs = obj.map((user) =>
			notif.email.sendOtp(
				{ otp: user.otp, subject: "Sign In OTP | Stockbrokers Zambia", title: "One Time Passcode" },
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
				isApprovedClient[0].joint_partners.forEach((_row: any) => {
					const row: Types["PartnerObj"] = _row;
					emails.push(row.email);
				});
			}

			if (isApprovedClient[0].acc_type === "institution") {
				isApprovedClient[0].comp_managers.forEach((_row: any) => {
					const row: Types["PartnerObj"] = _row;
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

	if (label === "Admin Username") {
		const correct = await dbs.sbz.checkOtp({ otp, user: emails[0] });

		if (correct.success) {
			const admin = await dbs.sbz.getAdmin(id);
			dbs.sbz.log({ message: `Admin ${id} just logged in.`, title: "Login Attempt" });

			cookies.set("sbz-admin", genJwt(admin[0], "30d"), {
				path: "/",
				httpOnly: true,
				// s m h d
				maxAge: 60 * 60 * 24 * 30,
				secure: true,
			});
		}

		return json(
			{
				success: correct.success,
				message: correct.message,
				redirect: "/admin/home", // correct.success ? "//home" : undefined,
			},
			{ status: correct.success ? 200 : 400 },
		);
	} else {
		const correct = await dbs.sbz.checkOtpTwo({ otp, users: emails });

		if (correct.success) {
			const client = await dbs.sbz.getClient(Number(id));

			Promise.all([
				dbs.sbz.log({
					message: `Client ${id} (${_getName(client[0], correct.data)}) just logged in.`,
					title: "Login Attempt",
				}),
				dbs.sbz.deepStat({ key: "login", section: "client", sender: id, value: 1 }),
			]);

			cookies.set("sbz-client", genJwt(client[0], "30d"), {
				path: "/",
				httpOnly: true,
				// s m h d
				maxAge: 60 * 60 * 24 * 30,
				secure: true,
			});

			cookies.set("sbz-client-mail", genJwt(correct.data, "30d"), {
				path: "/",
				httpOnly: true,
				// s m h d
				maxAge: 60 * 60 * 24 * 30,
				secure: true,
			});
		}

		return json(
			{
				success: correct.success,
				message: correct.message,
				redirect: "/d/home", // correct.success ? "//home" : undefined,
			},
			{ status: correct.success ? 200 : 400 },
		);
	}
};

export const DELETE = async ({ cookies }) => {
	cookies.delete("sbz-admin", { path: "/" });
	cookies.delete("sbz-client", { path: "/" });
	cookies.delete("sbz-client-mail", { path: "/" });

	return json({ success: true, message: "Successfully signed out!" }, { status: 200 });
};
