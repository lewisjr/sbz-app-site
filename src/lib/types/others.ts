import { queryTypesArray, referralSourcesArray, platformsArray } from "$lib/utils";

type ReferralSource = (typeof referralSourcesArray)[number];

type QueryTypes = (typeof queryTypesArray)[number];

type Platforms = (typeof platformsArray)[number];

type ActionConfig = "re-assign";

export interface Types {
	/**For tickets */
	ReferralSource: ReferralSource;
	QueryTypes: QueryTypes;
	Platforms: Platforms;
	/**Fot ticket actions */
	ActionConfig: ActionConfig;
}

/**Old slots */
export type SnippetType = () => any;
