<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { prettyDate } from "$lib/utils";
	import { tick } from "svelte";

	//stores
	import { newsJsonCacheStore, screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";
	import AnyDrawer from "$lib/components/AnyDrawer.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";

	//icons
	import { Search, ChevronRight, Eye } from "@lucide/svelte";

	//types
	import type { GenericResponseWData, NewsLean } from "$lib/types";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let initialising = $state<boolean>(true);
	let newsLean = $state<NewsLean[]>([]);

	let isMobile = $derived($screenWidthStore < 767);

	const initArticle: NewsLean = {
		analyst: "",
		date: 0,
		id: 0,
		summary: "",
		symbol: "",
		title: "",
	};

	let activeRow = $state<NewsLean>(initArticle);
	let newsFilterValue = $state<string>("");

	let initPdf = $state<boolean>(true);

	$effect(() => {
		data.news
			.then((res) => {
				newsLean = res.news;
				initialising = false;
			})
			.catch(() => {
				initialising = false;
			});
	});

	const setActive = (row: NewsLean) => {
		activeRow = row;
	};

	let filteredNews = $derived.by(() => {
		return newsLean.filter((entry) => {
			let res: boolean = false;

			const _sanitize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
			const _compare = (value: string) => _sanitize(value).includes(_sanitize(newsFilterValue));

			if (_compare(prettyDate(entry.date))) res = true;
			if (_compare(entry.title)) res = true;
			if (_compare(entry.symbol)) res = true;
			if (_compare(entry.analyst)) res = true;

			return res;
		});
	});

	let openTrigger = $state<number>(0);

	let selectedPdfJson = $state<any | undefined>(undefined);

	const fetchJson = async () => {
		try {
			const req = await fetch("/api/d/news", {
				method: "POST",
				body: JSON.stringify({ id: activeRow.id }),
			});

			toast.info(req.url);

			const res: GenericResponseWData<any | undefined> = await req.json();

			if (res.success && res.data) {
				newsJsonCacheStore.update((val) => [...val, { id: activeRow.id, json: res.data }]);
				await tick();
				selectedPdfJson = res.data;
			}

			toast.info(JSON.stringify(res));

			initPdf = false;
		} catch (ex: any) {
			toast.error(String(ex));
			initPdf = false;
		}
	};

	const openSheet = async () => {
		const isAvailable = $newsJsonCacheStore.filter((item) => item.id === activeRow.id);

		if (isAvailable.length) {
			initPdf = false;
			selectedPdfJson = isAvailable[0].json;
		} else {
			initPdf = true;
			fetchJson();
		}

		openTrigger = Date.now();
	};

	let drawerTitle = $state<string>("");
	type DrawerCfg = "summary" | "pdf";
	let drawerCfg = $state<DrawerCfg>("summary");

	const openDrawer = (row: NewsLean, cfg: DrawerCfg) => {
		activeRow = row;
		drawerCfg = cfg;

		switch (cfg) {
			case "summary":
				drawerTitle = row.title;
				break;
			case "pdf":
				drawerTitle = `View ${row.title} PDF`;
				const isAvailable = $newsJsonCacheStore.filter((item) => item.id === activeRow.id);

				if (isAvailable.length) {
					initPdf = false;
					selectedPdfJson = isAvailable[0].json;
				} else {
					initPdf = true;
					fetchJson();
				}
				break;
			default:
				return;
		}

		openTrigger = Date.now();
	};
</script>

<Head
	title="News | SBZ Digital"
	ogTitle="News"
	description="Stay up to date with the market goings on."
	ogDescription="Stay up to date with the market goings on."
/>

{#if initialising}
	{#if isMobile}
		<div class="flex flex-col">
			<h1>News</h1>
			<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
				<Search class="mr-4" />
				<Input class="loading no-padding w-[100%]" placeholder="" type="text" disabled />
			</div>
		</div>

		<div class="main">
			<section class="list">
				<ul class="articles">
					<li class="article">
						<div class="flex w-[100%] flex-col">
							<p class="loading no-padding">12 Sep 2025</p>
							<p class="loading no-padding my-2">Lorem ipsum dolor sit amet consectetur</p>
							<p class="loading no-padding"><strong>Analyst:</strong>{" "}Thales AI</p>
						</div>
					</li>

					<li class="article">
						<div class="flex w-[100%] flex-col">
							<p class="loading no-padding">12 Sep 2025</p>
							<p class="loading no-padding my-2">Lorem ipsum dolor sit amet consectetur</p>
							<p class="loading no-padding"><strong>Analyst:</strong>{" "}Thales AI</p>
						</div>
					</li>

					<li class="article">
						<div class="flex w-[100%] flex-col">
							<p class="loading no-padding">12 Sep 2025</p>
							<p class="loading no-padding my-2">Lorem ipsum dolor sit amet consectetur</p>
							<p class="loading no-padding"><strong>Analyst:</strong>{" "}Thales AI</p>
						</div>
					</li>
				</ul>
			</section>
		</div>
	{:else}
		<h1>News</h1>
		<div class="main">
			<section class="list">
				<div class="mt-2 flex w-[100%] flex-row items-center">
					<Search class="mr-4" />
					<Input class="loading no-padding w-[85%]" placeholder="" type="text" disabled />
				</div>

				<ul class="articles">
					<li class="article">
						<div class="flex w-[100%] flex-col">
							<p class="loading no-padding">12 Sep 2025</p>
							<p class="loading no-padding my-2">Lorem ipsum dolor sit amet consectetur</p>
							<p class="loading no-padding"><strong>Analyst:</strong>{" "}Thales AI</p>
						</div>
					</li>

					<li class="article">
						<div class="flex w-[100%] flex-col">
							<p class="loading no-padding">12 Sep 2025</p>
							<p class="loading no-padding my-2">Lorem ipsum dolor sit amet consectetur</p>
							<p class="loading no-padding"><strong>Analyst:</strong>{" "}Thales AI</p>
						</div>
					</li>

					<li class="article">
						<div class="flex w-[100%] flex-col">
							<p class="loading no-padding">12 Sep 2025</p>
							<p class="loading no-padding my-2">Lorem ipsum dolor sit amet consectetur</p>
							<p class="loading no-padding"><strong>Analyst:</strong>{" "}Thales AI</p>
						</div>
					</li>
				</ul>
			</section>
		</div>
	{/if}
{:else if !newsLean.length}
	{#if isMobile}
		<div class="flex flex-col">
			<h1>News</h1>
			<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
				<Search class="mr-4" />
				<Input class="loading no-padding w-[100%]" placeholder="Search News" type="text" disabled />
			</div>
		</div>

		<div class="main">
			<p class="mx-auto mt-5 w-[100%] text-center">No articles.</p>
		</div>
	{:else}
		<h1>News</h1>
		<div class="main">
			<section class="list">
				<div class="mt-2 flex w-[100%] flex-row items-center">
					<Search class="mr-4" />
					<Input class="w-[85%]" placeholder="Search News..." type="text" disabled />
				</div>

				<p class="mx-auto mt-5 w-[100%] text-center">No articles.</p>
			</section>
		</div>
	{/if}
{:else}
	{#if isMobile}
		<div class="flex flex-col">
			<h1>News</h1>
			<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
				<Search class="mr-4" />
				<Input
					class="w-[100%]"
					placeholder="Search News..."
					type="text"
					bind:value={newsFilterValue}
				/>
			</div>
		</div>

		<div class="main">
			<section class="list">
				<ul class="articles">
					{#each filteredNews as article}
						<li class={`article${article.id === activeRow.id ? " chosen" : ""}`}>
							<div class="flex w-[100%] flex-col">
								<p>{prettyDate(article.date)}</p>
								<p>{article.title}</p>
								<p><strong>Analyst:</strong>{" "}{article.analyst}</p>
							</div>

							<Button variant="outline" onclick={() => openDrawer(article, "summary")}
								>Read <Eye /></Button
							>
						</li>
					{/each}
				</ul>
			</section>
		</div>
	{:else}
		<h1>News</h1>
		<div class="main">
			<section class="list">
				<div class="mt-2 flex w-[100%] flex-row items-center">
					<Search class="mr-4" />
					<Input
						class="w-[85%]"
						placeholder="Search News..."
						type="text"
						bind:value={newsFilterValue}
					/>
				</div>

				<ul class="articles">
					{#each filteredNews as article}
						<li class={`article${article.id === activeRow.id ? " chosen" : ""}`}>
							<div class="flex w-[100%] flex-col">
								<p>{prettyDate(article.date)}</p>
								<p>{article.title}</p>
								<p><strong>Analyst:</strong>{" "}{article.analyst}</p>
							</div>

							<Button variant="ghost" onclick={() => setActive(article)}><ChevronRight /></Button>
						</li>
					{/each}
				</ul>
			</section>
			<section class="summary">
				{#if activeRow.analyst === ""}
					<p class="text">Select an article to view the summary.</p>
				{:else}
					<p class="text">
						<strong class="text-[14pt]">Summary</strong><br /><br />
						{activeRow.summary}
					</p>
					<Button variant="outline" class="ml-5" onclick={openSheet}>View PDF</Button>
				{/if}
			</section>
		</div>
	{/if}

	{#if isMobile}
		<AnyDrawer {openTrigger} width={undefined} big={true} title={drawerTitle} description="">
			{#snippet main()}
				{#if drawerCfg === "summary"}
					<section class="summary">
						{#if activeRow.analyst === ""}
							<p class="text">Select an article to view the summary.</p>
						{:else}
							<p class="text">
								{activeRow.summary}
							</p>

							<!--
							<Button variant="outline" class="mt-5" onclick={() => openDrawer(activeRow, "pdf")}
								>View PDF</Button
							>
							-->
						{/if}
					</section>
				{:else}
					<div class="holder">
						<div class="doc">
							<div class="document">
								{#if initPdf}
									<div class="page" id={"page"}>
										<div class="loading no-padding mx-auto mt-8 w-[500px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[500px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[200px]">test</div>

										<div class="loading no-padding mx-auto mt-10 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>

										<div class="loading no-padding mx-auto mt-10 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>

										<div class="loading no-padding mx-auto mt-10 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
										<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									</div>
								{:else if !selectedPdfJson}
									<p>Failed to fetch PDF.</p>
								{:else}
									{#each selectedPdfJson.Pages as page, pageIndex}
										<div class="page" id={"page-" + pageIndex}>
											{#each page.Texts as text}
												{#each text.R as r}
													<div
														class="text-block"
														style="left: {text.x * 25}px;top: {text.y * 27}px;font-size: {r
															.TS?.[1] || 12}px;"
													>
														{decodeURIComponent(r.T)}
													</div>
												{/each}
											{/each}
										</div>
									{/each}
								{/if}
							</div>
						</div>
					</div>
				{/if}
			{/snippet}

			{#snippet actionButton()}
				<span></span>
			{/snippet}
		</AnyDrawer>
	{:else}
		<AnySheet
			{openTrigger}
			width={undefined}
			big={true}
			title={`View ${activeRow.title} PDF`}
			description=""
		>
			{#snippet main()}
				<div class="holder">
					<div class="doc">
						<div class="document">
							{#if initPdf}
								<div class="page" id={"page"}>
									<div class="loading no-padding mx-auto mt-8 w-[500px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[500px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[200px]">test</div>

									<div class="loading no-padding mx-auto mt-10 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>

									<div class="loading no-padding mx-auto mt-10 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>

									<div class="loading no-padding mx-auto mt-10 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
									<div class="loading no-padding mx-auto mt-3 w-[900px]">test</div>
								</div>
							{:else if !selectedPdfJson}
								<p>Failed to fetch PDF.</p>
							{:else}
								{#each selectedPdfJson.Pages as page, pageIndex}
									<div class="page" id={"page-" + pageIndex}>
										{#each page.Texts as text}
											{#each text.R as r}
												<div
													class="text-block"
													style="left: {text.x * 25}px;top: {text.y * 27}px;font-size: {r.TS?.[1] ||
														12}px;"
												>
													{decodeURIComponent(r.T)}
												</div>
											{/each}
										{/each}
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			{/snippet}

			{#snippet actionButton()}
				<span></span>
			{/snippet}
		</AnySheet>
	{/if}
{/if}

<style lang="scss">
	.main {
		width: 100%;
		height: calc(100% - 58px);
		margin-top: 6px;
		display: flex;
		flex-direction: row;

		.list {
			width: 360px;
			height: 100%;
			overflow-y: auto;
			//border: 1px solid red;
			position: relative;
			z-index: 1;
			//background-color: var(--background);
			box-shadow: 1px 0px 0px var(--shadow);

			.articles {
				width: calc(100% - 10px);
				height: 100%;
				padding: 15px 0px;

				.article {
					width: 100%;
					display: flex;
					flex-direction: row;
					border-bottom: 1px solid var(--muted);
					margin-bottom: 10px;
					padding: 10px;
					border-left: 1px solid transparent;
					border-right: 1px solid transparent;
					border-top: 1px solid transparent;
					align-items: center;

					&:hover {
						border: 1px solid var(--shadow);
						border-radius: var(--radius);
					}

					p {
						width: fit-content;
					}

					p:nth-child(1) {
						font-size: 0.9em;
						opacity: 0.7;
						font-style: italic;
					}

					p:nth-child(2) {
						font-size: 0.95em;
					}

					p:nth-child(3) {
						font-size: 0.9em;
						opacity: 0.7;
						font-style: italic;
					}
				}
			}
		}

		.summary {
			width: calc(100% - 360px);
			height: 100%;
			//border: 1px solid lightblue;
			display: flex;
			flex-direction: row;
			overflow-y: auto;
			position: relative;
			justify-content: center;
			align-items: center;

			.text {
				width: 70%;
				text-align: center;
				padding: 20px 10px;
				border: 1px solid var(--shadow);
				border-radius: var(--radius);
			}
		}

		@media screen and (max-width: 766px) {
			width: 100%;
			flex: 1;
			overflow-y: auto;
			height: calc(100% - 81px);

			.list {
				box-shadow: none;
			}
		}
	}

	.holder {
		display: flex;
		flex-direction: column;
		height: fit-content;
		width: 100%;
		position: relative;
	}

	.doc {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 10px 0px;
		margin: 0px auto;
		overflow-y: none;

		&.mid {
			justify-content: center;
		}

		.document {
			display: flex;
			flex-direction: column;
			gap: 3rem;
			overflow-y: none;

			.page {
				position: relative;
				width: 1000px;
				height: 1400px;
				border: 1px solid #ccc;
			}

			.text-block {
				position: absolute;
				white-space: nowrap;
				font-family: sans-serif;
			}
		}
	}
</style>
