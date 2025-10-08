<script lang="ts">
	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";

	//icons
	import { FileChartColumn } from "@lucide/svelte";

	//types
	import type { NFdb } from "$lib/types";

	type OnScreenOrder = NFdb["public"]["Tables"]["on-screen-orders"]["Row"];

	interface Props {
		data: OnScreenOrder;
		openSheet: (row: OnScreenOrder) => void;
	}

	let { data, openSheet }: Props = $props();
</script>

<Button variant="outline" onclick={() => openSheet(data)}><FileChartColumn /></Button>
