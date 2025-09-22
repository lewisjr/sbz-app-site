import { redirect } from "@sveltejs/kit";

export const load = ({ route }) => {
	if (route.id === "/track") redirect(307, "/sign-in");
};
