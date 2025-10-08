import { createRequire } from "module";

const requir = createRequire(import.meta.url);
const rustAddon = requir("./index.node");

export default rustAddon;
