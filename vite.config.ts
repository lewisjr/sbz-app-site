import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const DEV = env.DEV;

	return {
		plugins: [tailwindcss(), sveltekit()],
		server: DEV && DEV === "y" ? { allowedHosts: ["5cd2c159bc2a.ngrok-free.app"] } : undefined,
	};
});
