# TO DO

## ticket stuff 5 Oct 2025 @ 22:42

- [x] create messenger chat ui
- [x] connect chat messenger to api
- [x] add trades
- [x] add matched reports
- [x] add screen reports
- [] add settlement
- [] add cn generation
- [x] make chat ui only work for web and email tickets
- [] finish account opening!
- [x] add analytics
- [x] add socials
- [x] add home WoW analysis
- [] add some reports like the dmr and sm report (downloadable)
- [] fix b-engine recording names incorrectly

## ADD IP TRACKER

```ts
// src/routes/+layout.server.ts
import type { LayoutServerLoad } from "./$types";
import UAParser from "ua-parser-js";

export const load: LayoutServerLoad = async (event) => {
	// IP (depends on adapter & proxy setup)
	const ip = event.getClientAddress();

	// User agent
	const uaString = event.request.headers.get("user-agent") ?? "";
	const ua = new UAParser(uaString).getResult();

	// Geo lookup (example with a third-party service)
	const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
	const geo = await geoRes.json();

	return {
		ip,
		city: geo.city,
		country: geo.country_name,
		device: ua.device,
		browser: ua.browser,
		os: ua.os,
	};
};
```
