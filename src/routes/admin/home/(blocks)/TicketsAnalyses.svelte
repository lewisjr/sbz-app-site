<script lang="ts">
	//functions
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { numParse } from "@cerebrusinc/qol";
	import { devLog, formatDbTime, percentageHandler } from "$lib/utils";

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

	let analytics = $derived.by(() => {
		if (!data?.length) {
			return {
				heatMapData: [] as HeatMapData[],
				radarData: { data: [], labels: [] } as RadarData,
				polarData: { data: [], labels: [] } as RadarData,
				barData: undefined as TicketsAnalysis | undefined,
				querySummary: "No data available for this period.",
			};
		}

		// --- LAST 7 UNIQUE DATES ---
		const dates = Array.from(new Set(data.map((t) => t.created_at.slice(0, 10))))
			.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
			.slice(0, 7);

		const wowData = data.filter((t) => dates.includes(t.created_at.slice(0, 10)));

		// --- CODICES ---
		const heatMapCodex: Record<string, { name: string; x: string; y: number }> = {};
		const radarCodex: Record<string, number> = {};
		const polarCodex: Record<string, number> = {};
		const barCodex: Record<string, number> = {};
		const resolvedCodex: Record<string, number> = {};

		let total = 0;
		let complete = 0;
		let incomplete = 0;

		wowData.forEach((t) => {
			const date = t.created_at.slice(0, 10);

			// HeatMap
			const hKey = t.referral_source ? toTitleCase(t.referral_source.replace(/-/g, " ")) : null;
			if (hKey) {
				const key = `${date}-${hKey}`;
				heatMapCodex[key] = { name: hKey, x: date, y: (heatMapCodex[key]?.y ?? 0) + 1 };
			}

			// Radar
			const rKey = t.query_type ? toTitleCase(t.query_type.replace(/-/g, " ")) : null;
			if (rKey) radarCodex[rKey] = (radarCodex[rKey] ?? 0) + 1;

			// Polar
			const pKey = t.close_date ? "Complete" : "Incomplete";
			polarCodex[pKey] = (polarCodex[pKey] ?? 0) + 1;

			// Bar
			total++;
			if (t.close_date) complete++;
			else incomplete++;
			if (t.platform)
				barCodex[t.platform.toLowerCase()] = (barCodex[t.platform.toLowerCase()] ?? 0) + 1;

			// Resolved by
			if (t.closed_by) {
				const name = toTitleCase(t.closed_by);
				resolvedCodex[name] = (resolvedCodex[name] ?? 0) + 1;
			}
		});

		// --- HeatMap Data (Immutable) ---
		const heatMapGrouped: Record<string, { x: string; y: number }[]> = {};
		Object.values(heatMapCodex).forEach(({ name, x, y }) => {
			heatMapGrouped[name] = [...(heatMapGrouped[name] ?? []), { x, y }];
		});
		const heatMapData: HeatMapData[] = Object.entries(heatMapGrouped).map(([name, data]) => ({
			name,
			data: [...data].sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime()),
		}));

		// --- Radar Data ---
		const radarLabels = Object.keys(radarCodex);
		const radarValues = radarLabels.map((label) => radarCodex[label]);
		const radarData: RadarData = { data: radarValues, labels: radarLabels };

		// --- Polar Data ---
		const polarLabels = Object.keys(polarCodex);
		const polarValues = polarLabels.map((label) => polarCodex[label]);
		const polarData: RadarData = { data: polarValues, labels: polarLabels };

		// --- Bar Data ---
		const barArr = Object.entries(barCodex)
			.map(([platform, volume]) => ({ platform, volume }))
			.sort((a, b) => b.volume - a.volume);

		const completePercent = total ? complete / total : 0;
		const barData: TicketsAnalysis = {
			complete,
			completePercent,
			efficiency:
				completePercent < 0.5
					? "BAD"
					: completePercent < 0.7
						? "FAIR"
						: completePercent < 0.9
							? "GOOD"
							: "SUPERB",
			incomplete,
			incompletePercent: total ? incomplete / total : 0,
			platforms: barArr,
			popular: barArr[0]?.platform ?? "",
			total,
		};

		// --- Summary ---
		const resolveArr = Object.entries(resolvedCodex)
			.map(([name, volume]) => ({ name, volume }))
			.sort((a, b) => b.volume - a.volume);

		const polarRanking = radarLabels
			.map((label) => ({ label, volume: radarCodex[label] }))
			.sort((a, b) => b.volume - a.volume)
			.slice(0, 3);

		const daysArr = Object.values(heatMapCodex)
			.map(({ x, y }) => ({ date: x, volume: y }))
			.sort((a, b) => b.volume - a.volume);

		const referrersArr = Object.values(heatMapCodex)
			.map(({ name, y }) => ({ name, volume: y }))
			.sort((a, b) => b.volume - a.volume);

		const querySummary =
			total === 0
				? "No data available."
				: `Over the past week, we received a total of ${numParse(barData.total)} queries with a completion rate of ${percentageHandler(barData.complete / barData.total)} resulting in a ${barData.efficiency.toLowerCase()} efficiency rating. The platform that received the most queries was ${toTitleCase(barData.popular)} representing ${percentageHandler(barData.platforms[0].volume / barData.total)} of all queries. Most were resolved by ${resolveArr[0]?.name} (${resolveArr[0]?.volume} queries or ${percentageHandler(resolveArr[0]?.volume / barData.total)}) with the top three query types being: ${polarRanking.map((p) => `${p.label} (${numParse(p.volume)} queries or ${percentageHandler(p.volume / barData.total)})`).join(", ")}. Regarding referral sources for SBZ, the most prevalent was ${referrersArr[0]?.name} with ${percentageHandler(referrersArr[0]?.volume / barData.total)} (${numParse(referrersArr[0]?.volume)} queries), and the busiest date this week being ${formatDbTime(daysArr[0]?.date ?? "").split(",")[0]} where we got ${numParse(daysArr[0]?.volume ?? 0)} queries accounting for ${percentageHandler((daysArr[0]?.volume ?? 0) / barData.total)} of all queries.`;

		return { heatMapData, radarData, polarData, barData, querySummary };
	});
</script>

<h3>Queries</h3>
<p class="mb-4 text-[12pt] italic opacity-60">
	A deep dive into what's been happening with your queries, get a deeper understanding and
	appreciation for what people want!
</p>

<div class="main-tainer">
	<div class="heat-radar">
		<div class="heat"><HeatMap data={analytics.heatMapData} /></div>
		<div class="radar"><Radar data={analytics.radarData} /></div>
	</div>
	<div class="bar-polar-comment">
		<div class="bar">
			{#if analytics.barData}
				<PlatformsColumn
					data={analytics.barData}
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
		<div class="polar"><PolarArea data={analytics.polarData} /></div>
		<div class="comment">
			<h4>WoW Query Summary</h4>
			<p class="px-3 text-justify text-[11pt]">{analytics.querySummary}</p>
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
