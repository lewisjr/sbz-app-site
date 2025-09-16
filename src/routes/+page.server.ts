import { redirect } from "@sveltejs/kit";

export const load = (data) => {
	const { cookies } = data;

	const admin = cookies.get("sbz-admin");

	if (admin) redirect(307, "/admin/home");

	const client = cookies.get("sbz-client");

	if (client) redirect(307, "/dashboard/home");
};
