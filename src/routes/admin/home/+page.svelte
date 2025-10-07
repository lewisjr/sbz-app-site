<script lang="ts">
	//components - custom
	import Head from "$lib/components/Head.svelte";
	import {
		SmEngaement,
		SmEngaementSkeleton,
		TicketsAnalyses,
		TicketsAnalysesSkeleton,
	} from "./(blocks)";

	//types
	import type { PageProps } from "./$types";
	import type { SBZdb } from "$lib/types";
	import type { TicketRowLean } from "$lib/types";

	//icons
	import { CircleCheck, CircleX } from "@lucide/svelte";

	let { data }: PageProps = $props();
	interface SystemStatus {
		success: boolean;
		version: string;
	}

	let agentStatus = $state<SystemStatus | undefined>(undefined);
	let siteStatus = $state<SystemStatus | undefined>(undefined);

	$effect(() => {
		data.agentStatus.then((res) => (agentStatus = res));
	});

	$effect(() => {
		data.siteStatus.then((res) => (siteStatus = res));
	});

	type SocialsObj = SBZdb["public"]["Tables"]["odyn-socials"]["Row"];

	let ticketData = $state<TicketRowLean[]>([]);
	let socialsData = $state<SocialsObj[]>([]);

	$effect(() => {
		data.tickets.then((res) => (ticketData = res));
	});

	$effect(() => {
		data.socials.then((res) => (socialsData = res));
	});
</script>

<Head
	title="Home | SBZ Admin"
	ogTitle="Admin Home"
	description="Take control of your data."
	ogDescription="Take control of your data."
/>

<div class="top-tainer mt-2 flex flex-row">
	<h1>Dashboard</h1>
	<div class="flex flex-row">
		<div class="items flex flex-row items-center">
			{#if agentStatus}
				<p class="mr-2 italic opacity-60">Agent Status</p>
				<div class="system-status">
					<span class={`${agentStatus.success ? "good" : "bad"}`}>
						{#if agentStatus.success}
							<CircleCheck class="mr-2" />
						{:else}
							<CircleX class="mr-2" />
						{/if}
					</span>
					<p class="">v{agentStatus.version}</p>
				</div>
			{:else}
				<p class="mr-2 italic opacity-60">Agent Status</p>
				<div class="system-status">
					<span>
						<CircleCheck class="loading mr-2" />
					</span>
					<p class="loading">v2.5.0</p>
				</div>
			{/if}

			{#if siteStatus}
				<p class="mr-2 ml-4 italic opacity-60">Site Status</p>
				<div class="system-status">
					<span class={`${siteStatus.success ? "good" : "bad"}`}>
						{#if siteStatus.success}
							<CircleCheck class="mr-2" />
						{:else}
							<CircleX class="mr-2" />
						{/if}
					</span>
					<p>v{siteStatus.version}</p>
				</div>
			{:else}
				<p class="mr-2 ml-4 italic opacity-60">Site Status</p>
				<div class="system-status">
					<span>
						<CircleCheck class="loading mr-2" />
					</span>
					<p class="loading">v2.5.0</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<p class="mt-4 text-[13pt] italic opacity-70">
	Overall growth statistics from inception and from the past seven days, as well as smart query
	analytics.
</p>

<div class="main-tainer">
	{#if ticketData.length}
		<TicketsAnalyses data={ticketData} />
	{:else}
		<TicketsAnalysesSkeleton />
	{/if}
	{#if socialsData.length}
		<SmEngaement platform="Facebook" data={socialsData} />
		<SmEngaement platform="LinkedIn" data={socialsData} flipped />
		<SmEngaement platform="YouTube" data={socialsData} />
		<SmEngaement platform="Spotify" data={socialsData} flipped />
	{:else}
		<SmEngaementSkeleton platform="Facebook" />
		<SmEngaementSkeleton platform="LinkedIn" flipped />
		<SmEngaementSkeleton platform="YouTube" />
		<SmEngaementSkeleton platform="Spotify" flipped />
	{/if}
</div>

<style lang="scss">
	.top-tainer {
		justify-content: space-between;
		align-items: center;

		.system-status {
			display: flex;
			flex-direction: row;
			padding: 5px 8px;
			border-radius: var(--radius);
			background-color: var(--shadow);
			align-items: center;

			.loading {
				padding: 0px !important;
			}

			span {
				&.good {
					color: var(--kline-green);
				}

				&.bad {
					color: var(--kline-red);
				}
			}
		}
	}

	.main-tainer {
		height: calc(100% - 115px);
		overflow-y: auto;
		margin-top: 10px;
		width: 100%;
		overflow-x: hidden;
	}

	.space {
		color: transparent;
		margin-top: 50px;
		user-select: none;
	}
</style>
