import dbs from "$lib/server/db";
import notif from "$lib/server/email";
import totp from "$lib/server/totp";
import { genOTP, print } from "$lib/utils";
import { json } from "@sveltejs/kit";

import type { SBZdb, Types } from "$lib/types";
import type { FileData } from "$lib/server/db/utils.js";
import kratos from "$lib/server/kratos";

// Set an OTP
export const PUT = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const { emails, phones }: { emails: string[]; phones: string[] } = await request.json();

	const otp = genOTP();

	const otpReq = await dbs.sbz.setOtp({ otp, user: emails.join(",,") });

	// if the DB fails to set the OTP
	if (!otpReq.success) return json(otpReq, { status: 400 });

	const emailReqs = await Promise.all(
		emails.map((address) =>
			notif.email.sendOtp(
				{ otp, subject: "Sign Up OTP | Stockbrokers Zambia", title: "One Time Passcode" },
				address,
			),
		),
	);

	let err = emailReqs.find((item) => !item);

	if (err) {
		return json(
			{
				success: false,
				message:
					"Failed to send an OTP to one or more of your provided emails. Please get in touch with tech support.",
			},
			{ status: 400 },
		);
	}

	return json(otpReq, { status: 200 });
};

// Confirm OTP and make account opening ticket
export const POST = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const formData = await request.formData();

	const otp = Number(formData.get("otp")); // comes in as string → cast to number
	const totpVal = String(formData.get("totp")); // comes in as string
	const emails = JSON.parse(formData.get("emails") as string) as string[]; // if multiple inputs named "emails"
	const obj = JSON.parse(
		formData.get("obj") as string,
	) as SBZdb["public"]["Tables"]["clients"]["Insert"];

	// now otp, emails, and obj have the right types
	// console.log({ otp, emails, obj });

	const secret = obj.signatures ? (obj.signatures as Types["ClientSignature"]) : undefined;

	try {
		/*
		const [serverOtp, serverTotp] = await Promise.all([
			dbs.sbz.checkOtp({ otp, user: emails.join(",,") }),
			totp.validate({ val: totpVal, secret: secret ? secret.value : "" }),
		]);

		if (!serverOtp.success) {
			return json(
				{
					success: false,
					message: "Failed to confirm your OTP, please ensure that it is correct and try again.",
				},
				{ status: 400 },
			);
		}

		if (!serverTotp) {
			return json(
				{
					success: false,
					message:
						"Failed to confirm your signature, please ensure that it is correct and try again.",
				},
				{ status: 400 },
			);
		}
		*/

		const files: FileData[] = [];

		const { acc_type, is_in_trust_of } = obj;

		// let queryHelper: string = "";
		let qWord = obj.luseId ? "opening" : "linking";

		const details: {
			name: string;
			email: string;
			luseId: number;
			idNumber: string;
			phone: string;
		} = {
			email: "",
			idNumber: "",
			luseId: obj.luseId ? obj.luseId : -1,
			name: "",
			phone: "",
		};

		const acoDoc = formData.get("aco") as Blob;

		files.push({ file: acoDoc, id: obj.id_num, type: "aco" });

		if (acc_type === "individual" && !is_in_trust_of) {
			const poa = formData.get(`${obj.id_num}-poa`) as File;
			const poi = formData.get(`${obj.id_num}-poi`) as File;
			// const selfie = formData.get(`${obj.id_num}-selfie`) as Blob;

			files.push({ file: poa, id: obj.id_num, type: "poa" });
			files.push({ file: poi, id: obj.id_num, type: "poi" });
			// files.push({ file: selfie, id: obj.id_num, type: "selfie" });

			details.email = obj.email;
			details.idNumber = obj.id_num;
			details.name = `${obj.fname} ${obj.lname}`;
			details.phone = obj.phone.toString();
			// queryHelper = `Requesting the ${qWord} of an individual account for ${details.name}`;
		}

		if (acc_type === "individual" && is_in_trust_of) {
			const poa = formData.get(`${obj.manag_id_num}-poa`) as File;
			const poi = formData.get(`${obj.manag_id_num}-poi`) as File;
			// const selfie = formData.get(`${obj.id_num}-selfie`) as Blob;

			files.push({ file: poa, id: obj.manag_id_num, type: "poa" });
			files.push({ file: poi, id: obj.manag_id_num, type: "poi" });
			// files.push({ file: selfie, id: obj.manag_id_num, type: "selfie" });

			details.email = obj.manag_email;
			details.idNumber = obj.manag_id_num;
			details.name = `${obj.manag_fname} ${obj.manag_lname}`;
			details.phone = obj.manag_phone.toString();
			// queryHelper = `Requesting the ${qWord} of an in trust of account for ${obj.fname} ${obj.lname} managed by ${details.name}.`;
		}

		if (obj.joint_partners.length) {
			//@ts-ignore
			const partners: UserObj[] = obj.joint_partners;

			partners.forEach((row, i) => {
				const poa = formData.get(`${row.idNum}-poa`) as File;
				const poi = formData.get(`${row.idNum}-poi`) as File;
				// const selfie = formData.get(`${obj.id_num}-selfie`) as Blob;

				files.push({ file: poa, id: row.idNum, type: "poa" });
				files.push({ file: poi, id: row.idNum, type: "poi" });
				// files.push({ file: selfie, id: row.idNum, type: "selfie" });

				if (!i) {
					details.email = row.email;
					details.name = `${row.fname} ${row.lname}`;
					details.idNumber = row.idNum;
					details.phone = obj.phone.toString();
				}

				if (i && i < partners.length - 1) {
					details.name = `${details.name}, ${row.fname} ${row.lname}`;
				} else if (i === partners.length - 1) {
					details.name = `${details.name}, and ${row.fname} ${row.lname}`;
				}

				// queryHelper = `Requesting the ${qWord} of a joint account for ${details.name}.`;
			});
		}

		if (obj.comp_directors.length) {
			//@ts-ignore
			const directors: UserObj[] = obj.comp_directors;

			directors.forEach((row) => {
				const poa = formData.get(`${row.idNum}-poa`) as File;
				const poi = formData.get(`${row.idNum}-poi`) as File;
				// const selfie = formData.get(`${obj.id_num}-selfie`) as Blob;

				files.push({ file: poa, id: row.idNum, type: "poa" });
				files.push({ file: poi, id: row.idNum, type: "poi" });
				// files.push({ file: selfie, id: row.idNum, type: "selfie" });

				// queryHelper = `Requesting the ${qWord} of an institutional account for ${obj.fname}.`;
			});
		}

		if (obj.comp_managers.length) {
			//@ts-ignore
			const managers: UserObj[] = obj.comp_managers;

			managers.forEach((row, i) => {
				const poa = formData.get(`${row.idNum}-poa`) as File;
				const poi = formData.get(`${row.idNum}-poi`) as File;
				// const selfie = formData.get(`${obj.id_num}-selfie`) as Blob;

				files.push({ file: poa, id: row.idNum, type: "poa" });
				files.push({ file: poi, id: row.idNum, type: "poi" });
				// files.push({ file: selfie, id: row.idNum, type: "selfie" });

				if (!i) {
					details.name = `${row.fname} ${row.lname}`;
					details.idNumber = row.idNum;
					details.email = row.email;
					details.phone = obj.phone.toString();
				}

				/*
				if (i && i < managers.length - 1) {
					// details.name = `${details.name}, ${row.fname} ${row.lname}`;
				} else if (i === managers.length - 1) {
					details.name = `${details.name}, and ${row.fname} ${row.lname}`;
				}
					*/
			});
		}

		await dbs.sbz.uploadKyc(files);

		print(obj);

		const res = await dbs.sbz.openAccount(obj, true, sender.username);

		return json(res, { status: res.success ? 201 : 400 });
	} catch (ex) {
		console.error("\n\n", ex, "\n\n");
		return json({ success: false, message: String(ex) }, { status: 400 });
	}
};
