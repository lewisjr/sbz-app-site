<script lang="ts">
	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	//icons
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";

	//types
	import type { SBZdb, Types, TicketRowLean } from "$lib/types";

	interface Props {
		data: TicketRowLean;
		openSheet: (config: Types["ActionConfig"], row: TicketRowLean, width?: number) => void;
		adminUsername: string;
		permissions: string[];
	}

	let { data, openSheet, adminUsername, permissions }: Props = $props();

	//$effect(() => console.log({ permissions }));
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="relative size-8 p-0">
				<span class="sr-only">View Actions</span>
				<EllipsisIcon />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Label>Support</DropdownMenu.Label>

			{#if data.query_type !== "Compliment"}
				<DropdownMenu.Item onclick={() => openSheet("chat", data)}>Chat</DropdownMenu.Item>
			{/if}

			{#if data.query_type === "Compliment"}
				<DropdownMenu.Item disabled>N/A</DropdownMenu.Item>
			{/if}

			<!--
			{#if data.query_type === "Account Opening" && !data.is_closed && data.query.substring(0, 2) === "--"}
				<DropdownMenu.Item onclick={() => null}>Review KYC</DropdownMenu.Item>
			{/if}

			{#if data.luse_id > -1}
				<DropdownMenu.Item onclick={() => null}
					><a href="https://engine.neos.finance/d/portfolio/473044" target="_blank"
						>View Portfolio</a
					></DropdownMenu.Item
				>
			{/if}
			-->

			{#if !data.is_closed && data.assigned !== "odyn" && (data.assigned === adminUsername || permissions.includes("close"))}
				<DropdownMenu.Item onclick={() => openSheet("close", data)}>Close</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Group>

		{#if permissions.includes("reassign") || permissions.includes("audit")}
			<DropdownMenu.Separator />

			<DropdownMenu.Group>
				<DropdownMenu.Label>Admin</DropdownMenu.Label>
				{#if !data.is_closed && data.assigned !== "odyn" && permissions.includes("reassign")}
					<DropdownMenu.Item onclick={() => openSheet("reassign", data)}
						>Reassign Ticket</DropdownMenu.Item
					>
				{/if}
				{#if permissions.includes("audit")}
					<DropdownMenu.Item onclick={() => openSheet("audit", data)}>Audit</DropdownMenu.Item>
				{/if}
			</DropdownMenu.Group>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>

<style lang="scss">
</style>
