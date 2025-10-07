<script lang="ts">
	//types
	import type { SBZdb } from "$lib/types";
	import { formatDbTime } from "$lib/utils";
	import type { SummaryData } from "../../types";

	//componenets - custom
	import SummaryFlash from "./SummaryFlash.svelte";
	import SummaryFlashSkeleton from "./SummaryFlashSkeleton.svelte";
	import MetricsChart from "./MetricsChart.svelte";

	interface Props {
		socialsData: SBZdb["public"]["Tables"]["odyn-socials"]["Row"][];
		platform: "Facebook" | "LinkedIn" | "Spotify" | "YouTube";
		dateI: string | undefined;
		dateF: string | undefined;

		flipped?: boolean;
	}

	let { dateF, dateI, flipped = false, platform, socialsData }: Props = $props();

	let endText = $derived.by(() =>
		dateI && dateF ? " for your selected dates." : " since inception.",
	);

	let postDataCount = $derived.by(() =>
		platform === "YouTube" ? 4 : platform === "Spotify" ? 2 : 5,
	);

	let tempAnalysis = $derived.by(() => {
		if (socialsData.length) {
			const prevSumData: SummaryData = {
				udf1Label:
					platform === "Facebook"
						? "Reach"
						: platform === "Spotify"
							? "Plays"
							: platform !== "YouTube"
								? "Impressions"
								: "Views",
				udf1Volume: 0,
				udf1Delta: 0,
				udf2Label: platform === "Facebook" || platform === "YouTube" ? "Likes" : "Reactions",
				udf2Volume: 0,
				udf2Delta: 0,
				commentsLabel: "Comments",
				commentsVolume: 0,
				commentsDelta: 0,
				udf3Label: platform === "Facebook" ? "Link Clicks" : "Reposts",
				udf3Volume: 0,
				udf3Delta: 0,
				udf4Label: platform !== "YouTube" ? "Followers" : "Subscribers",
				udf4Volume: 0,
				udf4Delta: 0,
				countVolume: 0,
				countDelta: 0,
				date: "",
			};

			const currSumData: SummaryData = {
				udf1Label:
					platform === "Facebook"
						? "Reach"
						: platform === "Spotify"
							? "Plays"
							: platform !== "YouTube"
								? "Impressions"
								: "Views",
				udf1Volume: 0,
				udf1Delta: 0,
				udf2Label: platform === "Facebook" || platform === "YouTube" ? "Likes" : "Reactions",
				udf2Volume: 0,
				udf2Delta: 0,
				commentsLabel: "Comments",
				commentsVolume: 0,
				commentsDelta: 0,
				udf3Label: platform === "Facebook" ? "Link Clicks" : "Reposts",
				udf3Volume: 0,
				udf3Delta: 0,
				udf4Label: platform !== "YouTube" ? "Followers" : "Subscribers",
				udf4Volume: 0,
				udf4Delta: 0,
				countVolume: 0,
				countDelta: 0,
				date: "",
			};

			const platformData = socialsData.filter((s) => s.platform === platform);

			if (dateI && dateF) {
				platformData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

				let prevCount: number = 0;
				let currCount: number = 0;

				const fromDate = new Date(dateI).getTime();
				const toDate = new Date(dateF).getTime();

				platformData.forEach((m) => {
					const metricDateArr = m.date.split("-");
					const metricDate = new Date(
						`${metricDateArr[0]}-${metricDateArr[1]}-${metricDateArr[2].split("T")[0]}`,
					).getTime();

					if (metricDate >= fromDate && metricDate <= toDate) {
						currCount++;

						["Reach", "Impressions", "Views", "Plays"].includes(m.metric)
							? (currSumData.udf1Volume = currSumData.udf1Volume + m.value)
							: null;
						["Likes", "Reactions"].includes(m.metric)
							? (currSumData.udf2Volume = currSumData.udf2Volume + m.value)
							: null;
						["Comments"].includes(m.metric)
							? (currSumData.commentsVolume = currSumData.commentsVolume + m.value)
							: null;
						["Link Clicks", "Reposts"].includes(m.metric)
							? (currSumData.udf3Volume = currSumData.udf3Volume + m.value)
							: null;
						["Followers", "Subscribers"].includes(m.metric) && !currSumData.udf4Volume
							? (currSumData.udf4Volume = m.value)
							: null;

						!currSumData.date.length
							? (currSumData.date = formatDbTime(m.date).split(",")[0])
							: null;
					}

					if (metricDate < fromDate && prevCount < currCount) {
						prevCount++;

						["Reach", "Impressions", "Views"].includes(m.metric)
							? (prevSumData.udf1Volume = prevSumData.udf1Volume + m.value)
							: null;
						["Likes", "Reactions"].includes(m.metric)
							? (prevSumData.udf2Volume = prevSumData.udf2Volume + m.value)
							: null;
						["Comments"].includes(m.metric)
							? (prevSumData.commentsVolume = prevSumData.commentsVolume + m.value)
							: null;
						["Link Clicks", "Reposts"].includes(m.metric)
							? (prevSumData.udf3Volume = prevSumData.udf3Volume + m.value)
							: null;
						["Followers", "Subscribers"].includes(m.metric) && !prevSumData.udf4Volume
							? (prevSumData.udf4Volume = m.value)
							: null;

						prevSumData.date = formatDbTime(m.date).split(",")[0];
					}
				});

				const pCountVol = prevCount / postDataCount;
				const cCountVol = currCount / postDataCount;

				prevSumData.countVolume = pCountVol;
				currSumData.countVolume = cCountVol;

				// get deltas
				currSumData.udf1Delta = prevSumData.udf1Volume
					? (currSumData.udf1Volume - prevSumData.udf1Volume) / prevSumData.udf1Volume
					: 0;
				currSumData.udf2Delta = prevSumData.udf2Volume
					? (currSumData.udf2Volume - prevSumData.udf2Volume) / prevSumData.udf2Volume
					: 0;
				currSumData.commentsDelta = prevSumData.commentsVolume
					? (currSumData.commentsVolume - prevSumData.commentsVolume) / prevSumData.commentsVolume
					: 0;
				currSumData.udf3Delta = prevSumData.udf3Volume
					? (currSumData.udf3Volume - prevSumData.udf3Volume) / prevSumData.udf3Volume
					: 0;
				currSumData.udf4Delta = prevSumData.udf4Volume
					? (currSumData.udf4Volume - prevSumData.udf4Volume) / prevSumData.udf4Volume
					: 0;
				currSumData.countDelta = pCountVol ? (cCountVol - pCountVol) / pCountVol : 0;

				/*
				if (platform === "Facebook") {
					console.log({ platformData });
					console.log({ prevSumData, prevCount });
					console.log({ currSumData, currCount });
				}
				*/
			} else {
				let count: number = 0;

				platformData.forEach((m, i) => {
					if (!i) currSumData.date = formatDbTime(m.date).split(",")[0];

					count++;

					["Reach", "Impressions", "Views", "Plays"].includes(m.metric)
						? (currSumData.udf1Volume = currSumData.udf1Volume + m.value)
						: null;
					["Likes", "Reactions"].includes(m.metric)
						? (currSumData.udf2Volume = currSumData.udf2Volume + m.value)
						: null;
					["Comments"].includes(m.metric)
						? (currSumData.commentsVolume = currSumData.commentsVolume + m.value)
						: null;
					["Link Clicks", "Reposts"].includes(m.metric)
						? (currSumData.udf3Volume = currSumData.udf3Volume + m.value)
						: null;
					["Followers", "Subscribers"].includes(m.metric) && !currSumData.udf4Volume
						? (currSumData.udf4Volume = currSumData.udf4Volume + m.value)
						: null;

					prevSumData.date = formatDbTime(m.date).split(",")[0];
				});

				currSumData.countVolume = count / postDataCount;
			}

			return {
				prevDate: prevSumData.date,
				summaryData: currSumData,
			};
		}

		return {
			prevDate: undefined,
			summaryData: undefined,
		};
	});

	let summaryData = $derived(tempAnalysis.summaryData);

	let prevDate = $derived(tempAnalysis.prevDate);
</script>

<h2 class="mt-10">{platform}</h2>
<p class="italic opacity-60">
	Dive into what's been happening on {platform}{endText}
</p>

<div class={`infographics${flipped ? " flipped" : ""} mt-5`}>
	<div class="summary">
		{#if summaryData && prevDate}
			<SummaryFlash {summaryData} {prevDate} {platform} isRange={dateI && dateF ? true : false} />
		{:else if summaryData && summaryData.date === ""}
			<h3>No Data.</h3>
		{:else}
			<SummaryFlashSkeleton {platform} />
		{/if}
	</div>
	<div class="sparkline">
		<MetricsChart {socialsData} {platform} {flipped} {dateI} {dateF} />
	</div>
</div>

<style lang="scss">
	.infographics {
		width: 100%;
		height: 600px;
		display: flex;
		flex-direction: row;
		align-items: center;

		&.flipped {
			flex-direction: row-reverse !important;
		}

		.summary {
			width: 400px;
			height: 600px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			overflow: visible;
		}

		.sparkline {
			width: calc(100% - 400px);
			height: 600px;
			position: relative;
		}
	}
</style>
