import kratos from "$lib/server/kratos";
import dbs from "$lib/server/db/index.js";
import { json } from "@sveltejs/kit";

export const POST = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const { uid, config }: { uid: string; config: "portfolio" | "file" } = await request.json();

	switch (config) {
		case "portfolio":
			const resPortfolio = await dbs.sbz.getPortfolio(Number(uid));
			return json(resPortfolio, { status: resPortfolio.success ? 200 : 400 });
		case "file":
			return json({ success: true, message: "W.I.P" }, { status: 400 });
		default:
			await dbs.sbz.log({
				message: `/api/admin/clients => { uid: ${uid}, config: ${config} }`,
				title: "Site Invalid Payload",
			});
			return json(
				{ success: false, message: "Received an invalid request payload." },
				{ status: 400 },
			);
	}
};
