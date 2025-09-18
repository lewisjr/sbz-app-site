import dbs from "$lib/server/db";
import notif from "$lib/server/email";
import { genOTP } from "$lib/utils";
import { json } from "@sveltejs/kit";
import { toTitleCase } from "@cerebrusinc/fstring";

import type { SBZdb } from "$lib/types";
import type { FileData } from "$lib/server/db/utils.js";

export interface UserObj {
	//details
	fname: string;
	lname: string;
	phone: string;
	email: string;
	dob: string;
	gender: string;
	mstatus: string;
	nationality: string;
	//address
	street: string;
	city: string;
	country: string;
	//identity
	idType: string;
	idNum: string;
}

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
export const POST = async ({ request }) => {
	const formData = await request.formData();

	const otp = Number(formData.get("otp")); // comes in as string → cast to number
	const emails = JSON.parse(formData.get("emails") as string) as string[]; // if multiple inputs named "emails"
	const obj = JSON.parse(
		formData.get("obj") as string,
	) as SBZdb["public"]["Tables"]["clients"]["Insert"];
	const referral_source = formData.get("referral") as string;

	// now otp, emails, and obj have the right types
	console.log({ otp, emails, obj });

	const serverOtp = await dbs.sbz.checkOtp({ otp, user: emails.join(",,") });

	if (!serverOtp.success)
		return json(
			{
				success: false,
				message: "Failed to confirm your OTP, please ensure that it is correct and try again.",
			},
			{ status: 400 },
		);

	const files: FileData[] = [];

	const { acc_type, is_in_trust_of } = obj;

	let queryHelper: string = "";
	const details: { name: string; email: string; luseId: number; idNumber: string; phone: string } =
		{
			email: "",
			idNumber: "",
			luseId: obj.luseId ? obj.luseId : -1,
			name: "",
			phone: "",
		};

	if (acc_type === "individual" && !is_in_trust_of) {
		const poa = formData.get(`${obj.id_num}-poa`) as File;
		const poi = formData.get(`${obj.id_num}-poi`) as File;

		files.push({ file: poa, id: obj.id_num, type: "poa" });
		files.push({ file: poi, id: obj.id_num, type: "poi" });

		details.email = obj.email;
		details.idNumber = obj.id_num;
		details.name = `${obj.fname} ${obj.lname}`;
		details.phone = obj.phone.toString();
		queryHelper = `Requesting the opening of an individual account for ${details.name}`;
	}

	if (acc_type === "individual" && is_in_trust_of) {
		const poa = formData.get(`${obj.manag_id_num}-poa`) as File;
		const poi = formData.get(`${obj.manag_id_num}-poi`) as File;

		files.push({ file: poa, id: obj.manag_id_num, type: "poa" });
		files.push({ file: poi, id: obj.manag_id_num, type: "poi" });

		details.email = obj.manag_email;
		details.idNumber = obj.manag_id_num;
		details.name = `${obj.manag_fname} ${obj.manag_lname}`;
		details.phone = obj.manag_phone.toString();
		queryHelper = `Requesting the opening of an in trust of account for ${obj.fname} ${obj.lname} managed by ${details.name}.`;
	}

	if (obj.joint_partners.length) {
		//@ts-ignore
		const partners: UserObj[] = obj.joint_partners;

		partners.forEach((row, i) => {
			const poa = formData.get(`${row.idNum}-poa`) as File;
			const poi = formData.get(`${row.idNum}-poi`) as File;

			files.push({ file: poa, id: row.idNum, type: "poa" });
			files.push({ file: poi, id: row.idNum, type: "poi" });

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

			queryHelper = `Requesting the opening of a joint account for ${details.name}.`;
		});
	}

	if (obj.comp_directors.length) {
		//@ts-ignore
		const directors: UserObj[] = obj.comp_directors;

		directors.forEach((row) => {
			const poa = formData.get(`${row.idNum}-poa`) as File;
			const poi = formData.get(`${row.idNum}-poi`) as File;

			files.push({ file: poa, id: row.idNum, type: "poa" });
			files.push({ file: poi, id: row.idNum, type: "poi" });
		});
	}

	if (obj.comp_managers.length) {
		//@ts-ignore
		const managers: UserObj[] = obj.comp_managers;

		managers.forEach((row, i) => {
			const poa = formData.get(`${row.idNum}-poa`) as File;
			const poi = formData.get(`${row.idNum}-poi`) as File;

			files.push({ file: poa, id: row.idNum, type: "poa" });
			files.push({ file: poi, id: row.idNum, type: "poi" });

			if (!i) {
				details.email = row.email;
				details.name = `${row.fname} ${row.lname}`;
				details.idNumber = row.idNum;
				details.phone = obj.phone.toString();
			}

			if (i && i < managers.length - 1) {
				details.name = `${details.name}, ${row.fname} ${row.lname}`;
			} else if (i === managers.length - 1) {
				details.name = `${details.name}, and ${row.fname} ${row.lname}`;
			}

			queryHelper = `Requesting the opening of a joint account for ${details.name}.`;
		});
	}

	const agent = await dbs.sbz.getTicketCandidate();

	// create ticket
	const ticketRes = await dbs.sbz.createTicket(
		{
			assigned: agent.data.agentId,
			email: details.email,
			id: "",
			id_num: details.idNumber,
			luse_id: -1,
			names: details.name,
			phone: details.phone,
			query: queryHelper,
			query_type: "Account Opening",
			object: obj,
			platform: "Web",
			uid: details.email,
			referral_source,
		},
		agent.data,
	);

	if (!ticketRes.success)
		return json(
			{
				success: false,
				message: "Failed to submit your request. Please try again in a few minutes.",
			},
			{ status: 400 },
		);

	const updateAgentReq = dbs.sbz.updateTicketCandidate(agent.data);
	const uploadKycReq = dbs.sbz.uploadKyc(files);

	const emailReqs = emails.map((address) =>
		notif.email.sendLink(
			{
				subject: "Account Opening | Stockbrokers Zambia",
				title: "Request Received!",
				body: `Your account opening submission has been received and assigned to <b>${toTitleCase(agent.data.agentId)}</b> with ticket number <b>${ticketRes.data}</b>. This process usually takes <b>24 hours</b> and you will be notified.`,
				extra:
					"Please click the link above to view the progress of your request, as well as to upload your biometric signature(s).",
				link: `https://app.sbz.com.zm/track/${ticketRes.data}`,
				linkText: "View Progress",
			},
			address,
		),
	);

	const [updateAgentRes, uploadKycRes] = await Promise.all([
		updateAgentReq,
		uploadKycReq,
		...emailReqs,
	]);

	return json({ success: true, message: "Request submitted!" }, { status: 201 });
};
