import totp from "$lib/server/totp.js";
import dbs from "$lib/server/db/index.js";
import { json } from "@sveltejs/kit";

/**Confirm a signature */
export const POST = async ({ params }) => {
	const { uid } = params;

	try {
		const signature = await totp.gen(uid);

		return json(signature, { status: signature.success ? 201 : 400 });
	} catch (ex: any) {
		await dbs.sbz.log({ title: "POST site /api/sign error", message: String(ex) });
		console.error(ex);
		return json(
			{
				success: false,
				message: "Failed to validate your signature, please try again in a few minutes.",
			},
			{ status: 400 },
		);
	}
};
