import { redirect } from "@sveltejs/kit";
import { DEV } from "$env/static/private";

export const load = (data) => {
	// kratosSafety(data);

	const { cookies } = data;

	if (DEV !== "y") {
		cookies.delete("sbz-client", { path: "/" });
		cookies.delete("sbz-client-mail", { path: "/" });
	}

	const admin = cookies.get("sbz-admin");

	if (admin) redirect(307, "/admin/home");

	const client = cookies.get("sbz-client");

	if (client) redirect(307, "/dashboard/home");
};
