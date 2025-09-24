import { genJwt } from "$lib/server/jwt.js";
import { redirect } from "@sveltejs/kit";

import { DEV } from "$env/static/private";

const adminObj = {
	username: "lewis",
	created_at: "2025-08-20T20:14:55.407022+00:00",
	created_by: "lewis",
	full_names: "Lewis Mosho",
	phone: "260776552592",
	email: "lewiscerebrus@gmail.com",
	permissions: "",
	department: "IT",
	ticketable: true,
};

export const load = ({ cookies }) => {
	if (DEV === "y") {
		cookies.set("sbz-admin", genJwt(adminObj, "30d"), {
			path: "/",
			httpOnly: true,
			maxAge: 60 * 60 * 168,
			secure: true,
		});

		cookies.set("sbz-nootp", "true", {
			path: "/",
			httpOnly: true,
			maxAge: 60 * 60 * 1,
			secure: true,
		});

		redirect(307, "/admin/home");
	}
};
