import { json } from "@sveltejs/kit";

export const GET = (event) => {
	const searchParams = event.request.url;

	return json({ success: true, message: searchParams }, { status: 201 });
};
