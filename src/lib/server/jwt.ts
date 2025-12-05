import jwt from "jsonwebtoken";
import { JWT_SECRET } from "$env/static/private";
import { redirect } from "@sveltejs/kit";

import type { ServerLoadEvent } from "@sveltejs/kit";
import type { SBZdb } from "$lib/types";

/**Generate a JWT for any data type */
export const genJwt = (
	data: string | object,
	validUntil: "4h" | "12h" | "1d" | "2d" | "7d" | "30d",
): string => {
	return jwt.sign({ data }, JWT_SECRET, { expiresIn: validUntil });
};

/**Try to decode a JWT */
export const checkJwt = (token: string): string | jwt.JwtPayload | false => {
	try {
		const data = jwt.verify(token, JWT_SECRET);

		if (data) return data;
		else return false;
	} catch (ex) {
		console.log(ex);
		return false;
	}
};

export interface AdminJwt {
	data: SBZdb["public"]["Tables"]["admins"]["Row"];
	iat: number;
	exp: number;
}

export const scourgeOfClients = (event: ServerLoadEvent): AdminJwt => {
	const user = event.cookies.get("sbz-admin");
	if (!user) throw redirect(307, "/");

	const details = checkJwt(user);
	if (!details) {
		event.cookies.delete("sbz-admin", { path: "/" });
		throw redirect(307, "/");
	}

	const userDetails = details as AdminJwt;

	return userDetails; // or whatever is useful
};

export interface ClientJwt {
	data: SBZdb["public"]["Tables"]["clients"]["Row"];
	iat: number;
	exp: number;
}

export const scourgeOfInvestor = (event: ServerLoadEvent): ClientJwt => {
	const user = event.cookies.get("sbz-client");
	if (!user) throw redirect(307, "/");

	const details = checkJwt(user);
	if (!details) {
		event.cookies.delete("sbz-client", { path: "/" });
		throw redirect(307, "/");
	}

	const userDetails = details as ClientJwt;

	return userDetails; // or whatever is useful
};

export const kratosSafety = (event: ServerLoadEvent): void => {
	const user = event.cookies.get("sbz-authed");

	if (!user) {
		event.cookies.set("sbz-authed", genJwt({ setBy: "svelte" }, "30d"), {
			path: "/",
			httpOnly: true,
			maxAge: 60 * 60 * 168,
			secure: true,
		});

		return;
	}

	const details = checkJwt(user);
	if (!details) {
		event.cookies.set("sbz-authed", genJwt({ setBy: "svelte" }, "30d"), {
			path: "/",
			httpOnly: true,
			maxAge: 60 * 60 * 168,
			secure: true,
		});

		return;
	}
};
