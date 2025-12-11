import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";
import { isoImport } from "vite-plugin-iso-import";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const DEV = env.DEV;

	return {
		plugins: [tailwindcss(), sveltekit(), isoImport()],
		server: DEV && DEV === "y" ? { allowedHosts: ["f7b142d561e0.ngrok-free.app"] } : undefined,
	};
});
