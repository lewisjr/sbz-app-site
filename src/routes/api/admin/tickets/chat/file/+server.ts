import { json } from "@sveltejs/kit";
import dbs from "$lib/server/db";
import kratos from "$lib/server/kratos.js";

export const POST = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const form = await request.formData();

	const id = form.get("id") as string;
	const files = form.getAll("files") as File[];

	if (!id || !files || !files.length) {
		return json(
			{
				success: false,
				message: "The file failed to upload, try refreshing the page and trying again.",
			},
			{ status: 400 },
		);
	}

	try {
		const req = await dbs.sbz.uploadFiles(files, id);

		return json(
			{
				success: req,
				message: req ? "Failed to send message, please try again in a few minutes." : "",
			},
			{ status: req ? 201 : 400 },
		);
	} catch {
		return json(
			{ success: false, message: "Server error, please try again in a few minutes." },
			{ status: 500 },
		);
	}
};
