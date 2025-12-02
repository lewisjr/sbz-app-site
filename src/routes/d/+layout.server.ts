import { scourgeOfInvestor } from "$lib/server/jwt";

import type { Types } from "$lib/types/index.js";
import type { UserObj } from "../api/su/+server.js";

export const load = (data) => {
	const client = scourgeOfInvestor(data);

	const { acc_type, luseId, signatures } = client.data;

	const hasSignature: boolean = Object.keys(signatures ? signatures : {}).length > 0;
	const accountType: Types["AccountType"] = acc_type as any;

	const accountHolders: UserObj[] = [];

	if (accountType === "individual") {
		//accountHolders.push({  })
	}

	return {
		hasSignature,
		luseId,
		accountHolders,
	};
};
