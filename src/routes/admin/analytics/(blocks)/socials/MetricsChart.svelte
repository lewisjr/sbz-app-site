<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse } from "@cerebrusinc/qol";
	import { formatDbTime } from "$lib/utils";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//components - custom
	import AnyPicker from "$lib/components/AnyPicker.svelte";

	//componenets - Shadcn
	import Label from "$lib/components/ui/label/label.svelte";

	//types
	import type { SBZdb } from "$lib/types";
	import type { ApexOptions } from "$lib/types";

	interface Props {
		socialsData: SBZdb["public"]["Tables"]["odyn-socials"]["Row"][];
		platform: string;
		flipped: boolean;

		dateI: string | undefined;
		dateF: string | undefined;
	}

	let { dateF, dateI, flipped, platform, socialsData }: Props = $props();

	let metricValue = $state<string>("Likes");
	const updateMetric = (value: string) => (metricValue = value);
	let metricsArray = $state<{ label: string; value: string }[]>([]);

	$effect(() => {
		switch (platform) {
			case "Facebook":
				metricsArray = [
					{ label: "Reach", value: "Reach" },
					{ label: "Likes", value: "Likes" },
					{ label: "Comments", value: "Comments" },
					{ label: "Link Clicks", value: "Link Clicks" },
					{ label: "Followers", value: "Followers" },
				];
				updateMetric("Reach");
				break;
			case "LinkedIn":
				metricsArray = [
					{ label: "Impressions", value: "Impressions" },
					{ label: "Reactions", value: "Reactions" },
					{ label: "Comments", value: "Comments" },
					{ label: "Reposts", value: "Reposts" },
					{ label: "Followers", value: "Followers" },
				];
				updateMetric("Impressions");
				break;
			case "Spotify":
				metricsArray = [
					{ label: "Plays", value: "Plays" },
					{ label: "Followers", value: "Followers" },
				];
				updateMetric("Plays");
				break;
			case "YouTube":
				metricsArray = [
					{ label: "Views", value: "Views" },
					{ label: "Likes", value: "Likes" },
					{ label: "Comments", value: "Comments" },
					{ label: "Followers", value: "Followers" },
				];
				updateMetric("Views");
				break;
			default:
				break;
		}
	});

	let options = $derived.by(() => {
		const platformObj: { [key: string]: { label: string; color: string } } = {
			facebook: {
				label: "Facebook",
				color: "#3b5998",
			},
			linkedin: {
				label: "LinkedIn",
				color: "#0072b1",
			},
			spotify: {
				label: "Spotify",
				color: "#25D366",
			},
			youtube: {
				label: "YouTube",
				color: "#ff3333",
			},
		};

		const platformData = socialsData.filter((s) => s.platform === platform);

		const seriesCodex: { [key: string]: { x: number; y: number } } = {};

		if (dateI && dateF) {
			const fromDate = new Date(dateI).getTime();
			const toDate = new Date(dateF).getTime();

			platformData.forEach((m) => {
				const metricDateArr = m.date.split("-");
				const metricDate = new Date(
					`${metricDateArr[0]}-${metricDateArr[1]}-${metricDateArr[2].split("T")[0]}`,
				).getTime();

				if (metricDate >= fromDate && metricDate <= toDate) {
					if (seriesCodex[metricDate.toString()]) {
						m.metric === metricValue
							? (seriesCodex[metricDate.toString()].y =
									seriesCodex[metricDate.toString()].y + m.value)
							: null;
					}

					m.metric === metricValue
						? (seriesCodex[metricDate.toString()] = { x: metricDate, y: m.value })
						: null;
				}
			});
		} else {
			platformData.forEach((m) => {
				const metricDateArr = m.date.split("-");
				const metricDate = new Date(
					`${metricDateArr[0]}-${metricDateArr[1]}-${metricDateArr[2].split("T")[0]}`,
				).getTime();

				if (seriesCodex[metricDate.toString()]) {
					m.metric === metricValue
						? (seriesCodex[metricDate.toString()].y =
								seriesCodex[metricDate.toString()].y + m.value)
						: null;
				}

				m.metric === metricValue
					? (seriesCodex[metricDate.toString()] = { x: metricDate, y: m.value })
					: null;
			});
		}

		const seriesData = Object.values(seriesCodex).map((m) => m);

		const obj: ApexOptions = {
			chart: {
				height: 600,
				type: "area",
				toolbar: {
					show: false,
				},
				zoom: {
					enabled: false,
				},
			},
			series: [
				{
					data: seriesData,
					color: platformObj[platform.toLowerCase()].color,
					name: `${platform} ${metricValue}`,
				},
			],
			yaxis: {
				show: false,
			},
			grid: {
				show: false,
			},
			xaxis: {
				labels: {
					style: {
						fontWeight: 600,
						colors: mode.current === "dark" ? "#eee" : undefined,
					},
				},
				type: "datetime",
			},
			dataLabels: {
				enabled: false,
			},
			tooltip: {
				enabled: true,
				theme: mode.current === "dark" ? "dark" : "light",
				custom: ({ series, seriesIndex, dataPointIndex: dataPointIndex, w }) => {
					return `<div class="px-4 py-2 flex flex-col items-center">
								<span>
									<strong>${formatDbTime(new Date(seriesData[dataPointIndex].x).toISOString()).split(",")[0]}</strong>
								</span>
								<span>
									<strong>${metricValue}: </strong>${numParse(seriesData[dataPointIndex].y)}
								</span>
							</div>`;
				},
			},
		};

		return { obj, noData: !seriesData.length };
	});
</script>

{#if options.noData}
	<div class="no-chart">
		<h3>No Chart.</h3>
	</div>
{:else}
	<div use:chart={options.obj}></div>
	<div class={`controller${flipped ? " flipped" : ""}`}>
		<Label class="mr-2">Select a Metric</Label>
		<AnyPicker
			data={metricsArray}
			handler={updateMetric}
			pickerTitle="Metric"
			value={metricValue}
		/>
	</div>
{/if}

<style lang="scss">
	.controller {
		position: absolute;
		z-index: 1;
		top: 0px;
		right: 5px;

		&.flipped {
			left: 10px !important;
		}
	}

	.no-chart {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
