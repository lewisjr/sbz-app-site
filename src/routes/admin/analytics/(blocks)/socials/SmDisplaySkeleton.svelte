<script lang="ts">
	interface Props {
		platform: "Facebook" | "LinkedIn" | "Spotify" | "YouTube";
		flipped?: boolean;
	}

	let { flipped = false, platform }: Props = $props();
</script>

<h2 class="mt-10">{platform}</h2>
<p class="loading italic opacity-60">
	Dive into what's been happening on facebook since inception.
</p>

<div class={`infographics${flipped ? " flipped" : ""} mt-5`}>
	<div class="summary loading"></div>
	<div class="sparkline loading"></div>
</div>

<style lang="scss">
	.infographics {
		width: 100%;
		height: 600px;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;

		&.flipped {
			flex-direction: row-reverse !important;
		}

		.summary {
			width: 400px;
			height: 600px;
		}

		.sparkline {
			width: calc(100% - 420px);
			height: 600px;
		}
	}
</style>
