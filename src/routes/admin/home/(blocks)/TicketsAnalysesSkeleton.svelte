<script lang="ts">
</script>

<h3>Queries</h3>
<p class="mb-4 text-[12pt] italic opacity-60">
	A deep dive into what's been happening with your queries, get a deeper understanding and
	appreciation for what people want!
</p>

<div class="main-tainer">
	<div class="heat-radar">
		<div class="heat loading"></div>
		<div class="radar loading"></div>
	</div>
	<div class="bar-polar-comment">
		<div class="bar loading"></div>
		<div class="polar loading"></div>
		<div class="comment">
			<h4>WoW Query Summary</h4>
			<p class="loading px-3 text-justify text-[11pt]">
				Over the past week, we received a total of 110 queries with a completion rate of 59.09%
				resulting in a fair efficiency rating. The platform that received the most queries was
				Whatsapp representing 99.09% of all queries. Most were resolved by Odyn (39 queries or
				35.45%) with the top three query types being: Complaint (27 queries or 24.55%), Account
				Opening (19 queries or 17.27%), Deposit Withdraw (17 queries or 15.45%). Regarding the query
				departments, the most requested department was General with 18.18% (20 queries) directed to
				them and the busiest date this week being 29 April 2025 where we got 20 queries accounting
				for 18.18% of all queries.
			</p>
		</div>
	</div>
</div>

<style lang="scss">
	.main-tainer {
		width: 100%;
		height: 780px;
		display: flex;
		flex-direction: column;
		margin-bottom: 20px;

		.heat-radar,
		.bar-polar-comment {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
		}

		.heat-radar {
			border-bottom: 1px solid var(--shadow);
			.heat {
				width: 64%;
				height: 450px;
			}

			.radar {
				width: 35%;
				height: 450px;
			}
		}

		.bar-polar-comment {
			margin-top: 20px;
			.bar,
			.polar {
				width: 31%;
				height: 300px;
			}

			.polar {
				border-left: 1px solid var(--shadow);
				border-right: 1px solid var(--shadow);
			}

			.comment {
				width: 35%;
				height: 300px;

				h4 {
					width: 100%;
					text-align: center;
					margin-top: 3px;
				}
			}
		}
	}

	.loading {
		padding: 0px;
	}
</style>
