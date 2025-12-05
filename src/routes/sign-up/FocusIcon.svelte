<script lang="ts">
	interface Props {
		stroke?: number;
		size?: number;
	}

	let { size = 48, stroke = 2 }: Props = $props();
</script>

<svg
	data-v-f6279e27=""
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	class="lucide lucide-icon lucide-focus-icon lucide-focus lucide-icon"
	><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path
		d="M21 17v2a2 2 0 0 1-2 2h-2"
	></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg
>
