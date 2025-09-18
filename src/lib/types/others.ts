import { queryTypesArray, referralSourcesArray, platformsArray } from "$lib/utils";

type ReferralSource = (typeof referralSourcesArray)[number];

type QueryTypes = (typeof queryTypesArray)[number];

type Platforms = (typeof platformsArray)[number];

export interface Types {
	/**For tickets */
	ReferralSource: ReferralSource;
	QueryTypes: QueryTypes;
	Platforms: Platforms;
}
