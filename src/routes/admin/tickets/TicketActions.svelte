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
	}

	let { data, openSheet }: Props = $props();
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
			<DropdownMenu.Item onclick={() => null}>Chat</DropdownMenu.Item>
			{#if data.query_type === "Account Opening" && !data.is_closed}
				<DropdownMenu.Item onclick={() => null}>Review KYC</DropdownMenu.Item>
			{/if}
			{#if !data.is_closed}
				<DropdownMenu.Item onclick={() => null}>Close</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Group>

		<DropdownMenu.Separator />

		<DropdownMenu.Group>
			<DropdownMenu.Label>Admin</DropdownMenu.Label>
			{#if !data.is_closed}
				<DropdownMenu.Item onclick={() => openSheet("reassign", data)}
					>Reassign Ticket</DropdownMenu.Item
				>
			{/if}
			<DropdownMenu.Item onclick={() => openSheet("audit", data)}>Audit</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<style lang="scss">
</style>
