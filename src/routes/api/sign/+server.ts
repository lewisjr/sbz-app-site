import totp from "$lib/server/totp.js";
import dbs from "$lib/server/db/index.js";
import { json } from "@sveltejs/kit";

import type { Types } from "$lib/types/others.js";
import { genJwt } from "$lib/server/jwt.js";

/**Confirm a signature */
export const POST = async ({ request }) => {
	const {
		luseId,
		totpVal,
		location,
		check,
	}: { luseId: string; totpVal: string; location: string; check?: string } = await request.json();

	try {
		let obj: Types["ClientSignature"] = { backups: {}, value: "" };

		if (!check) {
			const client = await dbs.sbz.getClient(Number(luseId));

			if (!client.length || !client[0]) {
				return json(
					{ success: false, message: "Ensure your LuSE ID and ID number are correct." },
					{ status: 400 },
				);
			}

			obj = client[0].signatures as Types["ClientSignature"];
		} else {
			obj = { backups: {}, value: check };
		}

		const isCorrect = totp.validate({ val: totpVal, secret: obj.value });

		if (!isCorrect) {
			return json({ success: false, message: "Incorrect signature provided." }, { status: 400 });
		}

		await dbs.sbz.log({
			title: "Signature!",
			message: `Client '${luseId}' just signed a ${location}`,
		});

		return json({ success: true, message: "" }, { status: 200 });
	} catch (ex: any) {
		await dbs.sbz.log({ title: "POST site /api/sign error", message: String(ex) });
		return json(
			{
				success: false,
				message: "Failed to validate your signature, please try again in a few minutes.",
			},
			{ status: 400 },
		);
	}
};

/**Use a backup code */
export const PATCH = async ({ request, cookies }) => {
	const { luseId, totpVal, idNum }: { luseId: string; totpVal: string; idNum: string } =
		await request.json();

	try {
		const isCorrect = await totp.useBackup(Number(luseId), idNum, totpVal);

		if (!isCorrect) {
			return json({ success: false, message: "Invalid code provided." }, { status: 400 });
		}

		cookies.set("sbz-forgot-bypass", genJwt({ value: true }, "4h"), {
			path: "/",
			httpOnly: true,
			maxAge: 60 * 60 * 4,
			secure: true,
		});

		return json({ success: true, message: "This reset expires within 4 hours." }, { status: 200 });
	} catch (ex: any) {
		await dbs.sbz.log({ title: "POST site /api/sign error", message: String(ex) });
		return json(
			{
				success: false,
				message: "Failed to validate your signature, please try again in a few minutes.",
			},
			{ status: 400 },
		);
	}
};
