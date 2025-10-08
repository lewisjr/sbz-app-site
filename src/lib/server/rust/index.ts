/// <reference path="./index.d.ts" />
import { createRequire } from "module";

const requir = createRequire(import.meta.url);
const rust = requir("./index.node");

/*
/// <reference types="$lib/server/rust/index" />
*/

export default rust;
