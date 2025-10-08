<script lang="ts">
	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";

	//icons
	import { FileChartColumn } from "@lucide/svelte";

	//types
	import type { SBZdb } from "$lib/types";

	type SettledTrade = SBZdb["public"]["Tables"]["settled_trades"]["Row"];

	interface Props {
		data: SettledTrade;
		openSheet: (row: SettledTrade) => void;
	}

	let { data, openSheet }: Props = $props();
</script>

<Button variant="outline" onclick={() => openSheet(data)}><FileChartColumn /></Button>
