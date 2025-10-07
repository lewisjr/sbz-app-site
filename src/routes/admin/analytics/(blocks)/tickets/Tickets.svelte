<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	//types
	import type { TicketsAnalysis, ResolutionAnalytics } from "../../types";

	//componenets - custom
	import QueryPie from "./QueryPie.svelte";
	import PlatformsColumn from "./PlatformsColumn.svelte";
	import TimeToResolve from "./TimeToResolve.svelte";
	import TimeRangeAnalysis from "./TimeRangeAnalysis.svelte";
	import PercentileBox from "./PercentileBox.svelte";
	import HoursLine from "./HoursLine.svelte";
	import RespondersBar from "./RespondersBar.svelte";
	import ResolversBar from "./ResolversBar.svelte";

	export let ticketsData: TicketsAnalysis;
	export let resolutionStats: ResolutionAnalytics;
</script>

<h2>Tickets</h2>
<p class="italic opacity-60">
	Tickets or queries, take a look at what's been happening with your clients.
</p>

<div class={`infographics${mode.current === "dark" ? " d" : ""}`}>
	<div class="pie">
		<QueryPie data={ticketsData} />
	</div>
	<div class={`platforms${mode.current === "dark" ? " d" : ""}`}>
		<PlatformsColumn data={ticketsData} />
	</div>
</div>

<div class="infograstics">
	<div class="scatter-range">
		<div class={`scatter${mode.current === "dark" ? " d" : ""}`}>
			<TimeToResolve data={resolutionStats} />
		</div>
		<div class="range">
			<TimeRangeAnalysis data={resolutionStats} />
		</div>
	</div>
	<div class={`box-funnel-line${mode.current === "dark" ? " d" : ""}`}>
		<div class="box">
			<PercentileBox data={resolutionStats} />
		</div>
		<div class={`line${mode.current === "dark" ? " d" : ""}`}>
			<HoursLine data={resolutionStats} />
		</div>
		<div class="funnel">
			<div class="left">
				<ResolversBar data={resolutionStats} />
			</div>
			<div class="right">
				<RespondersBar data={resolutionStats} />
			</div>
			<div class={`spacer${mode.current === "dark" ? " d" : ""}`}></div>
		</div>
	</div>
</div>

<style lang="scss">
	.infographics {
		width: 100%;
		height: 500px;
		display: flex;
		flex-direction: row;
		border-bottom: 1px solid rgba(99, 99, 99, 0.322);

		&.d {
			border-bottom: 1px solid rgba(277, 277, 277, 0.322) !important;
		}

		.pie {
			width: 600px;
			height: 500px;
			position: relative;
		}

		.platforms {
			width: 100%;
			margin-left: -50px;
			border-left: 1px solid rgba(99, 99, 99, 0.322);

			&.d {
				border-left: 1px solid rgba(227, 227, 227, 0.322) !important;
			}
		}
	}

	.infograstics {
		width: 100%;
		height: 800px;
		margin-top: 30px;
		display: flex;
		flex-direction: row;

		.scatter-range {
			width: 60%;
			height: 100%;
			display: flex;
			flex-direction: column;

			.scatter {
				height: 400px;
				width: 100%;
				border-bottom: 1px solid rgba(99, 99, 99, 0.322);

				&.d {
					border-bottom: 1px solid rgba(227, 227, 227, 0.322) !important;
				}
			}
		}

		.box-funnel-line {
			width: 40%;
			height: 100%;
			display: flex;
			flex-direction: column;
			border-left: 1px solid rgba(99, 99, 99, 0.322);

			&.d {
				border-left: 1px solid rgba(227, 227, 227, 0.322) !important;
			}

			.box,
			.funnel {
				width: 100%;
				height: 300px;
			}

			.line {
				width: 100%;
				height: 200px;
				border-top: 1px solid rgba(99, 99, 99, 0.322);
				border-bottom: 1px solid rgba(99, 99, 99, 0.322);

				&.d {
					border-top: 1px solid rgba(227, 227, 227, 0.322) !important;
					border-bottom: 1px solid rgba(227, 227, 227, 0.322) !important;
				}
			}

			.funnel {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				align-items: center;
				position: relative;

				.left,
				.right {
					width: 48%;
					height: 300px;
				}

				.spacer {
					width: 1px;
					height: 89%;
					background-color: rgba(99, 99, 99, 0.493);
					position: absolute;
					left: 50%;
					transform: translateX(-50%);
					z-index: 1;

					&.d {
						background-color: rgba(227, 227, 227, 0.322) !important;
					}
				}
			}
		}
	}
</style>
