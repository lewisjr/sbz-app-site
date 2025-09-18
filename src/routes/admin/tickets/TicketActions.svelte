<script lang="ts">
	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	//icons
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";

	//types
	import type { SBZdb, Types } from "$lib/types";

	type TicketRow = SBZdb["public"]["Tables"]["odyn-tickets"]["Row"];

	interface Props {
		data: TicketRow;
		openSheet: (config: Types["ActionConfig"], row: TicketRow, width?: number) => void;
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
			<DropdownMenu.Label>Actions</DropdownMenu.Label>
			<DropdownMenu.Item onclick={() => navigator.clipboard.writeText(data.id)}>
				Copy payment ID
			</DropdownMenu.Item>
		</DropdownMenu.Group>

		<DropdownMenu.Separator />

		<DropdownMenu.Group>
			<DropdownMenu.Label>Admin</DropdownMenu.Label>
			<DropdownMenu.Item onclick={() => openSheet("re-assign", data)}
				>Reassign Ticket</DropdownMenu.Item
			>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<style lang="scss">
</style>
