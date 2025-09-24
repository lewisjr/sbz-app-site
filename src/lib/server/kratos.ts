import { json } from "@sveltejs/kit";
import { checkJwt } from "./jwt";

import type { AdminJwt, ClientJwt } from "./jwt";
import type { RequestEvent } from "@sveltejs/kit";

const admin = async (event: RequestEvent): Promise<Response | AdminJwt["data"]> => {
	const { cookies } = event;

	const user = cookies.get("sbz-admin");
	if (!user) return json({ success: false, message: "Please refresh the page." }, { status: 404 });

	const isValidJwt = checkJwt(user);

	if (!isValidJwt) {
		cookies.delete("sbz-admin", { path: "/" });
		return json({ success: false, message: "Please refresh the page." }, { status: 404 });
	}

	const sender = isValidJwt as AdminJwt;

	return sender.data;
};

const client = async (event: RequestEvent): Promise<Response | ClientJwt["data"]> => {
	const { cookies } = event;

	const user = cookies.get("sbz-client");
	if (!user) return json({ success: false, message: "Please refresh the page." }, { status: 404 });

	const isValidJwt = checkJwt(user);

	if (!isValidJwt) {
		cookies.delete("sbz-client", { path: "/" });
		return json({ success: false, message: "Please refresh the page." }, { status: 404 });
	}

	const sender = isValidJwt as ClientJwt;

	return sender.data;
};

const chat = async (event: RequestEvent): Promise<Response | true> => {
	const { cookies } = event;

	const user = cookies.get("sbz-nootp");
	if (!user) return json({ success: false, message: "Please refresh the page." }, { status: 404 });

	const isValidJwt = checkJwt(user);

	if (!isValidJwt) {
		cookies.delete("sbz-nootp", { path: "/" });
		return json({ success: false, message: "Please refresh the page." }, { status: 404 });
	}

	const sender = isValidJwt as ClientJwt;

	return true;
};

const kratos = {
	admin,
	client,
	chat,
};

export default kratos;
