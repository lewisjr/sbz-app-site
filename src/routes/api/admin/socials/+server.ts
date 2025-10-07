import { json } from "@sveltejs/kit";
import kratos from "$lib/server/kratos";
import { sbzdb } from "$lib/server/db/db.js";
import { formatDbTime } from "$lib/utils.js";

import type { SBZdb } from "$lib/types/index.js";

const createMetric = async (
	v2: {
		date: string;
		platform: string;
		udf1: number;
		udf2: number;
		udf3: number;
		udf4: number;
		udf5: number;
	},
	sender: string,
) => {
	try {
		const obj: SBZdb["public"]["Tables"]["odyn-socials"]["Insert"][] = [];

		switch (v2.platform) {
			case "Facebook":
				obj.push({ date: v2.date, metric: "Reach", platform: v2.platform, value: v2.udf1 });
				obj.push({ date: v2.date, metric: "Likes", platform: v2.platform, value: v2.udf2 });
				obj.push({ date: v2.date, metric: "Comments", platform: v2.platform, value: v2.udf3 });
				obj.push({ date: v2.date, metric: "Link Clicks", platform: v2.platform, value: v2.udf4 });
				obj.push({ date: v2.date, metric: "Followers", platform: v2.platform, value: v2.udf5 });
				break;
			case "LinkedIn":
				obj.push({ date: v2.date, metric: "Impressions", platform: v2.platform, value: v2.udf1 });
				obj.push({ date: v2.date, metric: "Reactions", platform: v2.platform, value: v2.udf2 });
				obj.push({ date: v2.date, metric: "Comments", platform: v2.platform, value: v2.udf3 });
				obj.push({ date: v2.date, metric: "Reposts", platform: v2.platform, value: v2.udf4 });
				obj.push({ date: v2.date, metric: "Followers", platform: v2.platform, value: v2.udf5 });
				break;
			case "Spotify":
				obj.push({ date: v2.date, metric: "Plays", platform: v2.platform, value: v2.udf1 });
				obj.push({ date: v2.date, metric: "Followers", platform: v2.platform, value: v2.udf5 });
				break;
			case "YouTube":
				obj.push({ date: v2.date, metric: "Views", platform: v2.platform, value: v2.udf1 });
				obj.push({ date: v2.date, metric: "Likes", platform: v2.platform, value: v2.udf2 });
				obj.push({ date: v2.date, metric: "Comments", platform: v2.platform, value: v2.udf3 });
				obj.push({ date: v2.date, metric: "Followers", platform: v2.platform, value: v2.udf4 });
				break;
		}

		const createReq = sbzdb.from("odyn-socials").insert(obj).select();
		const logReq = sbzdb.from("logs").insert({
			title: "Post Addition",
			value: `${sender} added a ${v2.platform} post for ${formatDbTime(v2.date)}.`,
		});

		const [createRes, logRes] = await Promise.all([createReq, logReq]);

		if (createRes.error)
			return {
				apiResponse: { success: false, message: createRes.error.message },
				status: 400,
			};

		return {
			apiResponse: {
				success: true,
				message: `Successfully added ${v2.platform} post for ${formatDbTime(v2.date)}!`,
				data: createRes.data,
			},
			status: 200,
		};
	} catch (ex) {
		return { apiResponse: { success: false, message: JSON.stringify(ex) }, status: 400 };
	}
};

export const POST = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const data = await request.json();

	const res = await createMetric(data, sender.username);

	return json(res.apiResponse, { status: res.status });
};
