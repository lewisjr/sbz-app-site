<script lang="ts">
	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	//icons
	import Eye from "@lucide/svelte/icons/eye";

	//types
	import type { SBZdb } from "$lib/types";

	type ClientRow = SBZdb["public"]["Tables"]["clients"]["Row"];

	interface Props {
		data: ClientRow;
		openSheet: (row: ClientRow, width?: number) => void;
		permissions: string[];
	}

	let { data, openSheet, permissions }: Props = $props();
</script>

<Button variant="outline" size="icon" class="w-fit px-2" onclick={() => openSheet(data)}>
	<span class="sr-only">Review</span>
	Review<Eye />
</Button>

<style lang="scss">
</style>
