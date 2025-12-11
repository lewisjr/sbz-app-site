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

interface JWT<T> {
	data: T;
	iat: number;
	exp: number;
}

export type AdminJwt = JWT<SBZdb["public"]["Tables"]["admins"]["Row"]>;

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

export type ClientJwt = JWT<SBZdb["public"]["Tables"]["clients"]["Row"]>;

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

/**@deprecated */
const kratosSafety = (event: ServerLoadEvent): void => {
	const user = event.cookies.get("sbz-authed");

	if (!user) {
		event.cookies.set("sbz-authed", genJwt({ setBy: "svelte" }, "30d"), {
			path: "/",
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 30,
			secure: true,
		});

		return;
	}

	const details = checkJwt(user);
	if (!details) {
		event.cookies.set("sbz-authed", genJwt({ setBy: "svelte" }, "30d"), {
			path: "/",
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 30,
			secure: true,
		});

		return;
	}
};

export type UserEmailJwt = JWT<string>;

export const userEmailFinder = (event: ServerLoadEvent): UserEmailJwt | false => {
	const user = event.cookies.get("sbz-client-mail");
	if (!user) return false;

	const details = checkJwt(user);
	if (!details) {
		event.cookies.delete("sbz-client-mail", { path: "/" });
		return false;
	}

	const userDetails = details as UserEmailJwt;

	return userDetails; // or whatever is useful
};
