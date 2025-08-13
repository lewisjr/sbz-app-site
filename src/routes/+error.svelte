<script lang="ts">
	import { page } from "$app/state";

	//components - custom
	import Head from "$lib/components/Head.svelte";

	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";

	//icons
	import { Frown, MoveLeft } from "@lucide/svelte";

	let status = $derived(page.status);
</script>

<Head
	title={`${status === 404 ? "Page Not Found" : "Error"} | SBZ Digital`}
	ogTitle={`${status === 404 ? "Page Not Found" : "Error"}`}
	description="Invalid link."
	ogDescription="Invalid link."
/>

<div>
	<h1 class="mb-4">{status === 404 ? "Page Not Found" : "Error"}</h1>
	<Frown class="h-16 w-16" />
	<p class="mt-4 w-[89%] text-center">
		{status === 404
			? "The page you're looking for doesn't exist or has been moved."
			: "An unexpected error has occurred."}
	</p>
	<Button variant="link" href="/sign-in" class="mt-4"
		><MoveLeft class="mr-2 h-4 w-4" />Back to Safety</Button
	>
</div>

<style>
	div {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		@media screen and (max-width: 1024px) {
			height: 100dvh;
		}
	}
</style>
