<script lang="ts">
	//components - custom
	import Head from "$lib/components/Head.svelte";

	//types
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<Head
	title={`Ticket ${data.ticketId} | SBZ Digital`}
	ogTitle={`Ticket ${data.ticketId}`}
	description="Chat with your assigned broker!"
	ogDescription="Chat with your assigned broker!"
/>

<h1>W.I.P</h1>
