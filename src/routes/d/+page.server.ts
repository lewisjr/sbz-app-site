import { redirect } from "@sveltejs/kit";

export const load = ({ route }) => {
	if (route.id === "/d") redirect(307, "/d/home");
};
