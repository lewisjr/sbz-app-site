<script lang="ts">
	interface Props {
		platform: "Facebook" | "LinkedIn" | "Spotify" | "YouTube";
		flipped?: boolean;
	}

	let { flipped = false, platform }: Props = $props();
</script>

<h3>{platform}</h3>
<p class="mb-4 text-[12pt] italic opacity-60">
	<strong>NOTE</strong> That engagement is a sum of all metrics such as likes, reposts, comments, link
	clicks, and reach/impressions.
</p>

<div class="sm-tainer">
	{#if flipped}
		<div class="commentary-holder">
			<div class="commentary">
				<h4>WoW Followers Summary</h4>
				<p class="loading text-justify text-[11pt]">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin euismod felis a sem
					pulvinar, ut dapibus justo porttitor. Curabitur ornare elit vitae tellus sagittis, in
					placerat purus gravida. Fusce eget sem sed arcu fermentum tincidunt et sed risus. Morbi ut
					nunc nec sem finibus tempor.
				</p>

				<h4 class="mt-2">WoW Engagement Summary</h4>
				<p class="loading text-justify text-[11pt]">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit (15 April 2025 - 24 April 2025).
					Vivamus fermentum ex nec lorem tincidunt, vel egestas magna ullamcorper. Integer in justo
					a magna sollicitudin cursus (1,364 - 16,594), in line with prior weeks showing stable and
					organic development.
				</p>
			</div>
		</div>

		<div class="sparkline-holder mid">
			<div class="sparkline loading"></div>
		</div>

		<div class="sparkline-holder mid">
			<div class="sparkline loading"></div>
		</div>
	{:else}
		<div class="sparkline-holder mid">
			<div class="sparkline loading"></div>
		</div>

		<div class="sparkline-holder mid">
			<div class="sparkline loading"></div>
		</div>

		<div class="commentary-holder">
			<div class="commentary">
				<h4>WoW Followers Summary</h4>
				<p class="loading text-justify text-[11pt]">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin euismod felis a sem
					pulvinar, ut dapibus justo porttitor. Curabitur ornare elit vitae tellus sagittis, in
					placerat purus gravida. Fusce eget sem sed arcu fermentum tincidunt et sed risus. Morbi ut
					nunc nec sem finibus tempor.
				</p>

				<h4 class="mt-2">WoW Engagement Summary</h4>
				<p class="loading text-justify text-[11pt]">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit (15 April 2025 - 24 April 2025).
					Vivamus fermentum ex nec lorem tincidunt, vel egestas magna ullamcorper. Integer in justo
					a magna sollicitudin cursus (1,364 - 16,594), in line with prior weeks showing stable and
					organic development.
				</p>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.sm-tainer {
		width: 100%;
		height: 400px;
		margin-bottom: 25px;
		display: flex;
		flex-direction: row;
		justify-content: space-between;

		.sparkline-holder {
			height: 100%;
			width: 31%;
			display: flex;
			flex-direction: column;
			justify-content: space-between;

			&.mid {
				border-left: 1px solid var(--shadow);
				border-right: 1px solid var(--shadow);
				width: 35%;
				padding: 0px 10px;
			}

			.sparkline {
				width: 100%;
				height: 100%;
			}
		}

		.commentary-holder {
			height: 100%;
			width: 32%;
			display: flex;
			flex-direction: column;

			.commentary {
				height: 50%;
				padding-right: 5px;
			}
		}
	}

	.loading {
		padding: 0px;
	}
</style>
