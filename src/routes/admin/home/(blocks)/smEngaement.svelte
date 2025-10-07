<script lang="ts">
	import type { SBZdb } from "$lib/types";
	import { formatDbTime, percentageHandler } from "$lib/utils";
	import { numParse } from "@cerebrusinc/qol";
	import TrendSparkline from "./TrendSparkline.svelte";

	type SocialsData = SBZdb["public"]["Tables"]["odyn-socials"]["Row"];

	interface Props {
		data: SocialsData[];
		platform: "Facebook" | "LinkedIn" | "Spotify" | "YouTube";
		flipped?: boolean;
	}

	let { data, flipped = false, platform }: Props = $props();

	interface MetricsObj {
		followers: number;
		followersDelta: number;
		engagement: number;
		engagementDelta: number;
		posts: number;
		postsDelta: number;
	}

	let postDataCount = $derived(platform === "YouTube" ? 4 : platform === "Spotify" ? 2 : 5);

	let wowEngagementData = $state<{ x: string; y: number }[]>([]);
	let wowFollowersData = $state<{ x: string; y: number }[]>([]);

	let followersSummary1 = $state<string>("");
	let engagementSummary1 = $state<string>();

	const prettyDate = (d: string): string => {
		const date = formatDbTime(d);

		return date.split(",")[0];
	};

	$effect(() => {
		if (data.length) {
			const _data: SocialsData[] = JSON.parse(JSON.stringify(data));

			const dates: string[] = [];

			const trailing7Arr = Array.from({ length: 8 }, (_, i) => i);

			trailing7Arr.forEach((i) => {
				const today = new Date(new Date().toISOString().split("T")[0]);

				if (!i) dates.push(today.toISOString());
				else {
					const prevDay = new Date(new Date().toISOString().split("T")[0]);
					prevDay.setDate(today.getDate() - i);
					dates.push(prevDay.toISOString());
				}
			});

			dates.reverse();

			const firstData = _data.filter((s) => {
				if (s.platform === platform) {
					const dateArr = s.date.split("-");
					const date = new Date(
						`${dateArr[0]}-${dateArr[1]}-${dateArr[2].split("T")[0]}`,
					).toISOString();

					return date === dates[0];
				}
			});

			const reversedDataTemp: SocialsData[] = JSON.parse(JSON.stringify(data));

			const reversedData = reversedDataTemp
				.filter((s) => s.platform === platform)
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

			const lastPostDateArr = reversedData[0].date.split("-");
			const lastPostDate = new Date(
				`${lastPostDateArr[0]}-${lastPostDateArr[1]}-${lastPostDateArr[2].split("T")[0]}`,
			).toISOString();

			const lastData = reversedData.filter((s) => {
				const dateArr = s.date.split("-");
				const date = new Date(
					`${dateArr[0]}-${dateArr[1]}-${dateArr[2].split("T")[0]}`,
				).toISOString();

				return date === lastPostDate;
			});

			const firstFollowers = firstData.find((s) => s.metric === "Followers");

			const _wowFirst: MetricsObj = {
				engagement: firstData.reduce(
					(sum, value) => (value.metric !== "Followers" ? sum + value.value : sum + 0),
					0,
				),
				engagementDelta: 0,
				followers: firstFollowers?.value || 0,
				followersDelta: 0,
				posts: 1,
				postsDelta: 0,
			};

			const _wowLastEngagement = lastData.reduce(
				(sum, value) => (value.metric !== "Followers" ? sum + value.value : sum + 0),
				0,
			);

			const wowData = _data.filter((s) => {
				if (s.platform === platform) {
					const dateArr = s.date.split("-");
					const date = new Date(
						`${dateArr[0]}-${dateArr[1]}-${dateArr[2].split("T")[0]}`,
					).toISOString();

					return dates.includes(date);
				}
			});

			const _wowEngagementData: { x: string; y: number }[] = [];
			const _wowEngagementCodex: { [key: string]: { x: string; y: number } } = {};

			const _wowFollowersData: { x: string; y: number }[] = [];
			const _wowFollowersCodex: { [key: string]: { x: string; y: number } } = {};

			wowData.forEach((s) => {
				if (s.platform === platform && s.metric !== "Followers") {
					const dateArr = s.date.split("-");
					const date = `${dateArr[0]}-${dateArr[1]}-${dateArr[2].split("T")[0]}`;

					if (_wowEngagementCodex[date])
						_wowEngagementCodex[date].y = _wowEngagementCodex[date].y + s.value;
					else _wowEngagementCodex[date] = { x: date, y: s.value };
				}

				if (s.platform === platform && s.metric === "Followers") {
					const dateArr = s.date.split("-");
					const date = `${dateArr[0]}-${dateArr[1]}-${dateArr[2].split("T")[0]}`;

					if (_wowFollowersCodex[date]) _wowFollowersCodex[date].y = _wowFollowersCodex[date].y;
					else _wowFollowersCodex[date] = { x: date, y: s.value };
				}
			});

			Object.values(_wowEngagementCodex).forEach((v) => _wowEngagementData.push(v));
			Object.values(_wowFollowersCodex).forEach((v) => _wowFollowersData.push(v));

			wowEngagementData = _wowEngagementData;
			wowFollowersData = _wowFollowersData;

			const wowFollowers = wowData.find((s) => s.metric === "Followers");

			const _wow: MetricsObj = {
				engagement: wowData.reduce(
					(sum, value) => (value.metric !== "Followers" ? sum + value.value : sum + 0),
					0,
				),
				engagementDelta: 0,
				followers: wowFollowers?.value || 0,
				followersDelta: 0,
				posts: wowData.length / postDataCount,
				postsDelta: 0,
			};

			_wow.engagementDelta = (_wowLastEngagement - _wowFirst.engagement) / _wowFirst.engagement;

			!Number.isFinite(_wow.engagementDelta) || Number.isNaN(_wow.engagementDelta)
				? (_wow.engagementDelta = 0)
				: null;

			_wow.followersDelta = (_wow.followers - _wowFirst.followers) / _wowFirst.followers;

			!Number.isFinite(_wow.followersDelta) || Number.isNaN(_wow.followersDelta)
				? (_wow.followersDelta = 0)
				: null;

			_wow.postsDelta = (_wow.posts - _wowFirst.posts) / _wowFirst.posts;

			!Number.isFinite(_wow.postsDelta) || Number.isNaN(_wow.postsDelta)
				? (_wow.postsDelta = 0)
				: null;

			followersSummary1 = `Over the past week starting ${prettyDate(dates[0])} to date (${prettyDate(dates[dates.length - 1])}) as the chart shows we have seen ${_wow.followersDelta > 0 ? "growth in" : _wow.followersDelta < 0 ? "a decrease in" : "no change in"} following ${_wow.followersDelta !== 0 ? "by " + percentageHandler(_wow.followersDelta) + ` (${numParse(_wowFirst.followers)} - ${numParse(_wow.followers)})` : `staying flat at ${numParse(_wow.followers)}`} ${_wow.followersDelta !== 0 ? "reflecting changes in line with prior weeks regarding sustainable and genuine changes" : "no posting activity"}. We posted ${numParse(Math.floor(_wow.posts))} posts and compute a followers engagement rate of ${percentageHandler(_wow.engagement / _wow.followers)}.`;

			engagementSummary1 = `Over the past week starting ${prettyDate(dates[0])} to date (${prettyDate(dates[dates.length - 1])}) we have seen ${_wow.engagementDelta > 0 ? "growth in" : _wow.engagementDelta < 0 ? "a decrease in" : "no change to"} total daily engagement ${_wow.engagementDelta !== 0 ? "by " + percentageHandler(Number.isNaN(_wow.engagementDelta) ? 0 : _wow.engagementDelta) + ` (${numParse(_wowFirst.engagement)} - ${numParse(_wowLastEngagement)})` : `staying flat at ${numParse(_wow.engagement)}`} ${_wow.engagementDelta !== 0 ? "reflecting changes in line with prior weeks regarding sustainable and genuine changes" : "No posting activity or no post engagement"}.`;
		}
	});
</script>

<h3>{platform}</h3>
<p class="mb-4 text-[12pt] italic opacity-60">
	<strong>NOTE</strong> That engagement is a sum of all metrics such as likes, reposts, comments, link
	clicks, and reach/impressions.
</p>

<div class="sm-tainer">
	{#if flipped}
		<div class="commentary-holder">
			<div class="commentary">
				<h4>WoW Followers Summary</h4>
				<p class="text-justify text-[11pt]">{followersSummary1}</p>

				<h4 class="mt-2">WoW Engagement Summary</h4>
				<p class="text-justify text-[11pt]">{engagementSummary1}</p>
			</div>
		</div>

		<div class="sparkline-holder mid">
			<div class="sparkline">
				<TrendSparkline
					data={wowFollowersData}
					title={`WoW Followers Performance`}
					dataTitle="WoW Followers"
				/>
			</div>
		</div>

		<div class="sparkline-holder mid">
			<div class="sparkline">
				<TrendSparkline
					data={wowEngagementData}
					title={`WoW Engagment Performance`}
					dataTitle="WoW Engagement"
				/>
			</div>
		</div>
	{:else}
		<div class="sparkline-holder mid">
			<div class="sparkline">
				<TrendSparkline
					data={wowFollowersData}
					title={`WoW Followers Performance`}
					dataTitle="All Time WoW Followers"
				/>
			</div>
		</div>

		<div class="sparkline-holder mid">
			<div class="sparkline">
				<TrendSparkline
					data={wowEngagementData}
					title={`WoW Engagment Performance`}
					dataTitle="WoW Engagement"
				/>
			</div>
		</div>

		<div class="commentary-holder">
			<div class="commentary">
				<h4>WoW Followers Summary</h4>
				<p class="text-justify text-[11pt]">{followersSummary1}</p>

				<h4 class="mt-2">WoW Engagement Summary</h4>
				<p class="text-justify text-[11pt]">{engagementSummary1}</p>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.sm-tainer {
		width: 100%;
		height: 400px;
		margin-bottom: 25px;
		display: flex;
		flex-direction: row;
		justify-content: space-between;

		.sparkline-holder {
			height: 100%;
			width: 31%;
			display: flex;
			flex-direction: column;

			&.mid {
				border-left: 1px solid var(--shadow);
				border-right: 1px solid var(--shadow);
				width: 35%;
				padding: 0px 10px;
			}
		}

		.commentary-holder {
			height: 100%;
			width: 32%;
			display: flex;
			flex-direction: column;

			.commentary {
				height: 50%;
				padding-right: 5px;
			}
		}
	}
</style>
