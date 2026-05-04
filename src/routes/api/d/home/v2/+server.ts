import { json } from "@sveltejs/kit";
import kratos from "$lib/server/kratos";
import { sbzdb } from "$lib/server/db/db.js";

const requestFolioUpdate = async ({
	email,
	fname,
	luseId,
}: {
	luseId: number;
	fname: string;
	email: string;
}) => {
	try {
		const { error } = await sbzdb.from("pf-reqs").insert({ email, fname, id: luseId });

		if (error) {
			console.error("\n\n=== requestFolioUpdate e1\n", error, "\m===\n\n");
			return false;
		}

		return true;
	} catch (ex) {
		console.error("\n\n=== requestFolioUpdate exception\n", ex, "\m===\n\n");
		return false;
	}
};

export const PUT = async (event) => {
	const user = await kratos.client(event);

	if (user instanceof Response) return user;

	const { luseId, email, fname: names } = user;
	const fname = names.split(" ")[0];

	const { cfg }: { cfg: "folio-update" } = await event.request.json();

	switch (cfg) {
		case "folio-update":
			const fUres = await requestFolioUpdate({ email, fname, luseId });

			return json(
				{
					success: fUres,
					message: fUres
						? "Portfolio updated requested, you will receive an email soon."
						: "Please try again after 5 minutes.",
				},
				{ status: fUres ? 201 : 400 },
			);

		default:
			return json({ success: false, message: "Resource unavailable" }, { status: 400 });
	}
};
