import dbs from "$lib/server/db";
import { scourgeOfInvestor } from "$lib/server/jwt";
import { redirect } from "@sveltejs/kit";
import { print } from "$lib/utils";

export const load = async (data) => {
	const client = scourgeOfInvestor(data);
	const portfolio = await dbs.sbz.getPortfolio(client.data.luseId);

	let portfolioValueZMW: number = 0;
	let portfolioValueUSD: number = 0;

	let investmentValueZMW: number = 0;
	let investmentValueUSD: number = 0;

	const pdata = portfolio.data;

	if (pdata) {
		pdata.settled.forEach((cn) => {
			if (cn.currency.toLowerCase() === "usd") {
				const currentPrice = pdata.dmr.find((item) => item.symbol === cn.symbol);

				if (cn.side === "buy") {
					if (currentPrice) portfolioValueUSD += cn.qty * currentPrice.market_price;
					investmentValueUSD += cn.value;
				} else {
					if (currentPrice) portfolioValueUSD -= cn.qty * currentPrice.market_price;
					investmentValueUSD -= cn.value;
				}
			} else {
				const currentPrice = pdata.dmr.find((item) => item.symbol === cn.symbol);

				if (cn.side === "buy") {
					if (currentPrice) portfolioValueZMW += cn.qty * currentPrice.market_price;
					investmentValueZMW += cn.value;
				} else {
					if (currentPrice) portfolioValueZMW -= cn.qty * currentPrice.market_price;
					investmentValueZMW -= cn.value;
				}
			}
		});

		const fxUsd = pdata["fxUsd"].buy;

		const overallPfolio = portfolioValueZMW + fxUsd * portfolioValueUSD;
		const overalInv = investmentValueZMW + fxUsd * investmentValueUSD;

		if (investmentValueUSD < 0) investmentValueUSD = 0;
		if (investmentValueZMW < 0) investmentValueZMW = 0;

		return {
			portfolio: pdata,
			portfolioValueUSD,
			portfolioValueZMW,
			investmentValueUSD,
			investmentValueZMW,
			overallPfolio,
			overalInv,
			pDelta: (overallPfolio - overalInv) / overalInv,
		};
	} else throw redirect(307, "/contact");
};
