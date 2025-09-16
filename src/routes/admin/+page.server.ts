import { redirect } from "@sveltejs/kit";

export const load = ({ route }) => {
	if (route.id === "/admin") redirect(307, "/admin/home");
};
