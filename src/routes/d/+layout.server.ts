import { scourgeOfInvestor, userEmailFinder } from "$lib/server/jwt";

import type { SBZdb, Types } from "$lib/types";

const _getName = (obj: SBZdb["public"]["Tables"]["clients"]["Row"], email: string): string => {
	let name = "Unknown";

	if (obj.acc_type === "individual" && !obj.is_in_trust_of && obj.email === email) {
		name = `${obj.fname} ${obj.lname}`;
	}

	if (obj.acc_type === "individual" && obj.is_in_trust_of && obj.manag_email === email) {
		name = `${obj.manag_fname} ${obj.manag_lname}`;
	}

	if (obj.acc_type === "joint") {
		obj.joint_partners.forEach((_row: any) => {
			const row: Types["PartnerObj"] = _row;

			if (row.email === email) name = `${row.fname} ${row.lname}`;
		});
	}

	if (obj.acc_type === "institution") {
		obj.comp_managers.forEach((_row: any) => {
			const row: Types["PartnerObj"] = _row;

			//console.log({ row, email, rowEmail: row.email, check: row.email === email });

			if (row.email === email) name = `${row.fname} ${row.lname}`;
		});
	}

	if (name === "Unknown") name = `${obj.fname} ${obj.lname}`;

	return name;
};

const _getId = (obj: SBZdb["public"]["Tables"]["clients"]["Row"], email: string): string => {
	let id = "Unknown";

	if (obj.acc_type === "individual" && !obj.is_in_trust_of && obj.email === email) {
		id = obj.id_num;
	}

	if (obj.acc_type === "individual" && obj.is_in_trust_of && obj.manag_email === email) {
		id = obj.manag_id_num;
	}

	if (obj.acc_type === "joint") {
		obj.joint_partners.forEach((_row: any) => {
			const row: Types["PartnerObj"] = _row;

			if (row.email === email) id = row.idNum;
		});
	}

	if (obj.acc_type === "institution") {
		obj.comp_managers.forEach((_row: any) => {
			const row: Types["PartnerObj"] = _row;

			// console.log({ row, email, rowEmail: row.email, check: row.email === email });

			if (row.email === email) id = row.idNum;
		});
	}

	return id;
};

export const load = (data) => {
	const client = scourgeOfInvestor(data);

	const {
		acc_type,
		luseId,
		signatures,
		is_in_trust_of,
		city,
		country,
		dob,
		email,
		fname,
		lname,
		gender,
		id_num,
		id_type,
		mstatus,
		nationality,
		phone,
		street,
	} = client.data;

	const hasSignature: boolean = Object.keys(signatures ? signatures : {}).length > 0;
	const accountType: Types["AccountType"] = acc_type as any;

	const accountHolders: Types["PartnerObj"][] = [];

	if (accountType === "individual") {
		accountHolders.push({
			city,
			country,
			dob,
			email,
			fname,
			gender,
			idNum: id_num,
			idType: id_type,
			lname,
			mstatus,
			nationality,
			phone: phone.toString(),
			street,
		});
	}

	if (accountType === "joint" && client.data.joint_partners) {
		// @ts-ignore
		accountHolders.push(...client.data.joint_partners);
	}

	if (accountType === "institution" && client.data.comp_directors) {
		// @ts-ignore
		accountHolders.push(...client.data.comp_directors);
	}

	let names: string = "";
	let idNum: string = "";
	let e_mail: string = "";

	const emailCookie = userEmailFinder(data);

	if (emailCookie) {
		names = _getName(client.data, emailCookie.data);
		idNum = _getId(client.data, emailCookie.data);
		e_mail = emailCookie.data;
	}

	return {
		hasSignature,
		luseId,
		accountHolders,
		accountType: is_in_trust_of ? "In Trust Of" : accountType,
		names,
		idNum,
		email: e_mail,
		isLocal: nationality.toLowerCase() === "zambian",
	};
};
