import dbs from "$lib/server/db/index.js";

export const load = async ({ cookies, params }) => {
	const noOtp = cookies.get("sbz-nootp");

	return {
		otp: noOtp ? false : true,
		ticketId: params.ticket,
	};
};
