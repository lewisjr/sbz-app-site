<script lang="ts">
	import * as InputOTP from "../components/ui/input-otp/index.js";
	import { REGEXP_ONLY_DIGITS } from "bits-ui";

	let value = $state<string>("");

	interface Props {
		handler: (value: string) => void;
		disabled: boolean;
	}

	let { handler, disabled = $bindable() }: Props = $props();

	$effect(() => handler(value));

	let ariaInvalid = $derived.by<"true" | "false">(() => {
		if (value.length === 6 || !value.length) return "false";
		else return "true";
	});
</script>

<InputOTP.Root maxlength={6} pattern={REGEXP_ONLY_DIGITS} bind:value {disabled}>
	{#snippet children({ cells })}
		<InputOTP.Group>
			{#each cells.slice(0, 3) as cell}
				<InputOTP.Slot aria-invalid={ariaInvalid} {cell} />
			{/each}
		</InputOTP.Group>
		<InputOTP.Separator />
		<InputOTP.Group>
			{#each cells.slice(3, 6) as cell}
				<InputOTP.Slot aria-invalid={ariaInvalid} {cell} />
			{/each}
		</InputOTP.Group>
	{/snippet}
</InputOTP.Root>
