import crypto from "crypto";

//constants
import { TOKEN_SECRET, TOKEN_PARSER } from "$env/static/private";

//types
import type { CipherGCM } from "crypto";

const key: Buffer = Buffer.from(
	crypto.createHash("sha256").update(TOKEN_SECRET).digest("base64"),
	"base64",
);

interface Token {
	iv: string;
	cipher: string;
	authTag: string;
}

/**
 * Tokenise data
 * @param txt the text to be tokenised
 * @returns a Cerebrus (TM) token
 */
const tokenise = (txt: string): Token => {
	const iv: Buffer = crypto.randomBytes(16);
	const cipher: CipherGCM = crypto.createCipheriv("aes-256-gcm", key, iv);

	const encrypted: Buffer = Buffer.concat([cipher.update(txt), cipher.final()]);
	const authTag: Buffer = cipher.getAuthTag(); // Get the authentication tag

	return {
		iv: iv.toString("hex"),
		cipher: encrypted.toString("hex"),
		authTag: authTag.toString("base64"),
	};
};

/**Dynamic key setting */
const tokeniseV2 = (txt: string, keyRaw: string): Token => {
	const _key = Buffer.from(crypto.createHash("sha256").update(keyRaw).digest("base64"), "base64");

	const iv: Buffer = crypto.randomBytes(16);
	const cipher: CipherGCM = crypto.createCipheriv("aes-256-gcm", _key, iv);

	const encrypted: Buffer = Buffer.concat([cipher.update(txt), cipher.final()]);

	const authTag: Buffer = cipher.getAuthTag(); // Get the authentication tag

	return {
		iv: iv.toString("hex"),
		cipher: encrypted.toString("hex"),
		authTag: authTag.toString("base64"),
	};
};

/**
 * Detokenise a token
 * @param token the Cerebrus (TM) minted token
 * @returns the detokenised data
 */
const deTokenise = (token: Token): string => {
	const { iv, cipher, authTag } = token;

	const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
	decipher.setAuthTag(Buffer.from(authTag, "base64")); // Set the authentication tag

	const decrypted = Buffer.concat([decipher.update(Buffer.from(cipher, "hex")), decipher.final()]);

	return decrypted.toString();
};

/**Dynamic key setting */
const deTokeniseV2 = (token: Token, keyRaw: string): string => {
	const _key = Buffer.from(crypto.createHash("sha256").update(keyRaw).digest("base64"), "base64");

	const { iv, cipher, authTag } = token;

	try {
		const decipher = crypto.createDecipheriv("aes-256-gcm", _key, Buffer.from(iv, "hex"));
		decipher.setAuthTag(Buffer.from(authTag, "base64")); // Set the authentication tag

		const decrypted = Buffer.concat([
			decipher.update(Buffer.from(cipher, "hex")),
			decipher.final(),
		]);

		return decrypted.toString();
	} catch (ex) {
		return "FAIL";
	}
};

/**
 * Stringify a token
 * @param token the Cerebrus (TM) token
 * @returns a stringified token to be saved in the database
 */
const stringifyToken = (token: Token): string => {
	const { cipher, iv, authTag } = token;
	return `${iv}${TOKEN_PARSER}${cipher}${TOKEN_PARSER}${authTag}`;
};

/**
 * Create a token for decoding from the DB
 * @param txt the stringified token
 * @returns a token
 */
const parseToken = (txt: string): Token => {
	const tokenArr: string[] = txt.split(TOKEN_PARSER);
	return { cipher: tokenArr[1], iv: tokenArr[0], authTag: tokenArr[2] };
};

/**Convert a string to a token */
const encode = (data: string, privateKey?: string): string => {
	const token = privateKey ? tokeniseV2(data, privateKey) : tokenise(data);
	return stringifyToken(token);
};

/**Convert your token back into its `untokenised` form; Accepts a private key in case the token was not generated using the server settings */
const decode = (tokenString: string, privateKey?: string): string => {
	const token = parseToken(tokenString);
	return privateKey ? deTokeniseV2(token, privateKey) : deTokenise(token);
};

export default class Tokenise {
	/**Convert a string to a token; It accepts a private key for extra encryption safety */
	readonly encode: (data: string, privateKey?: string) => string = encode;
	readonly decode: (tokenString: string, privateKey?: string) => string = decode;

	constructor() {}
}
