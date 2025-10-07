<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import DatePicker from "$lib/components/DatePicker.svelte";
	import { Tickets, TicketsSkeleton } from "./(blocks)/tickets";
	import { SmDisplay, SmDisplaySkeleton } from "./(blocks)/socials";

	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";
	import Label from "$lib/components/ui/label/label.svelte";

	//types
	import type { PageProps } from "./$types";
	import type { SBZdb, TicketRowLean } from "$lib/types";
	import type { TicketsAnalysis, ResolutionAnalytics } from "./types";

	//functions
	import { toTitleCase } from "@cerebrusinc/fstring";

	type SocialsObj = SBZdb["public"]["Tables"]["odyn-socials"]["Row"];

	let { data }: PageProps = $props();

	let ticketData = $state<TicketRowLean[]>([]);
	let initTickets = $state<boolean>(true);

	let socialsData = $state<SocialsObj[]>([]);
	let initSocials = $state<boolean>(true);

	let loading = $state<boolean>(false);

	let isMobile = $derived($screenWidthStore < 767);

	$effect(() => {
		data.tickets
			.then((res) => {
				ticketData = res;
				initTickets = false;
			})
			.catch(() => {
				toast.error("Failed to get tickets! Please refresh the browser in a few minutes.");
				initTickets = false;
			});
	});

	$effect(() => {
		data.socials
			.then((res) => {
				socialsData = res;
				initSocials = false;
			})
			.catch(() => {
				toast.error("Failed to get social posts! Please refresh the browser in a few minutes.");
				initSocials = false;
			});
	});

	let fromValue = $state<string | undefined>("");
	const updateFrom = (value: any) => (fromValue = value);

	let toValue = $state<string | undefined>("");
	const updateTo = (value: any) => (toValue = value);

	let ticketsAnalysis = $derived.by(() => {
		if (ticketData.length) {
			let total = 0;
			let incomplete = 0;
			let complete = 0;

			const platformsCodex: { [key: string]: number } = {};

			if (fromValue && toValue) {
				const fromDate = new Date(fromValue).getTime();
				const toDate = new Date(toValue).getTime();

				ticketData.forEach((ticket) => {
					const ticketDateArr = ticket.created_at.split("-");
					const ticketDate = new Date(
						`${ticketDateArr[0]}-${ticketDateArr[1]}-${ticketDateArr[2].split("T")[0]}`,
					).getTime();

					if (ticketDate >= fromDate && ticketDate <= toDate) {
						total += 1;

						if (!ticket.close_date) incomplete += 1;
						if (ticket.close_date) complete += 1;

						if (ticket.platform) {
							if (platformsCodex[ticket.platform.toLowerCase()])
								platformsCodex[ticket.platform.toLowerCase()] =
									platformsCodex[ticket.platform.toLowerCase()] + 1;
							else platformsCodex[ticket.platform.toLowerCase()] = 1;
						}
					}
				});
			} else {
				ticketData.forEach((ticket) => {
					total += 1;

					if (!ticket.close_date) incomplete += 1;
					if (ticket.close_date) complete += 1;

					if (ticket.platform) {
						if (platformsCodex[ticket.platform.toLowerCase()])
							platformsCodex[ticket.platform.toLowerCase()] =
								platformsCodex[ticket.platform.toLowerCase()] + 1;
						else platformsCodex[ticket.platform.toLowerCase()] = 1;
					}
				});
			}

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

			const platformsArr: { platform: string; volume: number }[] = [];

			Object.keys(platformsCodex).forEach((platform) => {
				const volume = platformsCodex[platform];

				platformsArr.push({ platform, volume });
			});

			platformsArr.sort((a, b) => b.volume - a.volume);

			const obj: TicketsAnalysis = {
				complete,
				completePercent,
				efficiency,
				incomplete,
				incompletePercent,
				platforms: platformsArr,
				popular: platformsArr[0].platform,
				total,
			};

			return obj;
		}
	});

	let reset = $state<number | undefined>(undefined);

	const _reset = () => {
		reset = new Date().getTime();
	};

	let resolutionAnalysis = $derived.by(() => {
		if (ticketData.length) {
			const ranges: Record<string, number> = {};
			const hourCounts: number[] = Array(24).fill(0);
			const durations: number[] = [];

			const _responders: Record<string, { name: string; volume: number }> = {};
			const _resolvers: Record<string, { name: string; volume: number }> = {};

			const scatterData: [number, number][] = [];

			if (fromValue && toValue) {
				const fromDate = new Date(fromValue).getTime();
				const toDate = new Date(toValue).getTime();

				ticketData.forEach((ticket) => {
					const ticketDateArr = ticket.created_at.split("-");
					const ticketDate = new Date(
						`${ticketDateArr[0]}-${ticketDateArr[1]}-${ticketDateArr[2].split("T")[0]}`,
					).getTime();

					if (ticketDate >= fromDate && ticketDate <= toDate) {
						if (ticket.close_date) {
							const created = new Date(ticket.created_at);
							const resolved = new Date(ticket.close_date);

							const durationMs = resolved.getTime() - created.getTime();
							const durationHours = durationMs / (1000 * 60 * 60);
							durations.push(durationHours);

							scatterData.push([created.getTime(), durationHours]);

							// Resolution time range analysis
							const rangeBucket = Math.floor(durationHours); // e.g., 1.3h => '1-2h'
							const rangeLabel = `${rangeBucket}-${rangeBucket + 1}h`;
							ranges[rangeLabel] = (ranges[rangeLabel] || 0) + 1;

							// Peak hour analysis (by ticket creation)
							const hour = created.getUTCHours(); // Change to getHours() if local time preferred
							hourCounts[hour]++;
						}

						const responder = toTitleCase(ticket.assigned);
						const resolver = ticket.closed_by ? toTitleCase(ticket.closed_by) : null;

						if (responder === "") console.log({ responder, ticket: ticket.id });

						if (_responders[responder])
							_responders[responder].volume = _responders[responder].volume + 1;
						else _responders[responder] = { name: responder, volume: 1 };

						if (resolver && _resolvers[resolver])
							_resolvers[resolver].volume = _resolvers[resolver].volume + 1;
						else if (resolver) _resolvers[resolver] = { name: resolver, volume: 1 };
					}
				});
			} else {
				ticketData.forEach((ticket) => {
					if (ticket.close_date) {
						const created = new Date(ticket.created_at);
						const resolved = new Date(ticket.close_date);

						const durationMs = resolved.getTime() - created.getTime();
						const durationHours = durationMs / (1000 * 60 * 60);
						durations.push(durationHours);

						scatterData.push([created.getTime(), durationHours]);

						// Resolution time range analysis
						const rangeBucket = Math.floor(durationHours); // e.g., 1.3h => '1-2h'
						const rangeLabel = `${rangeBucket}-${rangeBucket + 1}h`;
						ranges[rangeLabel] = (ranges[rangeLabel] || 0) + 1;

						// Peak hour analysis (by ticket creation)
						const hour = created.getUTCHours(); // Change to getHours() if local time preferred
						hourCounts[hour]++;
					}

					const responder = toTitleCase(ticket.assigned);
					const resolver = ticket.closed_by ? toTitleCase(ticket.closed_by) : null;

					if (responder === "") console.log({ responder, ticket: ticket.id });

					if (_responders[responder])
						_responders[responder].volume = _responders[responder].volume + 1;
					else _responders[responder] = { name: responder, volume: 1 };

					if (resolver && _resolvers[resolver])
						_resolvers[resolver].volume = _resolvers[resolver].volume + 1;
					else if (resolver) _resolvers[resolver] = { name: resolver, volume: 1 };
				});
			}

			const _getPercentile = (arr: number[], percentile: number): number => {
				if (arr.length === 0) return 0;
				const index = (percentile / 100) * (arr.length - 1);
				const lower = Math.floor(index);
				const upper = Math.ceil(index);
				const weight = index - lower;

				if (lower === upper) return arr[lower];
				return arr[lower] * (1 - weight) + arr[upper] * weight;
			};

			// Sort durations for stats
			durations.sort((a, b) => a - b);

			const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
			const q1 = _getPercentile(durations, 25);
			const median = _getPercentile(durations, 50);
			const q3 = _getPercentile(durations, 75);
			const p90 = _getPercentile(durations, 90);
			const p95 = _getPercentile(durations, 95);

			const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

			const responders = Object.values(_responders).sort((a, b) => b.volume - a.volume);
			const resolvers = Object.values(_resolvers).sort((a, b) => b.volume - a.volume);

			const obj: ResolutionAnalytics = {
				peakHour,
				resolvers,
				responders,
				timeRanges: ranges,
				timeStats: {
					min: durations[0],
					max: durations[durations.length - 1],
					average,
					median,
					p90,
					p95,
					q1,
					q3,
				},
				scatterData,
				hourCounts,
			};

			return obj;
		}
	});
</script>

<Head
	title="Analytics | SBZ Digital"
	ogTitle="Analytics"
	description="View and download insightful meanings to the numbers!"
	ogDescription="View and download insightful meanings to the numbers!"
/>

<div class="top-tainer mt-2 flex flex-row">
	<h1>Analytics</h1>
	<div class="flex flex-row items-center">
		<div class="flex flex-row items-center">
			<Label class="mr-4 text-right">From</Label>
			<DatePicker handler={updateFrom} {reset} />
		</div>
		<div class="ml-6 flex flex-row items-center">
			<Label class="mr-4 text-right">To</Label>
			<DatePicker handler={updateTo} {reset} />
		</div>
		<Button variant="outline" class="ml-6" onclick={_reset}>Reset</Button>
	</div>
</div>

<div class="main-tainer">
	{#if ticketsAnalysis && resolutionAnalysis}
		<Tickets ticketsData={ticketsAnalysis} resolutionStats={resolutionAnalysis} />
	{:else}
		<TicketsSkeleton />
	{/if}
	{#if socialsData.length}
		<SmDisplay platform="Facebook" dateI={fromValue} dateF={toValue} {socialsData} />
		<SmDisplay platform="LinkedIn" flipped dateI={fromValue} dateF={toValue} {socialsData} />
		<SmDisplay platform="Spotify" dateI={fromValue} dateF={toValue} {socialsData} />
		<SmDisplay platform="YouTube" flipped dateI={fromValue} dateF={toValue} {socialsData} />
	{:else}
		<SmDisplaySkeleton platform="Facebook" />
		<SmDisplaySkeleton platform="LinkedIn" flipped />
		<SmDisplaySkeleton platform="Spotify" />
		<SmDisplaySkeleton platform="YouTube" flipped />
	{/if}
	<p class="space">space</p>
</div>

<style lang="scss">
	.top-tainer {
		justify-content: space-between;
	}

	.main-tainer {
		height: calc(100% - 56px);
		overflow-y: auto;
		overflow-x: hidden;
		padding-top: 10px;
	}

	.space {
		color: transparent;
		margin-top: 50px;
		user-select: none;
	}
</style>
