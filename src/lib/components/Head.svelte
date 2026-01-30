<script lang="ts">
	import { page } from "$app/state";
	import favicon from "$lib/assets/favicon.svg";

	interface HTMLHead {
		title: string;
		description: string;
		ogTitle: string;
		ogDescription: string;
		token?: boolean;
	}

	let meta: HTMLHead = $props();

	let href = $derived(page.url.href);
	let origin = $derived(page.url.origin);
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<meta name="author" content="Neos FinTech" />
	<link rel="icon" href={favicon} />
	<meta name="keywords" content="stocbrokers,sbz,zambia,stocks,app,trade,invest" />
	<meta name="og:title" content={meta.ogTitle} />
	<meta name="og:description" content={meta.ogDescription} />
	<meta name="og:url" content={href} />
	<meta name="og:image" content={`${origin}/img/og.png`} />
	<meta name="og:image:alt" content="sbz open graph" />
	<meta name="og:image:width" content="1200" />
	<meta name="og:image:height" content="630" />
	{#if meta.token}
		<meta
			name="viewport"
			content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
		/>
	{:else}
		<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
	{/if}
</svelte:head>
