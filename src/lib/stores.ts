import { writable } from "svelte/store";
import type { NFHelp, ExpandedSymbol } from "./types";

export const screenWidthStore = writable<number>(0);

interface NewsJsonCache {
	id: number;
	json: any;
}

export const newsJsonCacheStore = writable<NewsJsonCache[]>([]);

type DataCache<DataType> = { [key: string]: DataType };

export const stocksCacheStore = writable<DataCache<NFHelp["StockData"][]>>({});
export const fxCacheStore = writable<DataCache<NFHelp["FxData"][]>>({});
export const econCacheStore = writable<DataCache<NFHelp["EconData"][]>>({});

export const expandedStockCacheStore = writable<DataCache<ExpandedSymbol>>({});
