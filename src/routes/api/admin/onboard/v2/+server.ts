import { sbzdb } from "$lib/server/db/db";
import { json } from "@sveltejs/kit";
import { numParse } from "@cerebrusinc/qol";

export const GET = async (event) => {
	try {
		const cv = event.url.searchParams.get("user");

		if (!cv)
			return json(
				{
					success: false,
					message: "No CV number provided.",
				},
				{ status: 400 },
			);

		const { data, error } = await sbzdb.from("clients").select().filter("cv_num", "eq", cv);

		if (error) {
			return json(
				{
					success: false,
					message: error.message,
				},
				{ status: 400 },
			);
		}

		if (data.length > 1) {
			return json(
				{
					success: false,
					message: `Oh snap! There are ${numParse(data.length)} accounts with CV number: ${cv}`,
				},
				{ status: 400 },
			);
		}

		return json({ success: true, message: "", data: data[0] }, { status: 201 });
	} catch (ex) {
		return json(
			{ success: false, message: "Server error; Please wait 5 minutes or contact support." },
			{ status: 500 },
		);
	}
};
