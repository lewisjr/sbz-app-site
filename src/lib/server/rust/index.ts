import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

/// <reference path="./index.d.ts" />

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
const rust = require(join(__dirname, "index.node"));

export default rust;
