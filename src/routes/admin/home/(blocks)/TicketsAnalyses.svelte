<script lang="ts">
	//functions
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { numParse } from "@cerebrusinc/qol";
	import { formatDbTime, percentageHandler } from "$lib/utils";

	//components - custom
	import { HeatMap, Radar, PolarArea } from "./ticketBlocks";
	import PlatformsColumn from "../../analytics/(blocks)/tickets/PlatformsColumn.svelte";

	//types
	import type { TicketRowLean } from "$lib/types";
	import type { HeatMapData, RadarData } from "./ticketBlocks/types";
	import type { TicketsAnalysis } from "../../analytics/types";

	interface Props {
		data: TicketRowLean[];
	}

	let { data }: Props = $props();

	let heatMapData = $state<HeatMapData[]>([]);
	let radarData = $state<RadarData>({ data: [], labels: [] });
	let polarData = $state<RadarData>({ data: [], labels: [] });
	let barData = $state<TicketsAnalysis | undefined>(undefined);
	let querySummary = $state<string>("");

	$effect(() => {
		const _data: TicketRowLean[] = JSON.parse(JSON.stringify(data));

		const dates: string[] = [];

		_data.forEach((t) => {
			const date = t.created_at.split("T")[0];

			if (!dates.includes(date) && dates.length < 7) {
				dates.push(date);
				return true;
			}
		});

		// console.log({ dates });

		const wowData = _data.filter((t) => {
			const date = t.created_at.split("T")[0];

			if (dates.includes(date)) return true;
		});

		// console.log({ wowData });

		const heatMapCodex: { [key: string]: { name: string; x: string; y: number } } = {};
		const radarCodex: { [key: string]: number } = {};
		const polarCodex: { [key: string]: number } = {};

		let total = 0;
		let incomplete = 0;
		let complete = 0;

		const barCodex: { [key: string]: number } = {};
		const resolvedCodex: { [key: string]: number } = {};

		wowData.forEach((t) => {
			const date = t.created_at.split("T")[0];

			// heatmap ops
			const hKey = t.referral_source ? toTitleCase(t.referral_source.split("-").join(" ")) : null;

			if (hKey && heatMapCodex[`${date}-${hKey}`])
				heatMapCodex[`${date}-${hKey}`].y = heatMapCodex[`${date}-${hKey}`].y + 1;
			else if (hKey && !heatMapCodex[`${date}-${hKey}`])
				heatMapCodex[`${date}-${hKey}`] = { name: hKey, x: date, y: 1 };

			// radar ops
			const rKey = t.query_type ? toTitleCase(t.query_type.split("-").join(" ")) : null;
			if (rKey && radarCodex[rKey]) radarCodex[rKey] = radarCodex[rKey] + 1;
			else if (rKey && !heatMapCodex[rKey]) radarCodex[rKey] = 1;

			// polar ops
			const pKey = t.close_date ? "Complete" : "Incomplete";
			if (pKey && polarCodex[pKey]) polarCodex[pKey] = polarCodex[pKey] + 1;
			else if (pKey && !polarCodex[pKey]) polarCodex[pKey] = 1;

			// bar ops
			total += 1;

			if (!t.close_date) incomplete += 1;
			if (t.close_date) complete += 1;

			if (t.platform) {
				if (barCodex[t.platform.toLowerCase()])
					barCodex[t.platform.toLowerCase()] = barCodex[t.platform.toLowerCase()] + 1;
				else barCodex[t.platform.toLowerCase()] = 1;
			}

			// most resolved
			if (t.closed_by) {
				if (resolvedCodex[toTitleCase(t.closed_by)])
					resolvedCodex[toTitleCase(t.closed_by)] = resolvedCodex[toTitleCase(t.closed_by)] + 1;
				else resolvedCodex[toTitleCase(t.closed_by)] = 1;
			}
		});

		// heatmap analysis
		const _heatMapConsolidatedCodex: { [key: string]: { x: string; y: number }[] } = {};

		let daysArr: { date: string; volume: number }[] = [];
		let referrersArr: { name: string; volume: number }[] = [];

		Object.keys(heatMapCodex).forEach((key) => {
			const { name, x, y } = heatMapCodex[key];

			if (!_heatMapConsolidatedCodex[name]) _heatMapConsolidatedCodex[name] = [{ x, y }];
			else _heatMapConsolidatedCodex[name].push({ x, y });

			daysArr.push({ date: x, volume: y });
			referrersArr.push({ name, volume: y });
		});

		const _heatMapData: HeatMapData[] = [];

		Object.keys(_heatMapConsolidatedCodex).forEach((key) => {
			_heatMapData.push({
				name: key,
				data: _heatMapConsolidatedCodex[key],
			});
		});

		_heatMapData.forEach((s) => {
			s.data.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
		});

		// console.log({ _heatMapData });
		// console.log({ heatMapCodex });

		heatMapData = _heatMapData;

		const radarLabels: string[] = [];
		const radarValues: number[] = [];

		const polarRanking: { label: string; volume: number }[] = [];

		Object.keys(radarCodex).forEach((key) => {
			radarLabels.push(key);
			radarValues.push(radarCodex[key]);

			polarRanking.push({ label: key, volume: radarCodex[key] });
		});

		radarData = { data: radarValues, labels: radarLabels };

		// polar analysis
		const polarLabels: string[] = [];
		const polarValues: number[] = [];

		Object.keys(polarCodex).forEach((key) => {
			polarLabels.push(key);
			polarValues.push(polarCodex[key]);
		});

		polarData = { data: polarValues, labels: polarLabels };

		// bar analysis
		const incompletePercent = incomplete / total;
		const completePercent = complete / total;

		const efficiency =
			completePercent < 0.5
				? "BAD"
				: completePercent < 0.7
					? "FAIR"
					: completePercent < 0.9
						? "GOOD"
						: "SUPERB";

		const barArr: { platform: string; volume: number }[] = [];

		Object.keys(barCodex).forEach((platform) => {
			const volume = barCodex[platform];

			barArr.push({ platform, volume });
		});

		barArr.sort((a, b) => b.volume - a.volume);

		barData = {
			complete,
			completePercent,
			efficiency,
			incomplete,
			incompletePercent,
			platforms: barArr,
			popular: barArr[0].platform,
			total,
		};

		// summary calcs
		const resolveArr: { name: string; volume: number }[] = [];

		Object.keys(resolvedCodex).forEach((name) => {
			const volume = resolvedCodex[name];

			resolveArr.push({ name, volume });
		});

		resolveArr.sort((a, b) => b.volume - a.volume);

		polarRanking.sort((a, b) => b.volume - a.volume);

		daysArr.sort((a, b) => b.volume - a.volume);
		referrersArr.sort((a, b) => b.volume - a.volume);

		const topThreePolarArr = polarRanking.filter((value, i) => {
			if (i < 3) return true;
		});

		const topThreeLabels = topThreePolarArr.map((l) => l.label);
		const topThreeVolume = topThreePolarArr.map((l) => l.volume);

		querySummary = `Over the past week, we received a total of ${numParse(barData.total)} queries with a completion rate of ${percentageHandler(barData.complete / barData.total)} resulting in a ${barData.efficiency.toLowerCase()} efficiency rating. The platform that received the most queries was ${toTitleCase(barData.popular)} representing ${percentageHandler(barData.platforms[0].volume / barData.total)} of all queries. Most were resolved by ${resolveArr[0].name} (${resolveArr[0].volume} queries or ${percentageHandler(resolveArr[0].volume / barData.total)}) with the top three query types being: ${topThreeLabels[0]} (${numParse(topThreeVolume[0])} queries or ${percentageHandler(topThreeVolume[0] / barData.total)}), ${topThreeLabels[1]} (${numParse(topThreeVolume[1])} queries or ${percentageHandler(topThreeVolume[1] / barData.total)}), ${topThreeLabels[2]} (${numParse(topThreeVolume[2])} queries or ${percentageHandler(topThreeVolume[2] / barData.total)}). Regarding the query departments, the most requested department was ${referrersArr[0].name} with ${percentageHandler(referrersArr[0].volume / barData.total)} (${numParse(referrersArr[0].volume)} queries) directed to them and the busiest date this week being ${formatDbTime(daysArr[0].date).split(",")[0]} where we got ${numParse(daysArr[0].volume)} queries accounting for ${percentageHandler(daysArr[0].volume / barData.total)} of all queries.`;
	});
</script>

<h3>Queries</h3>
<p class="mb-4 text-[12pt] italic opacity-60">
	A deep dive into what's been happening with your queries, get a deeper understanding and
	appreciation for what people want!
</p>

<div class="main-tainer">
	<div class="heat-radar">
		<div class="heat"><HeatMap data={heatMapData} /></div>
		<div class="radar"><Radar data={radarData} /></div>
	</div>
	<div class="bar-polar-comment">
		<div class="bar">
			{#if barData}
				<PlatformsColumn
					data={barData}
					height={300}
					offsetY={10}
					title="WoW Platform Contribution"
				/>
			{:else}
				<div class="flex h-full flex-col items-center justify-center">
					<h3>No Data.</h3>
				</div>
			{/if}
		</div>
		<div class="polar"><PolarArea data={polarData} /></div>
		<div class="comment">
			<h4>WoW Query Summary</h4>
			<p class="px-3 text-justify text-[11pt]">{querySummary}</p>
		</div>
	</div>
</div>

<style lang="scss">
	.main-tainer {
		width: 100%;
		height: 780px;
		// border: 1px solid red;
		display: flex;
		flex-direction: column;
		margin-bottom: 20px;

		.heat-radar,
		.bar-polar-comment {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
		}

		.heat-radar {
			border-bottom: 1px solid var(--shadow);
			.heat {
				width: 64%;
				height: 450px;
			}

			.radar {
				width: 35%;
				height: 450px;
			}
		}

		.bar-polar-comment {
			margin-top: 20px;
			.bar,
			.polar {
				width: 31%;
				height: 300px;
			}

			.polar {
				border-left: 1px solid var(--shadow);
				border-right: 1px solid var(--shadow);
			}

			.comment {
				width: 35%;
				height: 300px;

				h4 {
					width: 100%;
					text-align: center;
					margin-top: 3px;
				}
			}
		}
	}
</style>
