<script lang="ts">
	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	//icons
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";

	//types
	import type { SBZdb, Types } from "$lib/types";

	type StaffRow = SBZdb["public"]["Tables"]["admins"]["Row"];

	interface Props {
		data: StaffRow;
		openSheet: (config: Types["StaffActionConfig"], row: StaffRow, width?: number) => void;
		permissions: string[];
	}

	let { data, openSheet, permissions }: Props = $props();
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
			{#if permissions.includes("edit")}
				<DropdownMenu.Item onclick={() => openSheet("edit", data)}>Edit</DropdownMenu.Item>
			{/if}
			<DropdownMenu.Item disabled onclick={() => openSheet("perms", data)}
				>Permissions (W.I.P)</DropdownMenu.Item
			>
			{#if data.approved && permissions.includes("block")}
				<DropdownMenu.Item onclick={() => openSheet("block", data)}>Block</DropdownMenu.Item>
			{/if}
			{#if !data.approved && permissions.includes("block")}
				<DropdownMenu.Item onclick={() => openSheet("unblock", data)}>Unblock</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Group>

		<!-- <DropdownMenu.Separator /> -->
	</DropdownMenu.Content>
</DropdownMenu.Root>

<style lang="scss">
</style>
