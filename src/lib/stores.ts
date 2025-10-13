import { writable } from "svelte/store";
import type { NFHelp } from "./types";

export const screenWidthStore = writable<number>(0);

interface NewsJsonCache {
	id: number;
	json: any;
}

export const newsJsonCacheStore = writable<NewsJsonCache[]>([]);

type MarketDataCache<DataType> = { [key: string]: DataType[] };

export const stocksCacheStore = writable<MarketDataCache<NFHelp["StockData"][]>>({});
export const fxCacheStore = writable<MarketDataCache<NFHelp["FxData"][]>>({});
export const econCacheStore = writable<MarketDataCache<NFHelp["EconData"][]>>({});
