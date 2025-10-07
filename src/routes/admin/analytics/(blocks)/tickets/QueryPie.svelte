<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse } from "@cerebrusinc/qol";
	import { percentageHandler } from "$lib/utils";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//types
	import type { TicketsAnalysis } from "../../types";
	import type { ApexOptions } from "$lib/types";

	interface Props {
		data: TicketsAnalysis;
	}

	let { data }: Props = $props();

	let options = $derived.by(() => {
		const obj: ApexOptions = {
			chart: {
				height: 500,
				width: 600,
				type: "donut",
				toolbar: {
					show: false,
				},
			},
			series: [data.complete, data.incomplete],
			labels: ["Complete", "Incomplete"],
			colors: ["#00E396", "#FF4560"],
			stroke: {
				show: true,
				width: 5,
				colors: mode.current === "dark" ? ["#000", "#000"] : ["#fff", "#fff"],
			},
			yaxis: {
				show: false,
			},
			dataLabels: {
				textAnchor: "middle",
				enabled: true,
				// @ts-ignore
				formatter: (_, opt) => {
					if (!opt.seriesIndex)
						return [
							"Complete",
							`${numParse(data.complete)} • ${percentageHandler(data.completePercent)}`,
						];
					else
						return [
							"Inomplete",
							`${numParse(data.incomplete)} • ${percentageHandler(data.incompletePercent)}`,
						];
				},
				dropShadow: {
					enabled: true,
					blur: 5,
				},
				style: {
					fontSize: "10pt",
				},
			},

			tooltip: {
				enabled: false,
			},
			legend: {
				width: 0,
				height: 0,
				fontSize: "0px",
				markers: {
					customHTML: () => "",
				},
			},
		};

		return obj;
	});
</script>

<div use:chart={options}></div>
<div class="text">
	<p><strong>Total: </strong>{numParse(data.total)}</p>
	<p><strong>Rating: </strong><span class={data.efficiency}>{data.efficiency}</span></p>
</div>

<style>
	.text {
		position: absolute;
		z-index: 1;
		top: 50%;
		left: 45%;
		transform: translateX(-50%) translateY(-50%);

		& p {
			font-size: 16pt;
			text-align: center;
			& span {
				&.BAD {
					color: rgb(221, 52, 52);
				}

				&.FAIR {
					color: rgb(221, 134, 52);
				}

				&.GOOD {
					color: rgb(52, 221, 108);
				}

				&.SUPERB {
					color: rgb(200, 62, 235);
				}
			}
		}
	}
</style>
