import fs from "fs";
import path from "path";
import init, { settle_v1, settle_v2 } from "./sbz_wasm";

const wasmPath = path.resolve("src/lib/wasm/sbz_wasm_bg.wasm");

// console.log({ wasmPath });

let initialized = false;

const loadWasm = async () => {
	try {
		if (!initialized) {
			const wasmBytes = fs.readFileSync(wasmPath);
			await init(wasmBytes);
			initialized = true;
		}

		return { settle_v1, settle_v2 };
	} catch (ex) {
		console.error("\n\nWASM init failed:", ex, "\n\n");
		return false;
	}
};

export default loadWasm;
