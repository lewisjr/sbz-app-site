<script lang="ts">
</script>

<h2>Tickets</h2>
<p class="italic opacity-60">
	Tickets or queries, take a look at what's been happening with your clients.
</p>

<div class="infographics">
	<div class="pie loading"></div>
	<div class="platforms loading"></div>
</div>

<div class="infograstics">
	<div class="scatter-range">
		<div class="scatter loading"></div>
		<div class="range loading"></div>
	</div>
	<div class="box-funnel-line">
		<div class="box loading"></div>
		<div class="line loading"></div>
		<div class="funnel">
			<div class="left loading"></div>
			<div class="right loading"></div>
			<div class="spacer"></div>
		</div>
	</div>
</div>

<style lang="scss">
	.infographics {
		width: 100%;
		height: 500px;
		display: flex;
		flex-direction: row;

		.pie {
			width: 500px;
			height: 500px;
			position: relative;
		}

		.platforms {
			width: calc(100% - 520px);
			margin-left: 20px;
		}
	}

	.infograstics {
		width: 100%;
		height: 800px;
		margin-top: 30px;
		display: flex;
		flex-direction: row;

		.scatter-range {
			width: 60%;
			height: 100%;
			display: flex;
			flex-direction: column;

			.scatter {
				height: 395px;
				width: 98%;
			}

			.range {
				height: 395px;
				width: 98%;
				margin-top: 10px;
			}
		}

		.box-funnel-line {
			width: 40%;
			height: 100%;
			display: flex;
			flex-direction: column;

			.box,
			.funnel {
				width: 100%;
				height: 295px;
			}

			.line {
				width: 100%;
				height: 200px;
				margin: 10px 0px;
			}

			.funnel {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				align-items: center;
				position: relative;

				.left,
				.right {
					width: 48%;
					height: 300px;
				}

				.spacer {
					width: 1px;
					height: 89%;
					background-color: rgba(99, 99, 99, 0.493);
					position: absolute;
					left: 50%;
					transform: translateX(-50%);
					z-index: 1;
				}
			}
		}
	}
</style>
