import { print } from "$lib/utils";
import { DEV } from "$env/static/private";

// src/hooks.server.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	// Perform middleware logic before processing the request
	// For example, authentication, logging, or modifying the request

	const ip = event.getClientAddress();

	if (!event.url.href.includes("/api")) {
		return resolve(event);
	}

	//print({ req: event.request.headers });

	let url = DEV === "y" ? "http://localhost:5173" : "https://app.sbz.com.zm";

	const allowedOrigins = [url];

	// 2) For GET requests, check Referer
	if (event.request.method === "GET") {
		const referer = event.request.headers.get("referer") || "";
		if ((referer && !referer.startsWith(allowedOrigins[0])) || !referer.length) {
			return new Response(`${event.request.method} method not allowed`, { status: 405 });
		}
	} else {
		// 1) Check Origin (if present)
		const origin = event.request.headers.get("origin");

		if (origin && !allowedOrigins.includes(origin)) {
			return new Response(`${event.request.method} method not allowed`, { status: 405 });
		}
	}

	// Resolve the request, allowing SvelteKit to handle it
	const response = await resolve(event);

	// Perform middleware logic after processing the request
	// For example, modifying the response or logging response details

	return response;
}
