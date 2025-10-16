<script lang="ts">
	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	//icons
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";

	//types
	import type { SBZdb } from "$lib/types";

	type TempClient = SBZdb["public"]["Tables"]["csd-clients-temp"]["Row"];

	interface Props {
		data: TempClient;
		openSheet: (config: "portfolio" | "file", row: TempClient) => void;
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
			<DropdownMenu.Item onclick={() => openSheet("portfolio", data)}
				>View Portfolio</DropdownMenu.Item
			>
			<DropdownMenu.Item onclick={() => openSheet("file", data)}>View File</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<style lang="scss">
</style>
