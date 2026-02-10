<script lang="ts">
	//functions
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { toast } from "svelte-sonner";
	import { onMount, tick } from "svelte";
	import isEmail from "is-email";
	import { marked } from "marked";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyPicker from "$lib/components/AnyPicker.svelte";
	import OTP from "$lib/components/OTP.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";
	import FocusIcon from "../../sign-up/FocusIcon.svelte";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";

	//components - shadcn
	import Label from "$lib/components/ui/label/label.svelte";
	import Input from "$lib/components/ui/input/input.svelte";
	import DatePicker from "$lib/components/DatePicker.svelte";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import Textarea from "$lib/components/ui/textarea/textarea.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";

	//icons
	import {
		CirclePlus,
		SquarePlus,
		Trash2,
		Eye,
		Copy,
		Signature,
		Camera,
		Circle,
		RotateCcw,
	} from "@lucide/svelte";

	//constants
	import { nationalities, countries } from "../../sign-up/utils";
	import tc from "$lib/tc";

	//types
	import type { SBZdb, Types } from "$lib/types";
	import { genDbTimestamp } from "$lib/utils";

	let activeTab = $state<string>("individual");
	let isMobile = $derived<boolean>($screenWidthStore < 1025);
	let year = new Date().getFullYear();
	let loading = $state<boolean>(false);

	//udf inputs
	let luseId = $state<string>("");

	let fnameValue = $state<string>("");
	let lnameValue = $state<string>("");

	let dobValue = $state<string | undefined>("");
	const updateDob = (value: any) => (dobValue = value + "T08:00:00.000Z");

	// $effect(() => console.log({ dobValue }));

	let genderValue = $state<string>("");
	const updateGender = (value: string) => (genderValue = value);

	let maritalValue = $state<string>("");
	const updateMarital = (value: string) => (maritalValue = value);

	let nationalityValue = $state<string>("zambian");
	const updateNationality = (value: string) => (nationalityValue = value);

	let phoneValue = $state<string>("");
	let emailValue = $state<string>("");
	let streetValue = $state<string>("");
	let cityValue = $state<string>("");

	let countryValue = $state<string>("zambia");
	const updateCountry = (value: string) => (countryValue = value);

	let poaValue = $state<File | null>(null);
	const handlePoaUpload = (e: Event) => {
		const target = e.target as HTMLInputElement;

		if (target.files && target.files.length > 0) {
			poaValue = target.files[0];
		}
	};

	let idTypeValue = $state<string>("id-card");
	const updateIdType = (value: string) => (idTypeValue = value);

	let idNumValue = $state<string>("");
	let poiComment = $derived(countryValue === "zambia" ? "an NRC" : "a national identity");

	let poiValue = $state<File | null>(null);
	const handlePoiUpload = (e: Event) => {
		const target = e.target as HTMLInputElement;

		if (target.files && target.files.length > 0) {
			poiValue = target.files[0];
		}
	};

	let acoValue = $state<File | null>(null);
	const handleAcoUpload = (e: Event) => {
		const target = e.target as HTMLInputElement;

		if (target.files && target.files.length > 0) {
			acoValue = target.files[0];
		}
	};

	let bankNameValue = $state<string>("");
	let bankAccName = $state<string>("");
	let bankAccValue = $state<string>("");
	let branchNameValue = $state<string>("");
	let branchNumValue = $state<string>("");
	let swiftCodealue = $state<string>("");

	let blockReqAttemptIndividual = $derived<boolean>(
		!fnameValue.length ||
			!lnameValue.length ||
			!dobValue ||
			(dobValue && !dobValue.length) ||
			!genderValue.length ||
			!maritalValue.length ||
			!nationalityValue.length ||
			!phoneValue.length ||
			!isEmail(emailValue) ||
			!streetValue.length ||
			!cityValue.length ||
			!countryValue.length ||
			!poaValue ||
			!idTypeValue.length ||
			!idNumValue.length ||
			!poiValue ||
			!bankNameValue.length ||
			!bankAccName.length ||
			!bankAccValue.length ||
			!branchNameValue.length ||
			!branchNumValue.length ||
			!swiftCodealue.length,
	);

	let isInTrustOf = $state<string>("no");

	//udf manager inputs
	let fnameValueManager = $state<string>("");
	let lnameValueManager = $state<string>("");

	let dobValueManager: string | undefined = "";
	const updateDobManager = (value: any) => (dobValueManager = value + "T08:00:00.000Z");

	// $effect(() => console.log({ dobValueManager }));

	let genderValueManager = $state<string>("");
	const updateGenderManager = (value: string) => (genderValueManager = value);

	let maritalValueManager = $state<string>("");
	const updateMaritalManager = (value: string) => (maritalValueManager = value);

	let nationalityValueManager = $state<string>("zambian");
	const updateNationalityManager = (value: string) => (nationalityValueManager = value);

	let phoneValueManager = $state<string>("");
	let emailValueManager = $state<string>("");
	let streetValueManager = $state<string>("");
	let cityValueManager = $state<string>("");

	let countryValueManager = $state<string>("zambia");
	const updateCountryManager = (value: string) => (countryValueManager = value);

	let poaValueManager = $state<File | null>(null);
	const handlePoaUploadManager = (e: Event) => {
		const target = e.target as HTMLInputElement;

		if (target.files && target.files.length > 0) {
			poaValueManager = target.files[0];
		}
	};

	let idTypeValueManager = $state<string>("id-card");
	const updateIdTypeManager = (value: string) => (idTypeValueManager = value);

	let idNumValueManager = $state<string>("");

	let poiCommentManager = $derived(countryValue === "zambia" ? "an NRC" : "a national identity");

	let poiValueManager = $state<File | null>(null);
	const handlePoiUploadManager = (e: Event) => {
		const target = e.target as HTMLInputElement;

		if (target.files && target.files.length > 0) {
			poiValueManager = target.files[0];
		}
	};

	let blockReqAttemptWManager = $derived.by(() => {
		const isNonEmpty = (v: unknown) => (typeof v === "string" ? v.trim().length > 0 : !!v);

		const hasFile = (v: unknown) =>
			v instanceof File || (v && typeof (v as any).length === "number" && (v as any).length > 0);

		const checks = [
			!isNonEmpty(fnameValueManager),
			!isNonEmpty(lnameValueManager),
			// date input is a string; empty string means “not set”
			!(typeof dobValueManager === "string" && dobValueManager.length > 0),
			!isNonEmpty(genderValueManager),
			!isNonEmpty(maritalValueManager),
			!isNonEmpty(nationalityValueManager),
			!isNonEmpty(phoneValueManager),
			!isEmail(emailValueManager),
			!isNonEmpty(streetValueManager),
			!isNonEmpty(cityValueManager),
			!isNonEmpty(countryValueManager),
			!hasFile(poaValueManager),
			!isNonEmpty(idTypeValueManager),
			!isNonEmpty(idNumValueManager),
			!hasFile(poiValueManager),
		];

		// optional: log which check fired
		// console.log("checks", checks);

		return checks.some(Boolean);
	});

	//udf joint vars
	let jointSigningValue = $state<string>("");

	interface UserObj {
		//details
		fname: string;
		lname: string;
		phone: string;
		email: string;
		dob: string;
		gender: string;
		mstatus: string;
		nationality: string;
		//address
		street: string;
		city: string;
		country: string;
		//identity
		idType: string;
		idNum: string;
	}

	interface UserObjFull extends UserObj {
		poa: File;
		poi: File;
	}

	let jointUsers = $state<UserObjFull[]>([]);

	let blockReqAttemptJoint = $derived<boolean>(
		!jointSigningValue.length ||
			jointUsers.length < 2 ||
			!bankNameValue.length ||
			!bankAccName.length ||
			!bankAccValue.length ||
			!branchNameValue.length ||
			!branchNumValue.length ||
			!swiftCodealue.length,
	);

	let blockReqAttemptJointPartner = $derived<boolean>(
		!fnameValue.length ||
			!lnameValue.length ||
			!phoneValue.length ||
			!isEmail(emailValue) ||
			!dobValue ||
			(dobValue && !dobValue.length) ||
			!genderValue.length ||
			!maritalValue.length ||
			!nationalityValue.length ||
			!streetValue.length ||
			!cityValue.length ||
			!countryValue.length ||
			!poaValue ||
			!idTypeValue.length ||
			!idNumValue.length ||
			!poiValue,
	);

	//udf company inputs
	let fnameValueInstitute = $state<string>("");

	let phoneValueInstitute = $state<string>("");
	let emailValueInstitute = $state<string>("");
	let streetValueInstitute = $state<string>("");
	let cityValueInstitute = $state<string>("");

	let countryValueInstitute = $state<string>("zambia");
	const updateCountryInstitute = (value: string) => (countryValueInstitute = value);

	let poaValueInstitute = $state<File | null>(null);
	const handlePoaUploadInstitute = (e: Event) => {
		const target = e.target as HTMLInputElement;

		if (target.files && target.files.length > 0) {
			poaValueInstitute = target.files[0];
		}
	};

	let idTypeValueInstitute = $state<string>("id-card");
	const updateIdTypeInstitute = (value: string) => (idTypeValueInstitute = value);

	let idNumValueInstitute = $state<string>("");

	let poiValueInstitute = $state<File | null>(null);
	const handlePoiUploadInstitute = (e: Event) => {
		const target = e.target as HTMLInputElement;

		if (target.files && target.files.length > 0) {
			poiValueInstitute = target.files[0];
		}
	};

	let instituteSigningValue = $state<string>("");

	let directors = $state<UserObjFull[]>([]);
	let instituteManagers = $state<UserObjFull[]>([]);

	let blockReqAttemptDirector = $derived<boolean>(
		!fnameValue.length ||
			!lnameValue.length ||
			!phoneValue.length ||
			!isEmail(emailValue) ||
			!dobValue ||
			(dobValue && !dobValue.length) ||
			!genderValue.length ||
			!maritalValue.length ||
			!nationalityValue.length ||
			!streetValue.length ||
			!cityValue.length ||
			!countryValue.length ||
			!poaValue ||
			!idTypeValue.length ||
			!idNumValue.length ||
			!poiValue,
	);

	let blockReqAttemptInstitution = $derived.by(() => {
		const checks = [
			!instituteSigningValue.length,
			directors.length < 2,
			!instituteManagers.length,
			!fnameValueInstitute.length,
			!phoneValueInstitute.length,
			!emailValueInstitute.length,
			!streetValueInstitute.length,
			!cityValueInstitute.length,
			!countryValueInstitute.length,
			!poaValueInstitute,
			!idTypeValueInstitute.length,
			!idNumValueInstitute.length,
			!poiValueInstitute,
			!bankNameValue.length,
			!bankAccName.length,
			!bankAccValue.length,
			!branchNameValue.length,
			!branchNumValue.length,
			!swiftCodealue.length,
		];

		// optional: log which check fired
		// console.log("checks", checks);

		return checks.some(Boolean);
	});

	/**
	 * @param wBank is whether or not the function should clear the bank details. **DEFAULTS** to true
	 * @param clearJoint is whether or not the function should clear the `jointUsers` array. **DEFAULTS** to true
	 * @param clearInsitute is whether or not the function should clear the `directors` and `managers` array. **DEFAULTS** to true
	 */
	const reset = (
		wBank: boolean = true,
		clearJoint: boolean = true,
		clearInsitute: boolean = true,
	) => {
		fnameValue = "";
		lnameValue = "";
		genderValue = "male";
		maritalValue = "single";
		nationalityValue = "zambian";
		phoneValue = "";
		emailValue = "";
		dobValue = "";
		streetValue = "";
		cityValue = "";
		countryValue = "zambia";
		poaValue = null;
		idTypeValue = "id-card";
		idNumValue = "";
		poiValue = null;

		if (wBank) {
			bankNameValue = "";
			bankAccName = "";
			bankAccValue = "";
			branchNameValue = "";
			branchNumValue = "";
			swiftCodealue = "";
		}

		fnameValueManager = "";
		lnameValueManager = "";
		genderValueManager = "male";
		maritalValueManager = "single";
		nationalityValueManager = "zambian";
		phoneValueManager = "";
		emailValueManager = "";
		dobValueManager = "";
		streetValueManager = "";
		cityValueManager = "";
		countryValueManager = "zambia";
		poaValueManager = null;
		idTypeValueManager = "id-card";
		idNumValueManager = "";
		poiValueManager = null;

		if (clearJoint) {
			jointSigningValue = "";

			jointUsers = [];
		}

		if (clearInsitute) {
			fnameValueInstitute = "";

			phoneValueInstitute = "";
			emailValueInstitute = "";
			streetValueInstitute = "";
			cityValueInstitute = "";

			countryValueInstitute = "zambia";

			poaValueInstitute = null;

			idTypeValueInstitute = "coi";

			idNumValueInstitute = "";

			poiValueInstitute = null;

			instituteSigningValue = "";

			directors = [];
			instituteManagers = [];
		}
	};

	// reset fields if someone changes tab
	$effect(() => {
		if (activeTab) reset();
	});

	/**For joint accounts*/
	const addToJointList = async () => {
		if (poaValue && poiValue) {
			jointUsers = [
				...jointUsers,
				{
					fname: fnameValue,
					lname: lnameValue,
					phone: phoneValue,
					email: emailValue,
					dob: dobValue ?? "",
					gender: genderValue,
					mstatus: maritalValue,
					nationality: nationalityValue,
					street: streetValue,
					city: cityValue,
					country: countryValue,
					poa: poaValue, // ← no cloning needed
					idNum: idNumValue,
					idType: idTypeValue,
					poi: poiValue, // ← no cloning needed
				},
			];

			reset(false, false);
		}
	};

	/**For joint accounts*/
	const deleteJointPartner = (i: number) => {
		jointUsers.splice(i, 1);

		jointUsers = jointUsers;
	};

	/**For institute accounts*/
	const addToDirectorsList = async () => {
		if (poaValue && poiValue) {
			directors = [
				...directors,
				{
					fname: fnameValue,
					lname: lnameValue,
					phone: phoneValue,
					email: emailValue,
					dob: dobValue ?? "",
					gender: genderValue,
					mstatus: maritalValue,
					nationality: nationalityValue,
					street: streetValue,
					city: cityValue,
					country: countryValue,
					poa: poaValue, // ← no cloning needed
					idNum: idNumValue,
					idType: idTypeValue,
					poi: poiValue, // ← no cloning needed
				},
			];

			reset(false, true, false);
		}
	};

	/**For institute accounts*/
	const deleteDirector = (i: number) => {
		directors.splice(i, 1);

		directors = directors;
	};

	/**For institute accounts*/
	const addToManagersList = async () => {
		if (poaValueManager && poiValueManager) {
			instituteManagers = [
				...instituteManagers,
				{
					fname: fnameValue,
					lname: lnameValue,
					phone: phoneValue,
					email: emailValue,
					dob: dobValue ?? "",
					gender: genderValue,
					mstatus: maritalValue,
					nationality: nationalityValue,
					street: streetValue,
					city: cityValue,
					country: countryValue,
					poa: poiValueManager, // ← no cloning needed
					idNum: idNumValue,
					idType: idTypeValue,
					poi: poaValueManager, // ← no cloning needed
				},
			];

			reset(false, true, false);
		}
	};

	/**For institute accounts*/
	const deleteManager = (i: number) => {
		instituteManagers.splice(i, 1);
		instituteManagers = instituteManagers;
	};

	type ReferralSource =
		| "Web"
		| "Facebook"
		| "YouTube"
		| "LinkedIn"
		| "Spotify"
		| "LuSE"
		| "ZBT"
		| "Ventura"
		| "Radio Phoenix"
		| "Referral"
		| "News"
		| "Newspaper"
		| "Other";

	let sanitisedReferralValue = $state<ReferralSource | undefined>(undefined);
	const changeSanitisedReferral = (val: ReferralSource) => (sanitisedReferralValue = val);

	let otherReferralValue = $state<string>("");

	let disabled = $derived.by(() => {
		const noReferral = !sanitisedReferralValue
			? true
			: sanitisedReferralValue === "Other"
				? otherReferralValue.length < 3
					? true
					: false
				: false;

		if (noReferral) return true;

		if (activeTab === "individual") {
			if (isInTrustOf !== "no") return blockReqAttemptIndividual || blockReqAttemptWManager;
			else return blockReqAttemptIndividual;
		}

		if (activeTab === "joint") {
			return blockReqAttemptJoint || noReferral;
		}

		if (activeTab === "institution") {
			return blockReqAttemptInstitution || noReferral;
		}

		return true;
	});

	let otpLayout = $state<boolean>(false);

	let signatures = $state<Types["ClientSignature"] | undefined>(undefined);
	let qrUrl = $state<string | undefined>(undefined);
	let signatureValue = $state<string | undefined>(undefined);
	let backupCodes = $state<string[] | undefined>(undefined);

	const copyVal = (val: string): void => {
		if (navigator.clipboard && window.isSecureContext) {
			navigator.clipboard
				.writeText(val)
				.then(() => {
					toast.success("Copied!");
				})
				.catch((err) => {
					toast.error("Failed to copy!");
				});
		} else {
			const textarea = document.createElement("textarea");
			textarea.value = val;
			textarea.style.position = "fixed"; // avoid scrolling to bottom
			textarea.style.opacity = "0";

			document.body.appendChild(textarea);
			textarea.focus();
			textarea.select();

			try {
				document.execCommand("copy");
				toast.success("Copied!");
			} finally {
				document.body.removeChild(textarea);
			}
		}
	};

	const genSignature = async () => {
		let id: string = "";

		if (activeTab === "individual") {
			id = idNumValue;

			if (!idNumValue.length) {
				toast.error("You need to fill out your ID number first!");
				return;
			}
		}

		if (activeTab === "joint") {
			id = jointUsers[0].idNum;

			if (!jointUsers[0].idNum) {
				toast.error("You need to fill out your ID number first!");
				return;
			}
		}

		if (activeTab === "institution") {
			id = idNumValueInstitute;

			if (!idNumValueInstitute) {
				toast.error("You need to fill out your ID number first!");
				return;
			}
		}

		toast.info("Generating signature...");
		loading = true;

		try {
			const req = await fetch(`/api/sign/${id.trim()}`, {
				method: "POST",
			});

			const { data, message, success }: Types["GenQrReturn"] = await req.json();

			loading = false;

			if (!success) {
				toast.error(message);
				return;
			}

			toast.success(message);

			const backups: { [key: string]: string[] } = {};
			backups[data.key] = data.backups.encoded;

			signatures = { value: data.encoded, backups };
			qrUrl = data.qr;
			signatureValue = data.raw;
			backupCodes = data.backups.raw;
		} catch (ex: any) {
			console.error(ex);
			loading = false;
			toast.error(String(ex));
		}
	};

	let cvNum = $state<string>("")
	let brokerComission = $state<number>(0.01)

	let imgSrc = $state<string | undefined>(undefined);
	let imgBlob = $state<Blob | null>(null);

	let otpValue = $state<string>("");
	const otpValueHandler = (val: string) => {
		otpValue = val;
	};

	let totpValue = $state<string>("");
	const totpValueHandler = (val: string) => {
		totpValue = val;
	};

	let endLayout = $state<boolean>(false);
	let tcVal = $state<boolean>(false);

	const openAccount = async () => {
		const openAccount = async () => {
		toast.info("Onboarding...");
		loading = true;

		let signing_arrangement: number | undefined = undefined;

		switch (activeTab) {
			case "individual":
				signing_arrangement = 1;

				cityValueManager = cityValue.trim();
				countryValueManager = countryValue;
				emailValueManager = emailValue.trim();
				fnameValueManager = fnameValue.trim();
				genderValueManager = genderValue;
				idNumValueManager = idNumValue.trim();
				idTypeValueManager = idTypeValue;
				lnameValueManager = lnameValue.trim();
				maritalValueManager = maritalValue;
				nationalityValueManager = nationalityValue;
				phoneValueManager = phoneValue.trim();
				streetValueManager = streetValue.trim();

				break;
			case "joint":
				signing_arrangement = Number(jointSigningValue);
				break;
			case "institution":
				signing_arrangement = Number(instituteSigningValue);
				break;
			default:
				signing_arrangement = 1;
				break;
		}

		const form = new FormData();

		// append main files
		form.append(`${idNumValue}-poa`, poaValue ? poaValue : "");
		form.append(`${idNumValue}-poi`, poiValue ? poiValue : "");

		// append manager files
		form.append(`${idNumValueManager}-poa`, poaValueManager ? poaValueManager : "");
		form.append(`${idNumValueManager}-poi`, poiValueManager ? poiValueManager : "");

		// append partners files
		jointUsers.forEach((row) => {
			console.log({ location: "jointUsers", row });
			form.append(`${row.idNum}-poa`, row.poa);
			form.append(`${row.idNum}-poi`, row.poi);
		});

		// append comp directors files
		directors.forEach((row) => {
			form.append(`${row.idNum}-poa`, row.poa);
			form.append(`${row.idNum}-poi`, row.poi);
		});

		// append comp managers files
		instituteManagers.forEach((row) => {
			form.append(`${row.idNum}-poa`, row.poa);
			form.append(`${row.idNum}-poi`, row.poi);
		});

		// append otp
		form.append("otp", otpValue);
		form.append("totp", totpValue);

		// append emails
		const managerEmails: string[] = [];

		if (activeTab === "individual" && isInTrustOf === "no") {
			managerEmails.push(emailValue.trim());
		}

		if (isInTrustOf !== "no") {
			managerEmails.push(emailValueManager.trim());
		}

		let fname: string = fnameValue.trim();
		let street: string = streetValue.trim();
		let city: string = cityValue.trim();
		let country: string = countryValue;
		let email: string = emailValue.trim();
		let phone: number = Number(phoneValue.trim()) ?? 0;
		let id_num: string = idNumValue.trim();

		if (activeTab === "joint") {
			managerEmails.push(...jointUsers.map((user) => user.email.trim()));

			jointUsers.forEach((row, i) => {
				if (!i) {
					fname = `${row.fname} ${row.lname}`;
					street = row.street;
					city = row.city;
					country = row.country;
					email = row.email;
					phone = Number(row.phone) ?? 0;
					id_num = row.idNum;
				}

				if (i && i < jointUsers.length - 1) {
					fname = `${fname}, ${row.fname} ${row.lname}`;
				} else if (i === jointUsers.length - 1) {
					fname = `${fname}, and ${row.fname} ${row.lname}`;
				}
			});
		}

		if (activeTab === "institution") {
			managerEmails.push(...instituteManagers.map((user) => user.email.trim()));

			fname = fnameValueInstitute;
			email = emailValueInstitute;
			street = streetValueInstitute;
			city = cityValueInstitute;
			country = countryValueInstitute;
			id_num = idNumValueInstitute;
			phone = Number(phoneValueInstitute) ?? 0;
		}

		const referralSource = !sanitisedReferralValue
			? "e1"
			: sanitisedReferralValue === "Other"
				? otherReferralValue.length < 3
					? "e2"
					: otherReferralValue.trim()
				: sanitisedReferralValue;

		const obj: SBZdb["public"]["Tables"]["clients"]["Insert"] = {
			acc_type: activeTab,
			bank_acc_name: bankAccName.trim(),
			bank_acc_num: bankAccValue.trim(),
			bank_name: bankNameValue.trim(),
			branch_code: branchNumValue.trim(),
			branch_name: branchNameValue.trim(),
			city,
			country: toTitleCase(country),
			dob: dobValue && dobValue.length ? dobValue : "2099-12-03T19:06:00.000Z",
			email,
			fname,
			gender: toTitleCase(genderValue),
			id_num,
			id_type: toTitleCase(idTypeValue.replace("-", " ")).replace("Id", "ID"),
			lname: lnameValue.trim(),
			mstatus: toTitleCase(maritalValue),
			nationality: toTitleCase(nationalityValue),
			phone,
			signatures: signatures ? signatures : {},
			street,
			swift_code: swiftCodealue.trim(),
			// others
			manag_city: cityValueManager.trim(),
			manag_country: toTitleCase(countryValueManager),
			manag_dob:
				dobValueManager && dobValueManager.length
					? dobValueManager
					: dobValue && dobValue.length
						? dobValue
						: "2099-12-03T19:06:00.000Z",
			manag_email: emailValueManager.trim(),
			manag_fname: fnameValueManager.trim(),
			manag_gender: toTitleCase(genderValueManager),
			manag_id_num: idNumValueManager.trim(),
			manag_id_type: toTitleCase(idTypeValueManager.replace("-", " ")).replace("Id", "ID"),
			manag_lname: lnameValueManager.trim(),
			manag_mstatus: toTitleCase(maritalValueManager),
			manag_nationality: toTitleCase(nationalityValueManager),
			manag_phone: Number(phoneValueManager.trim()) ?? -1,
			manag_street: streetValueManager.trim(),
			// managers
			comp_directors: directors.map((row) => {
				const {
					city,
					country,
					dob,
					email,
					fname,
					gender,
					idNum,
					idType,
					lname,
					mstatus,
					nationality,
					phone,
					street,
				} = row;

				return {
					city: city.trim(),
					country: toTitleCase(country),
					dob,
					email: email.trim(),
					fname: fname.trim(),
					gender: toTitleCase(gender),
					idNum: idNum.trim(),
					idType: toTitleCase(idType.replace("-", " ")).replace("Id", "ID"),
					lname: lname.trim(),
					mstatus: toTitleCase(mstatus),
					nationality: toTitleCase(nationality),
					phone: phone.trim(),
					street: street.trim(),
				};
			}),
			comp_managers: instituteManagers.map((row) => {
				const {
					city,
					country,
					dob,
					email,
					fname,
					gender,
					idNum,
					idType,
					lname,
					mstatus,
					nationality,
					phone,
					street,
				} = row;

				return {
					city: city.trim(),
					country: toTitleCase(country),
					dob,
					email: email.trim(),
					fname: fname.trim(),
					gender: toTitleCase(gender),
					idNum: idNum.trim(),
					idType: toTitleCase(idType.replace("-", " ")).replace("Id", "ID"),
					lname: lname.trim(),
					mstatus: toTitleCase(mstatus),
					nationality: toTitleCase(nationality),
					phone: phone.trim(),
					street: street.trim(),
				};
			}),
			joint_partners: jointUsers.map((row) => {
				const {
					city,
					country,
					dob,
					email,
					fname,
					gender,
					idNum,
					idType,
					lname,
					mstatus,
					nationality,
					phone,
					street,
				} = row;

				return {
					city: city.trim(),
					country: toTitleCase(country),
					dob,
					email: email.trim(),
					fname: fname.trim(),
					gender: toTitleCase(gender),
					idNum: idNum.trim(),
					idType: toTitleCase(idType.replace("-", " ")).replace("Id", "ID"),
					lname: lname.trim(),
					mstatus: toTitleCase(mstatus),
					nationality: toTitleCase(nationality),
					phone: phone.trim(),
					street: street.trim(),
				};
			}),
			// can be undefined
			luseId: luseId.length ? Number(luseId) : undefined,
			is_in_trust_of: isInTrustOf === "yes" ? true : undefined,
			signing_arrangement,
			cv_num: cvNum,
			referral_src: referralSource,
			approve_date: genDbTimestamp(),
			approved_by: "sbz-historical",
			broker_comission: brokerComission,
			is_approved: true
		};

		// append obj
		form.append("obj", JSON.stringify(obj));

		// add emails
		form.append("emails", JSON.stringify(managerEmails));

		try {
			const req = await fetch("/api/su/onboard", {
				method: "POST",
				body: form,
			});

			const res: { success: boolean; message: string } = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			} else {
				toast.success(res.message);
				otpLayout = false;
				endLayout = true;

				signatures = undefined;
				qrUrl = undefined;
				signatureValue = undefined;
				backupCodes = undefined;
			}
		} catch (ex: any) {
			loading = false;

			toast.error(String(ex));
		}
	};

	let videoEl = $state<HTMLVideoElement | undefined>(undefined);
	let kycBegin = $state<boolean>(false);

	const capturePhoto = () => {
		const c = document.createElement("canvas");

		if (!videoEl) return;

		c.width = videoEl.videoWidth;
		c.height = videoEl.videoHeight;

		const ctx = c.getContext("2d");

		if (!ctx) return;

		// mirror horizontally
		ctx.scale(-1, 1);
		ctx.drawImage(videoEl, -c.width, 0, c.width, c.height);

		c.toBlob(
			(blob) => {
				if (blob) {
					imgBlob = blob;
					imgSrc = URL.createObjectURL(blob);
					// toast.info("took a pic!");
					c.remove();
				}
			},
			"image/png",
			0.9,
		);
	};

	const startCam = async () => {
		kycBegin = true;

		await tick();

		if (videoEl) {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "user" },
			});

			videoEl.srcObject = stream;
			videoEl.play();
		}
	};

	const retakePhoto = () => {
		imgBlob = null;
		imgSrc = undefined;
		startCam();
	};

	const getOtp = async () => {
		if (disabled) {
			toast.error("One or more of your inputs is incorrect!");
			return;
		}

		if (!acoValue) {
			toast.error("You must upload the account opening document as well!");
			return;
		}

		await openAccount();
		
	};
</script>

<Head
	title="Sign Up | SBZ Digital"
	ogTitle="Sign Up"
	description="Create or link your account and begin your digital investing journey!"
	ogDescription="Create or link your account and begin your digital investing journey!"
/>

<style lang="scss">
	.selfie-tainer {
		position: relative;
		width: 100%;
		height: fit-content;
	}

	.photo-id-taken {
		border-radius: var(--radius);
		box-shadow: 0px 0px 3px var(--shadow);
	}

	.focus-tainer {
		position: absolute;
		//border: 1px solid red;
		z-index: 1;
		color: #f7f7f7;
		top: 50%;
		left: 50%;
		transform: translateX(-50%) translateY(-50%);
		opacity: 0.7;
	}

	.selfie-cam {
		transform: scaleX(-1);
		border-radius: var(--radius);
		box-shadow: 0px 0px 3px var(--shadow);
		aspect-ratio: 0.78;
		width: fit-content;
		object-fit: cover;
	}

	.selfie-button {
		background-color: var(--secondary);
		margin: 0px auto;
		border-radius: 50%;
		height: 50px;
		width: 50px;
		box-shadow: 0px 0px 3px var(--shadow);
		display: flex;
		align-items: center;
		justify-content: center;

		&:active {
			transform: scale(0.9);
		}
	}

	.sig-img {
		margin: 0px auto;
		width: 100%;
		height: auto;
		border-radius: var(--radius);
		box-shadow: 0px 0px 3px var(--shadow);
	}

	.sig-check {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		background-color: var(--shadow);
		padding: 8px 0px;
		border-radius: var(--radius);
		margin-top: 10px;
		box-shadow: 0px 0px 3px var(--shadow);
	}

	.sig-backups {
		background-color: var(--shadow);
		padding: 8px 0px;
		border-radius: var(--radius);
		margin-top: 10px;
		box-shadow: 0px 0px 3px var(--shadow);

		td {
			text-align: center;
			padding: 8px 0px;
		}
	}

	.tc {
		// border: 1px solid lightblue;
		width: 100%;
		height: 70vh;
		overflow-y: auto;
	}

	.tmid {
		width: 97%;
		text-align: center;
		margin-left: auto;
		margin-right: auto;
	}

	.main-tainer {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: row;
		position: relative;
		align-items: flex-start;
		justify-content: flex-start;

		@media screen and (max-width: 1024px) {
			flex-direction: column;
			align-items: flex-start;
			justify-content: flex-start;
		}

		.img {
			width: 50%;
			background-color: var(--muted);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 0px 50px;

			height: 100%;

			img {
				width: 50%;
				height: auto;
			}

			h2 {
				margin-top: 30px;
			}

			@media screen and (max-width: 1024px) {
				width: 100%;
				height: fit-content;
				padding-bottom: 20px;

				img {
					width: 50%;
					height: auto;
					margin-top: 50px;
					margin-bottom: 20px;
				}

				h2 {
					margin-top: 10px;
				}
			}
		}
	}

	.tainer {
		width: 100%;
		height: 100%;
		overflow-y: scroll;
		display: flex;
		flex-direction: column;
		padding: 50px 15px 0px 15px;

		@media screen and (max-width: 1024px) {
			padding-top: 20px;

			height: fit-content;
			overflow-y: unset;
		}

		h3 {
			width: 97%;
			text-align: center;
			margin-left: auto;
			margin-right: auto;
		}

		.inputs {
			display: flex;
			flex-direction: column;
			width: fit-content;
			padding: 14px 23px;
			border: 1px solid var(--ring);
			border-radius: var(--radius);
			margin-left: auto;
			margin-right: auto;

			@media screen and (max-width: 1024px) {
				width: 100%;

				.tp {
					margin-top: 20px;
				}
			}

			.cntnt-l {
				margin-right: 30px;

				@media screen and (max-width: 1024px) {
					margin: 0px;
				}
			}

			.cntnt-r {
				margin-left: 30px;

				@media screen and (max-width: 1024px) {
					margin: 0px;
				}
			}

			.items {
				flex-direction: row;

				@media screen and (max-width: 1024px) {
					flex-direction: column;
				}
			}
		}
	}

	.footer {
		text-align: center;
		font-size: 9pt;
		opacity: 0.5;
		width: 100%;
	}
</style>
