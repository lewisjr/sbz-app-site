import { scourgeOfInvestor, userEmailFinder } from "$lib/server/jwt";
import dbs from "$lib/server/db/index.js";

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

	let names: string = "";
	let idNum: string = "";
	let email: string = "";

	const emailCookie = userEmailFinder(data);

	if (emailCookie) {
		names = _getName(client.data, emailCookie.data);
		idNum = _getId(client.data, emailCookie.data);
		email = emailCookie.data;
	}

	return {
		names,
		idNum,
		email,
	};
};
