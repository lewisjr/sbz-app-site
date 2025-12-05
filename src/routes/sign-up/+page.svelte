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
	import FocusIcon from "./FocusIcon.svelte";
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
	import { nationalities, countries } from "./utils";
	import tc from "$lib/tc";

	//types
	import type { SBZdb, Types } from "$lib/types";

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
	const addToJointList = () => {
		const temp: UserObjFull[] = JSON.parse(JSON.stringify(jointUsers));
		const f = new File([], "");

		temp.push({
			fname: fnameValue,
			lname: lnameValue,
			phone: phoneValue,
			email: emailValue,
			dob: dobValue ? dobValue : "",
			gender: genderValue,
			mstatus: maritalValue,
			nationality: nationalityValue,
			street: streetValue,
			city: cityValue,
			country: countryValue,
			poa: poaValue ? poaValue : f,
			idNum: idNumValue,
			idType: idTypeValue,
			poi: poiValue ? poiValue : f,
		});

		jointUsers = temp;

		reset(false, false);
	};

	/**For joint accounts*/
	const deleteJointPartner = (i: number) => {
		const temp: UserObjFull[] = JSON.parse(JSON.stringify(jointUsers));

		temp.splice(i, 1);

		jointUsers = temp;
	};

	/**For institute accounts*/
	const addToDirectorsList = () => {
		const temp: UserObjFull[] = JSON.parse(JSON.stringify(directors));
		const f = new File([], "");

		temp.push({
			fname: fnameValue,
			lname: lnameValue,
			phone: phoneValue,
			email: emailValue,
			dob: dobValue ? dobValue : "",
			gender: genderValue,
			mstatus: maritalValue,
			nationality: nationalityValue,
			street: streetValue,
			city: cityValue,
			country: countryValue,
			poa: poaValue ? poaValue : f,
			idNum: idNumValue,
			idType: idTypeValue,
			poi: poiValue ? poiValue : f,
		});

		directors = temp;

		reset(false, true, false);
	};

	/**For institute accounts*/
	const deleteDirector = (i: number) => {
		const temp: UserObjFull[] = JSON.parse(JSON.stringify(directors));

		temp.splice(i, 1);

		directors = temp;
	};

	/**For institute accounts*/
	const addToManagersList = () => {
		const temp: UserObjFull[] = JSON.parse(JSON.stringify(instituteManagers));
		const f = new File([], "");

		temp.push({
			fname: fnameValueManager,
			lname: lnameValueManager,
			phone: phoneValueManager,
			email: emailValueManager,
			dob: dobValueManager ? dobValueManager : "",
			gender: genderValueManager,
			mstatus: maritalValueManager,
			nationality: nationalityValueManager,
			street: streetValueManager,
			city: cityValueManager,
			country: countryValueManager,
			poa: poaValueManager ? poaValueManager : f,
			idNum: idNumValueManager,
			idType: idTypeValueManager,
			poi: poiValueManager ? poiValueManager : f,
		});

		instituteManagers = temp;

		reset(false, true, false);
	};

	/**For institute accounts*/
	const deleteManager = (i: number) => {
		const temp: UserObjFull[] = JSON.parse(JSON.stringify(instituteManagers));

		temp.splice(i, 1);

		instituteManagers = temp;
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
		if (!idNumValue.length) {
			toast.error("You need to fill out your ID number first!");
			return;
		}

		toast.info("Generating signature...");
		loading = true;

		try {
			const req = await fetch(`/api/sign/${idNumValue.trim()}`, {
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

	let imgSrc = $state<string | undefined>(undefined);
	let imgBlob = $state<Blob | null>(null);

	const getOtp = async () => {
		if (disabled) {
			toast.error("One or more of your inputs is incorrect!");
			return;
		}

		const managerEmails: string[] = [];
		const managerPhones: string[] = [];

		if (activeTab === "individual" && isInTrustOf === "no") {
			managerEmails.push(emailValue.trim());
			managerPhones.push(phoneValue.trim());
		}

		if (isInTrustOf !== "no") {
			managerEmails.push(emailValueManager.trim());
			managerPhones.push(phoneValueManager.trim());
		}

		if (activeTab === "joint") {
			managerEmails.push(...jointUsers.map((user) => user.email.trim()));
			managerPhones.push(...jointUsers.map((user) => user.phone.trim()));
		}

		if (activeTab === "institution") {
			managerEmails.push(...instituteManagers.map((user) => user.email.trim()));
			managerPhones.push(...instituteManagers.map((user) => user.phone.trim()));
		}

		if (!tcVal) {
			toast.info(
				"You are required to read and accept the terms and conditions to create an account!",
			);
			loading = false;
			return;
		}

		if (!signatures) {
			toast.info("You are required to create a signature!");
			loading = false;
			return;
		}

		if (!imgBlob) {
			toast.info("You are required to create a signature!");
			loading = false;
			return;
		}

		loading = true;
		toast.info("Sending OTP...");

		try {
			const req = await fetch("/api/su", {
				method: "PUT",
				body: JSON.stringify({ emails: managerEmails, phones: managerPhones }),
			});

			const res: { success: boolean; message: string } = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);
			otpLayout = true;
		} catch (ex: any) {
			loading = false;
			const message =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex?.message || JSON.stringify(ex);

			toast.error(message);
		}
	};

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
		toast.info("Submitting...");
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
		form.append(`${idNumValue}-selfie`, imgBlob ? imgBlob : "");

		// append manager files
		form.append(`${idNumValueManager}-poa`, poaValueManager ? poaValueManager : "");
		form.append(`${idNumValueManager}-poi`, poiValueManager ? poiValueManager : "");

		// append partners files
		jointUsers.forEach((row) => {
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
			dob: dobValue ?? "2099-12-03T19:06:00.000Z",
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
					: (dobValue ?? "2099-12-03T19:06:00.000Z"),
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
			cv_num: "",
			referral_src: referralSource,
		};

		// append obj
		form.append("obj", JSON.stringify(obj));

		// add emails
		form.append("emails", JSON.stringify(managerEmails));

		try {
			const req = await fetch("/api/su", {
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
			const message =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex?.message || JSON.stringify(ex);

			toast.error(String(ex));
		}
	};

	$effect(() => {
		if (otpValue.length === 6 && totpValue.length === 6) {
			openAccount();
		}
	});

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
</script>

<Head
	title="Sign Up | SBZ Digital"
	ogTitle="Sign Up"
	description="Create or link your account and begin your digital investing journey!"
	ogDescription="Create or link your account and begin your digital investing journey!"
/>

<div class="main-tainer">
	<div class="img">
		<img src="/img/kyc.png" alt="infographic" />
		<h2>Sign Up</h2>
		<p class="text-center">Create your Stockbrokers account and get started in just 5 minutes!</p>
		<p class="mt-8 text-justify text-sm">
			Already have an account? <span class="font-bold italic"><a href="/sign-in">Sign In.</a></span>
		</p>
		<p class="mt-8 text-justify text-sm">
			Got Questions? <span class="font-bold italic"><a href="/contact">Contact Us.</a></span>
		</p>
	</div>

	<div class="tainer">
		{#if otpLayout}
			<h3 class="tmid mb-2">Enter Your OTP</h3>
			<p class="tmid mb-3">
				Please check your <b>email inbox or spam</b> for an email coming from <b>app@sbz.com.zm</b>.
			</p>
			<div class="mx-auto mt-3">
				<OTP handler={otpValueHandler} bind:disabled={loading} />
			</div>

			<h3 class="tmid mt-10 mb-2">Enter Your Signature</h3>
			<p class="tmid mb-3">
				Please check your <b>authenticator app</b> for your <b>six digit code</b>.
			</p>
			<div class="mx-auto mt-3">
				<OTP handler={totpValueHandler} bind:disabled={loading} />
			</div>
		{:else if endLayout}
			<h3 class="tmid mb-2">Request Submitted!</h3>
			<p class="tmid mb-3">
				Your submission is being processed, you will receive notification via email within 24 hours.
			</p>
		{:else}
			<h3 class="tmid mb-2">Account Type</h3>
			<p class="tmid mb-3">
				An <b>individual</b> account is for local and foreign individuals, as well as an
				<i>in trust of</i> account for minors under 16 years old.
			</p>
			<p class="tmid mb-3">
				A <b>joint</b> account is for local or foreign individuals who intend to co-own an account.
			</p>
			<p class="tmid mb-3">
				An <b>institution</b> account is for local or foreign companies and institutions who intend to
				invest under the company.
			</p>
			<p class="tmid mb-5"><u>Select an account type below:</u></p>

			<Tabs.Root bind:value={activeTab} class="mx-auto mb-5">
				<Tabs.List>
					<Tabs.Trigger class="cursor-pointer" value="individual">Individual</Tabs.Trigger>
					<Tabs.Trigger class="cursor-pointer" value="joint">Joint</Tabs.Trigger>
					<Tabs.Trigger class="cursor-pointer" value="institution">Institution</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>

			<h3 class="mb-4">Existing Portfolio</h3>
			<section class="inputs mb-5">
				<div class="items tp flex">
					<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
						<Label>LuSE ID</Label>
						<Input
							class="my-2"
							bind:value={luseId}
							placeholder="465345"
							disabled={loading}
							oninput={(e) => {
								//@ts-ignore
								luseId = e.target.value.replace(/[^0-9]/g, "");
							}}
							inputmode="numeric"
						/>
						<p class="text-justify text-sm text-muted-foreground">
							If you already have a LuSE ID, please enter it here. We will link the LuSE ID to
							Stockbrokers, however, we will not transfer the shares.
						</p>
						<p class="mt-2 text-justify text-sm text-muted-foreground">
							You can request a share transfer through your account dashboard.
						</p>
					</div>
				</div>
			</section>

			{#if activeTab === "individual"}
				<h3 class="mb-4">Account Owner Details</h3>
				<section class="inputs">
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>First Name</Label>
							<Input
								bind:value={fnameValue}
								placeholder="Bwalya"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									fnameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Your first name as it appears on your ID.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Last Name</Label>
							<Input
								bind:value={lnameValue}
								placeholder="Mutale"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									lnameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Your last name as it appears on your ID.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Phone</Label>
							<Input
								bind:value={phoneValue}
								placeholder="260776574628"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									phoneValue = e.target.value.replace(/[^0-9]/g, "");
								}}
								inputmode="tel"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Include the international code.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Email</Label>
							<Input
								bind:value={emailValue}
								placeholder="bmutale@gmail.com"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								inputmode="email"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								We'll use this to send notifications.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="flex w-[100%] flex-col gap-1.5">
							<Label class="mb-1">Date of Birth</Label>
							<DatePicker handler={updateDob} dropdown />
						</div>
					</div>

					<div class="items tp mt-7 flex justify-between">
						<div class="flex flex-col gap-1.5">
							<Label class="mb-1">Gender</Label>
							<AnyPicker
								data={[
									{ label: "Male", value: "male" },
									{ label: "Female", value: "female" },
								]}
								handler={updateGender}
								value={genderValue}
								pickerTitle="Gender"
							/>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Marital Status</Label>
							<AnyPicker
								data={[
									{ label: "Single", value: "single" },
									{ label: "Married", value: "married" },
									{ label: "Divorced", value: "divorced" },
									{ label: "Widowed", value: "widowed" },
								]}
								handler={updateMarital}
								value={maritalValue}
								pickerTitle="Marital Status"
							/>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Nationality</Label>
							<AnyPicker
								data={nationalities.map((n) => {
									return { label: n, value: n.toLowerCase() };
								})}
								handler={updateNationality}
								value={nationalityValue}
								pickerTitle="Nationality"
							/>
						</div>
					</div>
				</section>

				<h3 class="mt-10 mb-4">Account Owner Address</h3>
				<section class="inputs">
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Street</Label>
							<Textarea
								bind:value={streetValue}
								placeholder="36 Mwapona Road, Woodlands"
								disabled={loading}
								class="h-[100px]"
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Your street address as it appears on your proof of address.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex justify-between">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>City</Label>
							<Input
								bind:value={cityValue}
								placeholder="Lusaka"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									cityValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Your city of residence as it appears on your proof of address.
							</p>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Country</Label>
							<AnyPicker
								data={countries.map((c) => {
									return { label: c, value: c.toLowerCase() };
								})}
								handler={updateCountry}
								value={countryValue}
								pickerTitle="Country"
							/>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Proof of Address</Label>
							<Input type="file" onchange={handlePoaUpload} accept=".pdf" />
							<p class="mb-4 text-justify text-sm text-muted-foreground">
								Upload a tenancy agreement, tax certificate, utility bill, or bank statement from
								the past three months.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
								and that they cleary show your official names and address.
							</p>
						</div>
					</div>
				</section>

				<h3 class="mt-10 mb-4">Account Owner Identity</h3>
				<section class="inputs">
					<div class="items tp flex justify-between">
						<div class="cntnt-l flex flex-col gap-1.5">
							<Label class="mb-1">ID Type</Label>
							<AnyPicker
								data={[
									{ label: "ID Card", value: "id-card" },
									{ label: "Passport", value: "passport" },
									{ label: "Drivers License", value: "drivers-license" },
									{ label: "Voters Card", value: "voters-card" },
									{ label: "Birth Certificate", value: "birth-certificate" },
								]}
								handler={updateIdType}
								value={idTypeValue}
								pickerTitle="ID Type"
							/>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>ID Number</Label>
							<Input
								bind:value={idNumValue}
								placeholder="234976101"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									idNumValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Leave out any special characters.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Proof of Identity</Label>
							<Input type="file" onchange={handlePoiUpload} accept=".pdf" />
							<p class="mb-4 text-justify text-sm text-muted-foreground">
								Upload {poiComment}, passport, drivers license, voters card, or birth certificate.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
								and that they cleary show your official names and address.
							</p>
						</div>
					</div>
				</section>

				<h3 class="mt-10 mb-4">Account Owner Banking</h3>
				<section class="inputs">
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Bank Name</Label>
							<Input
								bind:value={bankNameValue}
								placeholder="Stanbic Bank"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									bankNameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The bank's full name.</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Account Name</Label>
							<Input
								bind:value={bankAccName}
								placeholder="Bwalya Mutale"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									bankAccName = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The account number/IBAN.</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Account Number</Label>
							<Input
								bind:value={bankAccValue}
								placeholder="10321256444"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The account number/IBAN.</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Branch Name</Label>
							<Input
								bind:value={branchNameValue}
								placeholder="Commercial"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									branchNameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The branch's official name.</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Branch Code</Label>
							<Input
								bind:value={branchNumValue}
								placeholder="260001"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The branch/sort code in full.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>SWIFT Code</Label>
							<Input
								bind:value={swiftCodealue}
								placeholder="SBCZMXXX"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									swiftCodealue = e.target.value.toUpperCase();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The branch's official name.</p>
						</div>
					</div>
				</section>

				<div class={"mx-auto mt-5 flex flex-col"}>
					<p>Is this an <b>In Trust Of</b> account?</p>
					<RadioGroup.Root class="mt-2" bind:value={isInTrustOf}>
						<div class="flex items-center space-x-2">
							<RadioGroup.Item value="yes" />
							<Label for="yes">Yes</Label>
						</div>
						<div class="flex items-center space-x-2">
							<RadioGroup.Item value="no" />
							<Label for="no">No</Label>
						</div>
					</RadioGroup.Root>
				</div>

				{#if isInTrustOf === "yes"}
					<h3 class="mt-8 mb-4">Account Manager Details</h3>
					<section class="inputs">
						<div class="items tp flex">
							<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
								<Label>First Name</Label>
								<Input
									bind:value={fnameValueManager}
									placeholder="Bwalya"
									disabled={loading}
									onkeypress={(e) => {
										if (e.key === "Enter") getOtp();
									}}
									oninput={(e) => {
										//@ts-ignore
										fnameValueManager = toTitleCase(e.target.value);
									}}
								/>
								<p class="text-justify text-sm text-muted-foreground">
									Your first name as it appears on your ID.
								</p>
							</div>

							<div class="tp flex w-full max-w-sm flex-col gap-1.5">
								<Label>Last Name</Label>
								<Input
									bind:value={lnameValueManager}
									placeholder="Mutale"
									disabled={loading}
									onkeypress={(e) => {
										if (e.key === "Enter") getOtp();
									}}
									oninput={(e) => {
										//@ts-ignore
										lnameValueManager = toTitleCase(e.target.value);
									}}
								/>
								<p class="text-justify text-sm text-muted-foreground">
									Your last name as it appears on your ID.
								</p>
							</div>
						</div>

						<div class="items tp mt-7 flex">
							<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
								<Label>Phone</Label>
								<Input
									bind:value={phoneValueManager}
									placeholder="260776574628"
									disabled={loading}
									onkeypress={(e) => {
										if (e.key === "Enter") getOtp();
									}}
									oninput={(e) => {
										//@ts-ignore
										phoneValueManager = e.target.value.replace(/[^0-9]/g, "");
									}}
									inputmode="tel"
								/>
								<p class="text-justify text-sm text-muted-foreground">
									Include the international code.
								</p>
							</div>

							<div class="tp flex w-full max-w-sm flex-col gap-1.5">
								<Label>Email</Label>
								<Input
									bind:value={emailValueManager}
									placeholder="bmutale@gmail.com"
									disabled={loading}
									onkeypress={(e) => {
										if (e.key === "Enter") getOtp();
									}}
									inputmode="email"
								/>
								<p class="text-justify text-sm text-muted-foreground">
									We'll use this to send notifications.
								</p>
							</div>
						</div>

						<div class="items tp mt-7 flex">
							<div class="flex w-[100%] flex-col gap-1.5">
								<Label class="mb-1">Date of Birth</Label>
								<DatePicker handler={updateDobManager} dropdown />
							</div>
						</div>

						<div class="items tp mt-7 flex justify-between">
							<div class="flex flex-col gap-1.5">
								<Label class="mb-1">Gender</Label>
								<AnyPicker
									data={[
										{ label: "Male", value: "male" },
										{ label: "Female", value: "female" },
									]}
									handler={updateGenderManager}
									value={genderValueManager}
									pickerTitle="Gender"
								/>
							</div>

							<div class="tp flex flex-col gap-1.5">
								<Label class="mb-1">Marital Status</Label>
								<AnyPicker
									data={[
										{ label: "Single", value: "single" },
										{ label: "Married", value: "married" },
										{ label: "Divorced", value: "divorced" },
										{ label: "Widowed", value: "widowed" },
									]}
									handler={updateMaritalManager}
									value={maritalValueManager}
									pickerTitle="Marital Status"
								/>
							</div>

							<div class="tp flex flex-col gap-1.5">
								<Label class="mb-1">Nationality</Label>
								<AnyPicker
									data={nationalities.map((n) => {
										return { label: n, value: n.toLowerCase() };
									})}
									handler={updateNationalityManager}
									value={nationalityValueManager}
									pickerTitle="Nationality"
								/>
							</div>
						</div>
					</section>

					<h3 class="mt-10 mb-4">Account Manager Address</h3>
					<section class="inputs">
						<div class="items tp flex">
							<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
								<Label class="mb-1">Street</Label>
								<Textarea
									bind:value={streetValueManager}
									placeholder="36 Mwapona Road, Woodlands"
									disabled={loading}
									class="h-[100px]"
									onkeypress={(e) => {
										if (e.key === "Enter") getOtp();
									}}
								/>
								<p class="text-justify text-sm text-muted-foreground">
									Your street address as it appears on your proof of address.
								</p>
							</div>
						</div>

						<div class="items tp mt-7 flex justify-between">
							<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
								<Label>City</Label>
								<Input
									bind:value={cityValueManager}
									placeholder="Lusaka"
									disabled={loading}
									onkeypress={(e) => {
										if (e.key === "Enter") getOtp();
									}}
									oninput={(e) => {
										//@ts-ignore
										cityValueManager = toTitleCase(e.target.value);
									}}
								/>
								<p class="text-justify text-sm text-muted-foreground">
									Your city of residence as it appears on your proof of address.
								</p>
							</div>

							<div class="tp flex flex-col gap-1.5">
								<Label class="mb-1">Country</Label>
								<AnyPicker
									data={countries.map((c) => {
										return { label: c, value: c.toLowerCase() };
									})}
									handler={updateCountryManager}
									value={countryValueManager}
									pickerTitle="Country"
								/>
							</div>
						</div>

						<div class="items tp mt-7 flex">
							<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
								<Label class="mb-1">Proof of Address</Label>
								<Input type="file" onchange={handlePoaUploadManager} accept=".pdf" />
								<p class="mb-4 text-justify text-sm text-muted-foreground">
									Upload a tenancy agreement, tax certificate, utility bill, or bank statement from
									the past three months.
								</p>
								<p class="text-justify text-sm text-muted-foreground">
									<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
									and that they cleary show your official names and address.
								</p>
							</div>
						</div>
					</section>

					<h3 class="mt-10 mb-4">Account Manager Identity</h3>
					<section class="inputs">
						<div class="items tp flex justify-between">
							<div class="cntnt-l flex flex-col gap-1.5">
								<Label class="mb-1">ID Type</Label>
								<AnyPicker
									data={[
										{ label: "ID Card", value: "id-card" },
										{ label: "Passport", value: "passport" },
										{ label: "Drivers License", value: "drivers-license" },
										{ label: "Voters Card", value: "voters-card" },
									]}
									handler={updateIdTypeManager}
									value={idTypeValueManager}
									pickerTitle="ID Type"
								/>
							</div>

							<div class="tp flex w-full max-w-sm flex-col gap-1.5">
								<Label>ID Number</Label>
								<Input
									bind:value={idNumValueManager}
									placeholder="234976101"
									disabled={loading}
									onkeypress={(e) => {
										if (e.key === "Enter") getOtp();
									}}
									oninput={(e) => {
										//@ts-ignore
										idNumValueManager = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
									}}
								/>
								<p class="text-justify text-sm text-muted-foreground">
									Leave out any special characters.
								</p>
							</div>
						</div>

						<div class="items tp mt-7 flex">
							<div class="flex w-full max-w-sm flex-col gap-1.5">
								<Label class="mb-1">Proof of Identity</Label>
								<Input type="file" onchange={handlePoiUploadManager} accept=".pdf" />
								<p class="mb-4 text-justify text-sm text-muted-foreground">
									Upload {poiCommentManager}, passport, drivers license, or voters card.
								</p>
								<p class="text-justify text-sm text-muted-foreground">
									<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
									and that they cleary show your official names and address.
								</p>
							</div>
						</div>
					</section>
				{/if}
			{/if}

			{#if activeTab === "joint"}
				<h3 class="mb-4">Partner Details</h3>
				<section class="inputs">
					<h4 class={!isMobile ? "mb-4" : undefined}>General Details</h4>
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>First Name</Label>
							<Input
								bind:value={fnameValue}
								placeholder="Bwalya"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									fnameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The first name as it appears on the ID.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Last Name</Label>
							<Input
								bind:value={lnameValue}
								placeholder="Mutale"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									lnameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The last name as it appears on the ID.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Phone</Label>
							<Input
								bind:value={phoneValue}
								placeholder="260776574628"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									phoneValue = e.target.value.replace(/[^0-9]/g, "");
								}}
								inputmode="tel"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Include the international code.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Email</Label>
							<Input
								bind:value={emailValue}
								placeholder="bmutale@gmail.com"
								disabled={loading}
								inputmode="email"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								We'll use this to send notifications.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="flex w-[100%] flex-col gap-1.5">
							<Label class="mb-1">Date of Birth</Label>
							<DatePicker handler={updateDob} dropdown />
						</div>
					</div>

					<div class="items tp mt-7 flex justify-between">
						<div class="flex flex-col gap-1.5">
							<Label class="mb-1">Gender</Label>
							<AnyPicker
								data={[
									{ label: "Male", value: "male" },
									{ label: "Female", value: "female" },
								]}
								handler={updateGender}
								value={genderValue}
								pickerTitle="Gender"
							/>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Marital Status</Label>
							<AnyPicker
								data={[
									{ label: "Single", value: "single" },
									{ label: "Married", value: "married" },
									{ label: "Divorced", value: "divorced" },
									{ label: "Widowed", value: "widowed" },
								]}
								handler={updateMarital}
								value={maritalValue}
								pickerTitle="Marital Status"
							/>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Nationality</Label>
							<AnyPicker
								data={nationalities.map((n) => {
									return { label: n, value: n.toLowerCase() };
								})}
								handler={updateNationality}
								value={nationalityValue}
								pickerTitle="Nationality"
							/>
						</div>
					</div>

					<h4 class={`mt-6 ${!isMobile ? " mb-4" : ""}`}>Address Details</h4>
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Street</Label>
							<Textarea
								bind:value={streetValue}
								placeholder="36 Mwapona Road, Woodlands"
								disabled={loading}
								class="h-[100px]"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The street address as it appears on the proof of address.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex justify-between">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>City</Label>
							<Input
								bind:value={cityValue}
								placeholder="Lusaka"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									cityValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The city of residence as it appears on the proof of address.
							</p>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Country</Label>
							<AnyPicker
								data={countries.map((c) => {
									return { label: c, value: c.toLowerCase() };
								})}
								handler={updateCountry}
								value={countryValue}
								pickerTitle="Country"
							/>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Proof of Address</Label>
							<Input type="file" onchange={handlePoaUpload} accept=".pdf" />
							<p class="mb-4 text-justify text-sm text-muted-foreground">
								Upload a tenancy agreement, tax certificate, utility bill, or bank statement from
								the past three months.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
								and that they cleary show the official names and address.
							</p>
						</div>
					</div>

					<h4 class={`mt-6 ${!isMobile ? " mb-4" : ""}`}>Identity Details</h4>
					<div class="items tp flex justify-between">
						<div class="cntnt-l flex flex-col gap-1.5">
							<Label class="mb-1">ID Type</Label>
							<AnyPicker
								data={[
									{ label: "ID Card", value: "id-card" },
									{ label: "Passport", value: "passport" },
									{ label: "Drivers License", value: "drivers-license" },
									{ label: "Voters Card", value: "voters-card" },
									{ label: "Birth Certificate", value: "birth-certificate" },
								]}
								handler={updateIdType}
								value={idTypeValue}
								pickerTitle="ID Type"
							/>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>ID Number</Label>
							<Input
								bind:value={idNumValue}
								placeholder="234976101"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									idNumValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Leave out any special characters.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Proof of Identity</Label>
							<Input type="file" onchange={handlePoiUpload} accept=".pdf" />
							<p class="mb-4 text-justify text-sm text-muted-foreground">
								Upload {poiComment}, passport, drivers license, voters card, or birth certificate.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
								and that they cleary show the official names and address.
							</p>
						</div>
					</div>

					<Button
						class="mt-5 cursor-pointer"
						disabled={blockReqAttemptJointPartner}
						onclick={() => addToJointList()}>Add to List<SquarePlus class="ml-2 h-4 w-4" /></Button
					>
				</section>

				<h3 class="mt-10 mb-4">Added Partners</h3>
				<section class="inputs">
					{#if jointUsers.length}
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Names</Table.Head>
									<Table.Head>...</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each jointUsers as partner, index}
									<Table.Row>
										<Table.Cell>{partner.fname} {partner.lname}</Table.Cell>
										<Table.Cell
											><Button onclick={() => deleteJointPartner(index)}><Trash2 /></Button
											></Table.Cell
										>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{:else}
						<p class="tmid">No partners added. Fill in the form above to being adding partners.</p>
					{/if}
				</section>

				<h3 class="mt-10 mb-4">Signing Arrangement</h3>
				<section class="inputs">
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Signers</Label>
							<Input
								bind:value={jointSigningValue}
								placeholder="2"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									jointSigningValue = e.target.value.replace(/[^0-9]/g, "");
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								This is how many people need to sign regarding trading instructions and other
								actions related to the account.
							</p>
						</div>
					</div>
				</section>

				<h3 class="mt-10 mb-4">Account Banking</h3>
				<section class="inputs">
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Bank Name</Label>
							<Input
								bind:value={bankNameValue}
								placeholder="Stanbic Bank"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									bankNameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The bank's full name.</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Account Name</Label>
							<Input
								bind:value={bankAccName}
								placeholder="Bwalya Mutale"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									bankAccName = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The account number/IBAN.</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Account Number</Label>
							<Input
								bind:value={bankAccValue}
								placeholder="10321256444"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The account number/IBAN.</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Branch Name</Label>
							<Input
								bind:value={branchNameValue}
								placeholder="Commercial"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									branchNameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The branch's official name.</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Branch Code</Label>
							<Input
								bind:value={branchNumValue}
								placeholder="260001"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The branch/sort code in full.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>SWIFT Code</Label>
							<Input
								bind:value={swiftCodealue}
								placeholder="SBCZMXXX"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									swiftCodealue = e.target.value.toUpperCase();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The branch's official name.</p>
						</div>
					</div>
				</section>
			{/if}

			{#if activeTab === "institution"}
				<h3 class="mt-8 mb-4">Company Details</h3>
				<section class="inputs">
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Name</Label>
							<Input
								bind:value={fnameValueInstitute}
								placeholder="Stockbrokers Zambia Limited"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									fnameValueInstitute = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The company name as it appears on the certificate of incorporation.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Phone</Label>
							<Input
								bind:value={phoneValueInstitute}
								placeholder="260776574628"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									phoneValueInstitute = e.target.value.replace(/[^0-9]/g, "");
								}}
								inputmode="tel"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Include the international code.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Email</Label>
							<Input
								bind:value={emailValueInstitute}
								placeholder="bmutale@gmail.com"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								inputmode="email"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								We'll use this to send notifications.
							</p>
						</div>
					</div>
				</section>

				<h3 class="mt-10 mb-4">Company Address</h3>
				<section class="inputs">
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Street</Label>
							<Textarea
								bind:value={streetValueInstitute}
								placeholder="36 Mwapona Road, Woodlands"
								disabled={loading}
								class="h-[100px]"
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The street address as it appears on the proof of address.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex justify-between">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>City</Label>
							<Input
								bind:value={cityValueInstitute}
								placeholder="Lusaka"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									cityValueInstitute = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The city of residence as it appears on the proof of address.
							</p>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Country</Label>
							<AnyPicker
								data={countries.map((c) => {
									return { label: c, value: c.toLowerCase() };
								})}
								handler={updateCountryInstitute}
								value={countryValueInstitute}
								pickerTitle="Country"
							/>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Proof of Address</Label>
							<Input type="file" onchange={handlePoaUploadInstitute} accept=".pdf" />
							<p class="mb-4 text-justify text-sm text-muted-foreground">
								Upload a tenancy agreement, tax certificate, utility bill, or bank statement from
								the past three months.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
								and that they cleary show the official names and address.
							</p>
						</div>
					</div>
				</section>

				<h3 class="mt-10 mb-4">Company Identity</h3>
				<section class="inputs">
					<div class="items tp flex justify-between">
						<div class="cntnt-l flex flex-col gap-1.5">
							<Label class="mb-1">ID Type</Label>
							<AnyPicker
								data={[{ label: "Cert. of Incorp.", value: "coi" }]}
								handler={updateIdTypeInstitute}
								value={idTypeValueInstitute}
								pickerTitle="ID Type"
							/>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>ID Number</Label>
							<Input
								bind:value={idNumValueInstitute}
								placeholder="234976101"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Leave out any special characters.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Proof of Identity</Label>
							<Input type="file" onchange={handlePoiUploadInstitute} accept=".pdf" />
							<p class="mb-4 text-justify text-sm text-muted-foreground">
								Upload certificate of incorporation.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								<b>Ensure</b> it is are certified by the police, court, church, or commisioner of oaths,
								and that it cleary shows the official names and address.
							</p>
						</div>
					</div>
				</section>

				<!-- Directors -->
				<h3 class="mt-10 mb-4">Director Details</h3>
				<section class="inputs">
					<h4 class={!isMobile ? "mb-4" : undefined}>General Details</h4>
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>First Name</Label>
							<Input
								bind:value={fnameValue}
								placeholder="Bwalya"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									fnameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The first name as it appears on the ID.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Last Name</Label>
							<Input
								bind:value={lnameValue}
								placeholder="Mutale"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									lnameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The last name as it appears on the ID.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Phone</Label>
							<Input
								bind:value={phoneValue}
								placeholder="260776574628"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									phoneValue = e.target.value.replace(/[^0-9]/g, "");
								}}
								inputmode="tel"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Include the international code.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Email</Label>
							<Input
								bind:value={emailValue}
								placeholder="bmutale@gmail.com"
								disabled={loading}
								inputmode="email"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								We'll use this to send notifications.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="flex w-[100%] flex-col gap-1.5">
							<Label class="mb-1">Date of Birth</Label>
							<DatePicker handler={updateDob} dropdown />
						</div>
					</div>

					<div class="items tp mt-7 flex justify-between">
						<div class="flex flex-col gap-1.5">
							<Label class="mb-1">Gender</Label>
							<AnyPicker
								data={[
									{ label: "Male", value: "male" },
									{ label: "Female", value: "female" },
								]}
								handler={updateGender}
								value={genderValue}
								pickerTitle="Gender"
							/>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Marital Status</Label>
							<AnyPicker
								data={[
									{ label: "Single", value: "single" },
									{ label: "Married", value: "married" },
									{ label: "Divorced", value: "divorced" },
									{ label: "Widowed", value: "widowed" },
								]}
								handler={updateMarital}
								value={maritalValue}
								pickerTitle="Marital Status"
							/>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Nationality</Label>
							<AnyPicker
								data={nationalities.map((n) => {
									return { label: n, value: n.toLowerCase() };
								})}
								handler={updateNationality}
								value={nationalityValue}
								pickerTitle="Nationality"
							/>
						</div>
					</div>

					<h4 class={`mt-6 ${!isMobile ? " mb-4" : ""}`}>Address Details</h4>
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Street</Label>
							<Textarea
								bind:value={streetValue}
								placeholder="36 Mwapona Road, Woodlands"
								disabled={loading}
								class="h-[100px]"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The street address as it appears on the proof of address.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex justify-between">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>City</Label>
							<Input
								bind:value={cityValue}
								placeholder="Lusaka"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									cityValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The city of residence as it appears on the proof of address.
							</p>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Country</Label>
							<AnyPicker
								data={countries.map((c) => {
									return { label: c, value: c.toLowerCase() };
								})}
								handler={updateCountry}
								value={countryValue}
								pickerTitle="Country"
							/>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Proof of Address</Label>
							<Input type="file" onchange={handlePoaUpload} accept=".pdf" />
							<p class="mb-4 text-justify text-sm text-muted-foreground">
								Upload a tenancy agreement, tax certificate, utility bill, or bank statement from
								the past three months.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
								and that they cleary show the official names and address.
							</p>
						</div>
					</div>

					<h4 class={`mt-6 ${!isMobile ? " mb-4" : ""}`}>Identity Details</h4>
					<div class="items tp flex justify-between">
						<div class="cntnt-l flex flex-col gap-1.5">
							<Label class="mb-1">ID Type</Label>
							<AnyPicker
								data={[
									{ label: "ID Card", value: "id-card" },
									{ label: "Passport", value: "passport" },
									{ label: "Drivers License", value: "drivers-license" },
									{ label: "Voters Card", value: "voters-card" },
								]}
								handler={updateIdType}
								value={idTypeValue}
								pickerTitle="ID Type"
							/>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>ID Number</Label>
							<Input
								bind:value={idNumValue}
								placeholder="234976101"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									idNumValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Leave out any special characters.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Proof of Identity</Label>
							<Input type="file" onchange={handlePoiUpload} accept=".pdf" />
							<p class="mb-4 text-justify text-sm text-muted-foreground">
								Upload {poiComment}, passport, drivers license, voters card.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
								and that they cleary show the official names and address.
							</p>
						</div>
					</div>

					<Button
						class="mt-5 cursor-pointer"
						disabled={blockReqAttemptDirector}
						onclick={() => addToDirectorsList()}
						>Add to List<SquarePlus class="ml-2 h-4 w-4" /></Button
					>
				</section>

				<h3 class="mt-10 mb-4">Added Directors</h3>
				<section class="inputs">
					{#if directors.length}
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Names</Table.Head>
									<Table.Head>...</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each directors as director, index}
									<Table.Row>
										<Table.Cell>{director.fname} {director.lname}</Table.Cell>
										<Table.Cell
											><Button onclick={() => deleteDirector(index)}><Trash2 /></Button></Table.Cell
										>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{:else}
						<p class="tmid">
							No directors added. Fill in the form above to being adding directors.
						</p>
					{/if}
				</section>

				<!-- Managers -->
				<h3 class="mt-10 mb-4">Manager Details</h3>
				<section class="inputs">
					<h4 class={!isMobile ? "mb-4" : undefined}>General Details</h4>
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>First Name</Label>
							<Input
								bind:value={fnameValueManager}
								placeholder="Bwalya"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									fnameValueManager = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The first name as it appears on the ID.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Last Name</Label>
							<Input
								bind:value={lnameValueManager}
								placeholder="Mutale"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									lnameValueManager = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The last name as it appears on the ID.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Phone</Label>
							<Input
								bind:value={phoneValueManager}
								placeholder="260776574628"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									phoneValueManager = e.target.value.replace(/[^0-9]/g, "");
								}}
								inputmode="tel"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Include the international code.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Email</Label>
							<Input
								bind:value={emailValueManager}
								placeholder="bmutale@gmail.com"
								disabled={loading}
								inputmode="email"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								We'll use this to send notifications.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="flex w-[100%] flex-col gap-1.5">
							<Label class="mb-1">Date of Birth</Label>
							<DatePicker handler={updateDobManager} dropdown />
						</div>
					</div>

					<div class="items tp mt-7 flex justify-between">
						<div class="flex flex-col gap-1.5">
							<Label class="mb-1">Gender</Label>
							<AnyPicker
								data={[
									{ label: "Male", value: "male" },
									{ label: "Female", value: "female" },
								]}
								handler={updateGenderManager}
								value={genderValueManager}
								pickerTitle="Gender"
							/>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Marital Status</Label>
							<AnyPicker
								data={[
									{ label: "Single", value: "single" },
									{ label: "Married", value: "married" },
									{ label: "Divorced", value: "divorced" },
									{ label: "Widowed", value: "widowed" },
								]}
								handler={updateMaritalManager}
								value={maritalValueManager}
								pickerTitle="Marital Status"
							/>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Nationality</Label>
							<AnyPicker
								data={nationalities.map((n) => {
									return { label: n, value: n.toLowerCase() };
								})}
								handler={updateNationalityManager}
								value={nationalityValueManager}
								pickerTitle="Nationality"
							/>
						</div>
					</div>

					<h4 class={`mt-6 ${!isMobile ? " mb-4" : ""}`}>Address Details</h4>
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Street</Label>
							<Textarea
								bind:value={streetValueManager}
								placeholder="36 Mwapona Road, Woodlands"
								disabled={loading}
								class="h-[100px]"
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The street address as it appears on the proof of address.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex justify-between">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>City</Label>
							<Input
								bind:value={cityValueManager}
								placeholder="Lusaka"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									cityValueManager = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The city of residence as it appears on the proof of address.
							</p>
						</div>

						<div class="tp flex flex-col gap-1.5">
							<Label class="mb-1">Country</Label>
							<AnyPicker
								data={countries.map((c) => {
									return { label: c, value: c.toLowerCase() };
								})}
								handler={updateCountryManager}
								value={countryValueManager}
								pickerTitle="Country"
							/>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Proof of Address</Label>
							<Input type="file" onchange={handlePoaUploadManager} accept=".pdf" />
							<p class="mb-4 text-justify text-sm text-muted-foreground">
								Upload a tenancy agreement, tax certificate, utility bill, or bank statement from
								the past three months.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
								and that they cleary show the official names and address.
							</p>
						</div>
					</div>

					<h4 class={`mt-6 ${!isMobile ? " mb-4" : ""}`}>Identity Details</h4>
					<div class="items tp flex justify-between">
						<div class="cntnt-l flex flex-col gap-1.5">
							<Label class="mb-1">ID Type</Label>
							<AnyPicker
								data={[
									{ label: "ID Card", value: "id-card" },
									{ label: "Passport", value: "passport" },
									{ label: "Drivers License", value: "drivers-license" },
									{ label: "Voters Card", value: "voters-card" },
								]}
								handler={updateIdTypeManager}
								value={idTypeValueManager}
								pickerTitle="ID Type"
							/>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>ID Number</Label>
							<Input
								bind:value={idNumValueManager}
								placeholder="234976101"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									idNumValueManager = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								Leave out any special characters.
							</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Proof of Identity</Label>
							<Input type="file" onchange={handlePoiUploadManager} accept=".pdf" />
							<p class="mb-4 text-justify text-sm text-muted-foreground">
								Upload {poiComment}, passport, drivers license, voters card.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								<b>Ensure</b> they are certified by the police, court, church, or commisioner of oaths,
								and that they cleary show the official names and address.
							</p>
						</div>
					</div>

					<Button
						class="mt-5 cursor-pointer"
						disabled={blockReqAttemptWManager}
						onclick={() => addToManagersList()}
						>Add to List<SquarePlus class="ml-2 h-4 w-4" /></Button
					>
				</section>

				<h3 class="mt-10 mb-4">Added Managers</h3>
				<section class="inputs">
					{#if instituteManagers.length}
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Names</Table.Head>
									<Table.Head>...</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each instituteManagers as manager, index}
									<Table.Row>
										<Table.Cell>{manager.fname} {manager.lname}</Table.Cell>
										<Table.Cell
											><Button onclick={() => deleteManager(index)}><Trash2 /></Button></Table.Cell
										>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{:else}
						<p class="tmid">No managers added. Fill in the form above to being adding managers.</p>
					{/if}
				</section>

				<h3 class="mt-10 mb-4">Signing Arrangement</h3>
				<section class="inputs">
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Signers</Label>
							<Input
								bind:value={instituteSigningValue}
								placeholder="2"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									instituteSigningValue = e.target.value.replace(/[^0-9]/g, "");
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								This is how many people need to sign regarding trading instructions and other
								actions related to the account.
							</p>
						</div>
					</div>
				</section>

				<h3 class="mt-10 mb-4">Account Banking</h3>
				<section class="inputs">
					<div class="items tp flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Bank Name</Label>
							<Input
								bind:value={bankNameValue}
								placeholder="Stanbic Bank"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									bankNameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The bank's full name.</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Account Name</Label>
							<Input
								bind:value={bankAccName}
								placeholder="Bwalya Mutale"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									bankAccName = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The account number/IBAN.</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Account Number</Label>
							<Input
								bind:value={bankAccValue}
								placeholder="10321256444"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The account number/IBAN.</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>Branch Name</Label>
							<Input
								bind:value={branchNameValue}
								placeholder="Commercial"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									branchNameValue = toTitleCase(e.target.value);
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The branch's official name.</p>
						</div>
					</div>

					<div class="items tp mt-7 flex">
						<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
							<Label>Branch Code</Label>
							<Input
								bind:value={branchNumValue}
								placeholder="260001"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">
								The branch/sort code in full.
							</p>
						</div>

						<div class="tp flex w-full max-w-sm flex-col gap-1.5">
							<Label>SWIFT Code</Label>
							<Input
								bind:value={swiftCodealue}
								placeholder="SBCZMXXX"
								disabled={loading}
								onkeypress={(e) => {
									if (e.key === "Enter") getOtp();
								}}
								oninput={(e) => {
									//@ts-ignore
									swiftCodealue = e.target.value.toUpperCase();
								}}
							/>
							<p class="text-justify text-sm text-muted-foreground">The branch's official name.</p>
						</div>
					</div>
				</section>
			{/if}

			<h3 class="mt-7 mb-4">Photo ID</h3>
			<section class="inputs mb-5">
				<div class="items tp flex">
					<div class="cntnt flex w-full max-w-sm flex-col gap-1.5">
						{#if !kycBegin && !imgSrc}
							<Label>Why We Need This</Label>
							<p class="text-justify text-sm text-muted-foreground">
								To both verify and protect your identity, we require you to upload a live selfie of
								yourself to be processed.
							</p>
							<Button variant="outline" onclick={startCam}
								>Open Camera<Camera class="ml-2 h-4 w-4" /></Button
							>
						{/if}

						{#if kycBegin && !imgSrc}
							<Label>What To Do</Label>
							<p class="text-justify text-sm text-muted-foreground">
								1. Ensure that the camera is clean with no glare.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								2. Ensure that you have no glasses on.
							</p>
							<p class="text-justify text-sm text-muted-foreground">
								3. Make sure to take the photo on a plain background.
							</p>
							<p class="text-justify text-sm text-muted-foreground">4. Keep a straight face.</p>
							<p class="text-justify text-sm text-muted-foreground">
								5. Take the photo when your face is in the white box.
							</p>

							<div class="selfie-tainer">
								<video bind:this={videoEl} class="selfie-cam mt-4" autoplay playsinline>
									<track kind="captions" />
								</video>

								<div class="focus-tainer"><FocusIcon size={260} stroke={1} /></div>
							</div>

							<p class="text-justify text-sm text-muted-foreground">
								<b>Tip:</b> Press the button below to take the photo.
							</p>

							<button class="selfie-button" onclick={capturePhoto}
								><Circle class="h-[35px] w-[35px]" /></button
							>
						{/if}

						{#if kycBegin && imgSrc}
							<Label>That's a Great Angle!</Label>
							<img class="photo-id-taken" src={imgSrc} alt="foto-id" />
							<Button variant="destructive" onclick={retakePhoto}
								>Retake<RotateCcw class="ml-2 h-4 w-4" /></Button
							>
						{/if}
					</div>
				</div>
			</section>

			<h3 class="mt-7 mb-4">Signature</h3>
			<section class="inputs mb-5">
				<div class="items tp flex">
					{#if backupCodes && backupCodes.length}
						<div class="cntnt flex w-full max-w-sm flex-col gap-1.5">
							<div class="grid gap-2">
								<img class="sig-img" src={qrUrl} alt="signature qr" />
								<p class="max-w-[800px] text-sm text-muted-foreground">
									Scan the QR Code above into any authenticator app, we recommend <a
										href="https://www.google.com/search?q=google+authenticator"
										target="_blank">Google Authenticar</a
									>.
								</p>
								<p class="max-w-[800px] text-sm text-muted-foreground">
									Or alternatively, enter the code below to set it up manually in your authenticator
									app of your choice.
								</p>
								<div class="sig-check">
									<p class="num">{signatureValue}</p>
									<Button
										class="ml-5"
										variant="outline"
										onclick={() => copyVal(signatureValue ?? "")}><Copy /></Button
									>
								</div>

								<h3 class="mt-5">Backup Codes</h3>
								<table class="sig-backups">
									<tbody>
										{#each backupCodes.slice(0, 4) as code, i}
											<tr>
												<td class="num">{code}</td>
												{#if backupCodes[i + 4]}
													<td class="num">{backupCodes[i + 4]}</td>
												{/if}
											</tr>
										{/each}
									</tbody>
								</table>
								<p class="max-w-[800px] text-sm text-muted-foreground">
									These codes will only be shown once, and once you use them they cannot be reused.
								</p>
								<p class="max-w-[800px] text-sm text-muted-foreground">
									Please keep them safe and <b>DO NOT</b> share them with anyone.
								</p>
								<Button
									variant="outline"
									onclick={() => copyVal(backupCodes ? backupCodes.join(" ") : "")}
									>Copy Codes<Copy class="ml-2 h-4 w-4" /></Button
								>
							</div>
						</div>
					{:else}
						<div class="cntnt flex w-full max-w-sm flex-col gap-1.5">
							<Label>Create a Signature</Label>

							<p class="max-w-[800px] text-sm text-muted-foreground">
								This will act as your digital identity and enable you to securely "sign" on
								instructions and other important actions
							</p>
							<p class="max-w-[800px] text-sm text-muted-foreground">
								It will also secure your account from malicious actors
							</p>
							<p class="max-w-[800px] text-sm text-muted-foreground">
								<b>NOTE</b> that you are responsible for keeping it only accessible to you.
							</p>
							<p class="max-w-[800px] text-sm text-muted-foreground">
								You are required to use an <b>Authenticator App</b> to securely generate your signature
								on demand.
							</p>
							<p class="max-w-[800px] text-sm text-muted-foreground">
								We recommend
								<a href="https://www.google.com/search?q=google+authenticator" target="_blank"
									>Google Authenticator</a
								>.
							</p>

							<Button variant="outline" onclick={genSignature} disabled={loading}
								>Create Signature<Signature class="ml-2 h-4 w-4" /></Button
							>
						</div>
					{/if}
				</div>
			</section>

			<h3 class="mt-7 mb-4">Questionnaire</h3>
			<section class="inputs mb-5">
				<div class="items tp flex">
					<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
						<Label>How Did You Hear About Us?</Label>

						<AnyCombobox
							handler={changeSanitisedReferral}
							data={{
								ungrouped: [{ label: "Other (Specify)", value: "Other" }],
								grouped: [
									{
										title: "SBZ Sources",
										group: [
											{ value: "Facebook", label: "Facebook" },
											{ value: "LinkedIn", label: "LinkedIn" },
											{ value: "Web", label: "Web" },
											{ value: "YouTube", label: "YouTube" },
											{ value: "Spotify", label: "Spotify" },
										],
									},
									{
										title: "Institutions",
										group: [
											{ value: "LuSE", label: "Lusaka Securities Exchange" },
											{ value: "Ventura", label: "Ventura Solutions" },
											{ value: "ZBT", label: "Zambian Business Times" },
											{ value: "Radio Phoenix", label: "Radio Phoenix" },
										],
									},
									{
										title: "Other Sources",
										group: [
											{ value: "Referral", label: "Referral" },
											{ value: "News", label: "News" },
											{ value: "Newspaper", label: "Newspaper" },
										],
									},
								],
							}}
							dataTitle="Source"
						/>

						{#if sanitisedReferralValue === "Other"}
							<Input
								class="my-2"
								bind:value={otherReferralValue}
								placeholder="Type here..."
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									otherReferralValue = toTitleCase(e.target.value);
								}}
							/>
						{/if}
					</div>
				</div>
			</section>

			<h3 class="mt-7 mb-4">Terms and Conditions</h3>
			<section class="inputs mb-5">
				<div class="flex items-start gap-3">
					<Checkbox onCheckedChange={(v) => (tcVal = !tcVal)} disabled={loading} />
					<div class="grid gap-2">
						<Label>Accept terms and conditions</Label>
						<p class="max-w-[600px] text-sm text-muted-foreground">
							By clicking this checkbox, you agree to our terms and conditions, and privacy policy.
						</p>
						<Dialog.Root>
							<Dialog.Trigger disabled={loading}>
								{#snippet child({ props })}
									<Button {...props} variant="link" class="w-fit">
										View Ts & Cs<Eye class="h-4 w-4" />
									</Button>
								{/snippet}
							</Dialog.Trigger>

							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>Stockbrokers Zambia Ts & Cs</Dialog.Title>
									<Dialog.Description>
										In order to open an account an use our platform, you are required to read and
										accept these.
									</Dialog.Description>
								</Dialog.Header>
								<div class="tc">
									{@html marked(tc)}
								</div>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				</div>
			</section>

			<Button
				class={`mt-10 cursor-pointer${!isMobile ? " mx-auto w-[200px]" : ""}`}
				{disabled}
				onclick={getOtp}>Sign Up<CirclePlus class="ml-2 h-4 w-4" /></Button
			>
		{/if}

		<div class="footer my-10">
			<p>Built by <a href="https://www.neos.finance" target="_blank">Neos FinTech</a></p>
			<p class="mb-10">© {year} OmniBot, All Rights Reserved</p>
		</div>
	</div>
</div>

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
