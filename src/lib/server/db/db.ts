import { createClient } from "@supabase/supabase-js";

import type { NFdb, SBZdb } from "$lib/types";

import { NF_URL, DB_URL, NF_SERVICE, DB_SERVICE } from "$env/static/private";

const sbzdb = createClient<SBZdb>(DB_URL, DB_SERVICE);
const nfdb = createClient<NFdb>(NF_URL, NF_SERVICE);

export { sbzdb, nfdb };
