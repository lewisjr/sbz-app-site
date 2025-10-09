import fs from "fs";
import path from "path";
import init, { settle_v1 } from "./sbz_wasm";

const wasmPath = path.resolve("src/lib/wasm/sbz_wasm_bg.wasm");

// console.log({ wasmPath });

const loadWasm = async () => {
	try {
		const wasmBytes = fs.readFileSync(wasmPath);
		await init(wasmBytes);
		return { settle_v1 };
	} catch (ex) {
		console.error("\n\n", ex, "\n\n");
		return false;
	}
};

export default loadWasm;
