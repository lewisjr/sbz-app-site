import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const DEV = env.DEV;

	return {
		plugins: [tailwindcss(), sveltekit()],
		server: DEV && DEV === "y" ? { allowedHosts: ["8590944f9d0d.ngrok-free.app"] } : undefined,
	};
});
