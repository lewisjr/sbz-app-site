import jwt from "jsonwebtoken";
import { JWT_SECRET } from "$env/static/private";

/**Generate a JWT for any data type */
export const genJwt = (
	data: string | object,
	validUntil: "4h" | "12h" | "1d" | "2d" | "7d" | "30d",
): string => {
	return jwt.sign({ data }, JWT_SECRET, { expiresIn: validUntil });
};

/**Try to decode a JWT */
export const checkJwt = (token: string): string | jwt.JwtPayload | false => {
	try {
		const data = jwt.verify(token, JWT_SECRET);

		if (data) return data;
		else return false;
	} catch (ex) {
		console.log(ex);
		return false;
	}
};
