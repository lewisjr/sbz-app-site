<script lang="ts">
	import { onMount } from "svelte";
	import lottie from "lottie-web";

	interface Props {
		animationData: any;
		loop?: boolean;
		autoplay?: boolean;
		/**in px*/
		height?: number;
		/**in vw*/
		explicitWidth?: number;
		/**Whether or not it should be bound to the right by 0px */
		bindRight?: boolean;
		/**Whether or not it should be bound to the right by 0px */
		bindLeft?: boolean;
	}

	let {
		animationData,
		loop = true,
		autoplay = true,
		height = undefined,
		explicitWidth = undefined,
		bindRight = false,
		bindLeft = false,
	}: Props = $props();

	let container = $state<any>();

	onMount(() => {
		const anim = lottie.loadAnimation({
			container,
			renderer: "svg",
			loop,
			autoplay,
			animationData,
		});

		return () => anim.destroy(); // Cleanup on unmount
	});
</script>

<div
	style={`width: ${explicitWidth ? `${explicitWidth}vw` : "100%"};${height ? `height: ${height}px` : ""}; position: relative;${bindRight ? `right: 0px;` : ""}${bindLeft ? `left: 0px;` : ""} padding: 0px;`}
	bind:this={container}
></div>
