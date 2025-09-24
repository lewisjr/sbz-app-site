import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const DEV = env.DEV;

	return {
		plugins: [tailwindcss(), sveltekit()],
		server: DEV && DEV === "y" ? { allowedHosts: ["f1fe725ea1f8.ngrok-free.app"] } : undefined,
	};
});
