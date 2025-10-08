import { createRequire } from "module";

const requir = createRequire(import.meta.url);
const rustAddon = requir("./index.node");

export default rustAddon;

/*
Copy the below to the RUST index.d.ts
/// <reference types="$lib/server/rust/index" />
*/
