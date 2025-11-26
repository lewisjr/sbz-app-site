<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse, randomColour } from "@cerebrusinc/qol";
	import { percentageHandler } from "$lib/utils";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//types
	import type { ResolutionAnalytics } from "../../types";
	import type { ApexOptions } from "$lib/types";

	interface Props {
		data: ResolutionAnalytics;
	}

	let { data }: Props = $props();

	let options = $derived.by(() => {
		const resolvers = data.resolvers.map((r) => {
			return { x: r.name, y: r.volume };
		});

		resolvers.sort((a, b) => b.y - a.y);

		const obj: ApexOptions = {
			chart: {
				height: 300,
				type: "bar",
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
				text: "Closing Stats",
				align: "center",
				style: {
					color: mode.current === "dark" ? "#eee" : "#000",
					fontSize: "11pt",
				},
				offsetY: 10,
			},
			series: [
				{
					data: resolvers.map((r) => r.y),
					color: randomColour(),
				},
			],
			yaxis: {
				reversed: true,
			},
			plotOptions: {
				bar: {
					horizontal: true,
					borderRadius: 17,
					borderRadiusApplication: "end",
					dataLabels: {
						position: "center",
					},
				},
			},
			dataLabels: {
				enabled: true,
				textAnchor: "middle",
				formatter: (_, opts) => {
					const { x, y } = resolvers[opts.dataPointIndex];
					return `${x} • ${numParse(y)} • ${percentageHandler(y / resolvers.reduce((sum, item) => sum + item.y, 0))}`;
				},
				background: {
					enabled: true,
					foreColor: "black",
					dropShadow: {
						enabled: true,
					},
				},
			},
			tooltip: {
				enabled: false,
			},
		};

		return obj;
	});
</script>

<div use:chart={options}></div>
