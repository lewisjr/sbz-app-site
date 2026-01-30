export const load = async (event) => {
	const { url, cookies } = event;

	const token = url.searchParams.get("token");
	const isApp = token !== null;

	if (isApp)
		cookies.set("sbz-push", token, {
			path: "/",
			httpOnly: true,
			// s m h d
			maxAge: 60 * 60 * 24 * 30,
			secure: true,
		});

	const forceApp = cookies.get("sbz-push");

	return {
		isApp: isApp ? isApp : forceApp,
	};
};
