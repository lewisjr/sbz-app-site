export interface TicketsAnalysis {
	total: number;
	incomplete: number;
	incompletePercent: number;
	complete: number;
	completePercent: number;
	efficiency: "BAD" | "FAIR" | "GOOD" | "SUPERB";
	popular: string;
	platforms: {
		platform: string;
		volume: number;
	}[];
}

export interface SummaryData {
	/**Reach, Impressions, or Views  */
	udf1Label: "Reach" | "Impressions" | "Views" | "Plays";
	udf1Volume: number;
	udf1Delta: number;
	/**Likes or Reactions  */
	udf2Label: "Likes" | "Reactions";
	udf2Volume: number;
	udf2Delta: number;
	/**Comments Only  */
	commentsLabel: "Comments";
	commentsVolume: number;
	commentsDelta: number;
	/**Link Clicks or Reposts  */
	udf3Label: "Link Clicks" | "Reposts";
	udf3Volume: number;
	udf3Delta: number;
	/**Followers or Subscribers  */
	udf4Label: "Followers" | "Subscribers";
	udf4Volume: number;
	udf4Delta: number;
	/**Count Only  */
	countVolume: number;
	countDelta: number;
	date: string;
}

interface ResolutionTimeStats {
	/**Shortest resolution time */
	min: number;
	/**Longest resolution time */
	max: number;
	/**Average resolution time */
	average: number;
	/**median resolution time */
	median: number;
	/**90th percentile resolution time */
	p90: number;
	/**95th percentile resolution time */
	p95: number;
	q1: number;
	q3: number;
}

export interface ResolutionAnalytics {
	timeStats: ResolutionTimeStats;
	timeRanges: Record<string, number>;
	/**When most queries come in */
	peakHour: number;
	/**A list of resolvers in descending order */
	resolvers: { name: string; volume: number }[];
	/**A list of people who add the queries */
	responders: { name: string; volume: number }[];
	scatterData: [number, number][];
	hourCounts: number[];
}
