import { json } from "@sveltejs/kit";
import kratos from "$lib/server/kratos.js";

import type { GenericResponseWData } from "$lib/types/index";

import { SERVER_API_KEY, SERVER_BASE_URL, DEV } from "$env/static/private";

const IS_DEV = DEV === "y";

export const POST = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const obj = await request.json();

	const { clientUid, data, config } = obj;

	if (Object.keys(data).includes("adminEmail")) {
		data.adminEmail = IS_DEV ? "privatodato@gmail.com" : sender.email;
	}

	try {
		const odynReq = await fetch(`${SERVER_BASE_URL}/actions/fb`, {
			method: "POST",
			body: JSON.stringify({ clientUid, config, data, sender: sender.username }),
			headers: {
				"X-API-KEY": Buffer.from(SERVER_API_KEY, "utf8").toString("base64"),
			},
		});

		const odynRes: GenericResponseWData<undefined> = await odynReq.json();

		if (!odynRes.success)
			return json(
				{
					success: false,
					message: odynRes.message,
					data: odynRes.data,
				},
				{ status: 400 },
			);

		return json(
			{
				success: odynRes.success,
				message: odynRes.message,
				data: odynRes.data,
			},
			{ status: odynRes.success ? 200 : 400 },
		);
	} catch (ex) {
		console.error("\n", ex, "\n");
		return json(
			{
				success: false,
				message: "",
				data: undefined,
			},
			{ status: 500 },
		);
	}
};

export const PUT = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const obj = await request.json();

	const { clientUid, data } = obj;

	try {
		const odynReq = await fetch(`${SERVER_BASE_URL}/actions/fb`, {
			method: "POST",
			body: JSON.stringify({ clientUid, config: "chat", data, sender: sender.username }),
			headers: {
				"X-API-KEY": Buffer.from(SERVER_API_KEY, "utf8").toString("base64"),
			},
		});

		const odynRes: GenericResponseWData<undefined> = await odynReq.json();

		if (!odynRes.success)
			return json(
				{
					success: false,
					message: "Failed to send your message, please try again in a few minutes.",
					data: odynRes.data,
				},
				{ status: 400 },
			);

		return json(
			{
				success: odynRes.success,
				message: odynRes.message,
				data: odynRes.data,
			},
			{ status: odynRes.success ? 200 : 400 },
		);
	} catch (ex) {
		console.error("\n", ex, "\n");
		return json(
			{
				success: false,
				message: "",
				data: undefined,
			},
			{ status: 500 },
		);
	}
};
