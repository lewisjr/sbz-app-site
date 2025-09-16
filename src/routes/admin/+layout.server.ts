import { scourgeOfClients } from "$lib/server/jwt";

export const load = (data) => {
	const admin = scourgeOfClients(data);

	return {
		perimissions: admin.data.permissions.split(",,"),
		admin: admin.data.username,
		names: admin.data.full_names,
	};
};
