<script lang="ts">
	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";

	//icons
	import { FileChartColumn } from "@lucide/svelte";

	//types
	import type { NFdb } from "$lib/types";

	type MatchedTrade = NFdb["public"]["Tables"]["sbz-matched-trades"]["Row"];

	interface Props {
		data: MatchedTrade;
		openSheet: (row: MatchedTrade) => void;
	}

	let { data, openSheet }: Props = $props();
</script>

<Button variant="outline" onclick={() => openSheet(data)}><FileChartColumn /></Button>
