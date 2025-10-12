import { writable } from "svelte/store";

export const screenWidthStore = writable<number>(0);

interface NewsJsonCache {
	id: number;
	json: any;
}

export const newsJsonCacheStore = writable<NewsJsonCache[]>([]);
