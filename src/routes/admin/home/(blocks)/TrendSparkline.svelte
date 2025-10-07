<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse, randomColour } from "@cerebrusinc/qol";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//types
	import type { ApexOptions } from "$lib/types";
	import { formatDbTime } from "$lib/utils";

	interface Props {
		data: { x: string; y: number }[];
		title: string;
		dataTitle: string;
	}

	let { data, dataTitle, title }: Props = $props();

	let options = $derived.by(() => {
		const obj: ApexOptions = {
			chart: {
				height: 400,
				type: "area",
				toolbar: {
					show: false,
				},
				zoom: {
					enabled: false,
				},
				sparkline: {
					enabled: true,
				},
			},
			title: {
				text: title, //`Peak Query Time • ${_24to12(data.peakHour)}`,
				align: "center",
				style: {
					color: mode.current === "dark" ? "#eee" : "#000",
					fontSize: "12pt",
				},
				offsetY: 10,
			},
			xaxis: {
				type: "datetime",
			},
			series: [
				{
					data: data,
					color: randomColour(),
				},
			],
			tooltip: {
				enabled: true,
				theme: mode.current === "dark" ? "dark" : "light",
				custom: ({ series, seriesIndex, dataPointIndex: dataPointIndex, w }) => {
					return `<div class="px-4 py-2 flex flex-col items-center">
								<span>
									<strong>${formatDbTime(data[dataPointIndex].x.split("T")[0])}</strong>
								</span>
								<span>
									<strong>${numParse(data[dataPointIndex].y)} ${dataTitle}
								</span>
							</div>`;
				},
			},
		};

		return obj;
	});
</script>

{#if data.length}
	<div use:chart={options}></div>
{:else}
	<div class="flex h-[250px] flex-col items-center justify-center">
		<h3>No {dataTitle} Data.</h3>
	</div>
{/if}
