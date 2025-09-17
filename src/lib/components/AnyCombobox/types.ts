export interface DataObj<T> {
	value: T;
	label: string;
}

export interface GroupedData<T> {
	title: string;
	group: DataObj<T>[];
}
