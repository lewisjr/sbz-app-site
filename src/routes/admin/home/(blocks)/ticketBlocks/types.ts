export interface HeatMapData {
	name: string;
	data: { x: string; y: number }[];
}

export interface RadarData {
	data: number[];
	labels: string[];
}
