import { json } from "@sveltejs/kit";
import { sbzdb } from "$lib/server/db/db.js";
import type { Database } from "$lib/types/db.types.js";
import dbs from "$lib/server/db/index.js";

type Client = Database["public"]["Tables"]["clients"]["Row"];

const checkIfUserIsInWatingRoom = async (luseId: number): Promise<Client | false | undefined> => {
	try {
		const users = await dbs.sbz.getClient(luseId);

		if (!users.length) {
			return false;
		}

		const user = users[0];

		if (user.luseId < 0) return undefined;
		if (user.cv_num === "") return undefined;

		return user;
	} catch (ex) {
		console.error("\n=== checkIfUserIsInWatingRoom ERROR\n", ex);
		return false;
	}
};

export const GET = async (event) => {
	try {
		const li = Number(event.url.searchParams.get("user"));

		const user = await checkIfUserIsInWatingRoom(li);

		if (typeof user === "boolean") {
			return json(
				{
					success: false,
					message:
						"This LuSE ID is not in our system, you may either double check the LuSE ID, or proceed to onbord.",
				},
				{ status: 404 },
			);
		}

		if (typeof user === "undefined") {
			return json(
				{
					success: false,
					message:
						"This client is currently in the waiting room and will be assigned a CV and LuSE ID in due time.",
				},
				{ status: 403 },
			);
		}

		const kyc = await dbs.sbz.getFiles(li.toString());

		return json({ success: true, message: "", data: { user, kyc } }, { status: 201 });
	} catch (ex) {
		return json(
			{ success: false, message: "Server error; Please wait 5 minutes or contact support." },
			{ status: 500 },
		);
	}
};
