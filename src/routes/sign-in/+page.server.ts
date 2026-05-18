import { redirect } from "@sveltejs/kit";

export const load = (data) => {
	const { cookies, url } = data;

	const admin = cookies.get("sbz-admin");

	if (admin) redirect(307, "/admin/tickets");

	const client = cookies.get("sbz-client");

	if (client) redirect(307, "/access");

	const isApp = cookies.get("sbz-push");

	if (isApp) redirect(307, "/access");

	const token = url.searchParams.get("token");
	const isAppTwo = token !== null;

	if (isAppTwo) redirect(307, "/access");
};
