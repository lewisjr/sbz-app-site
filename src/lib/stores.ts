import { writable } from "svelte/store";
import type { NFHelp, ExpandedSymbol, Types } from "./types";

export const screenWidthStore = writable<number>(0);

interface NewsJsonCache {
	id: number;
	json: any;
}

export const newsJsonCacheStore = writable<NewsJsonCache[]>([]);

type DataCache<T> = { [key: string]: T };

export const stocksCacheStore = writable<DataCache<NFHelp["StockData"][]>>({});
export const fxCacheStore = writable<DataCache<NFHelp["FxData"][]>>({});
export const econCacheStore = writable<DataCache<NFHelp["EconData"][]>>({});

export const expandedStockCacheStore = writable<DataCache<ExpandedSymbol>>({});

export const filesCacheStore = writable<DataCache<Types["ClientKyc"][]>>({});

export const portfolioCacheStore = writable<DataCache<Types["YTDFolio"]>>({});
