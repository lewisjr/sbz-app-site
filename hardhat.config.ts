import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";

import dotenv from "dotenv";
dotenv.config(); // loads .env into process.env

const { PRIV_KEY, RPC_PROD, RPC_DEV } = process.env;

const LOCAL_NODE_RPC = "http://127.0.0.1:8545";

export default defineConfig({
	solidity: "0.8.20",
	plugins: [hardhatEthers, hardhatTypechain, hardhatNetworkHelpers],
	networks: {
		dev: {
			url: RPC_DEV as string,
			accounts: [PRIV_KEY as string],
			type: "http",
		},
		prod: {
			url: RPC_PROD as string,
			accounts: [PRIV_KEY as string],
			type: "http",
		},
		local: {
			url: LOCAL_NODE_RPC,
			type: "http",
		},
	},
});
