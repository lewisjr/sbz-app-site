import { network } from "hardhat";

import type { SBZK } from "../../../types/ethers-contracts";
import type { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import type { TypedContractEvent, TypedEventLog } from "../../../types/ethers-contracts/common.js";
import type { TransferEvent } from "../../../types/ethers-contracts/SBZK.sol/SBZK.js";

import { SBZK_ADDRESS, SBZU_ADDRESS } from "$env/static/private";
import { numParse } from "@cerebrusinc/qol";

const logger = console;

/**SBZ part of the Neoconomy */
class Neoconomy {
	private ethers: HardhatEthers | undefined = undefined;
	/**Contract */
	private cn: SBZK | undefined = undefined;
	// ? setup
	private networkName: string = "";
	private contractTitle: string = "";
	private contractAddress: string = "";
	private isConnected: boolean = false;
	private OWNER_ADDRESS: string = "";

	constructor(networkName: "prod" | "local" | "dev", contractTitle: "SBZK" | "SBZU") {
		// logger.newLog("log", "new Neoconomy(...)", "Initialising...");
		this.networkName = networkName;
		this.contractTitle = contractTitle;

		switch (contractTitle) {
			case "SBZK":
				this.contractAddress = SBZK_ADDRESS;
				break;
			case "SBZU":
				this.contractAddress = SBZU_ADDRESS;
				break;
		}
	}

	private async connect() {
		if (!this.networkName) {
			logger.log("error", "Neoconomy.connect", "Network name not set... how was this initialised?");
			return;
		}

		if (!this.contractTitle) {
			logger.log(
				"error",
				"Neoconomy.connect",
				"Contract title not set... how was this initialised?",
			);
			return;
		}

		if (!this.contractAddress) {
			logger.log(
				"error",
				"Neoconomy.connect",
				"Contract address not set... how was this initialised?",
			);
			return;
		}

		if (!this.isConnected) {
			const provider = await network.connect(this.networkName);
			// @ts-ignore
			const _holder = provider.ethers as HardhatEthers;
			this.ethers = _holder;

			const contract = await _holder.getContractAt(this.contractTitle, this.contractAddress);
			// @ts-ignore
			this.cn = contract;

			if (!contract.owner) {
				logger.log("error", "Neoconomy.connect", "Failed to find the contract owner... somehow?");
				return;
			}

			try {
				// @ts-ignore
				this.OWNER_ADDRESS = await contract.owner();
			} catch {
				console.error("await contract.owner() is not a function, trying the fallback.");
				// @ts-ignore
				this.OWNER_ADDRESS = contract.runner.address;
			}

			console.log(this.OWNER_ADDRESS);

			this.isConnected = true;
		}
	}

	public async genWallet() {
		await this.connect();

		if (!this.ethers) {
			logger.log("error", "Neoconomy.genWallet", "Ethers is not defined... for some reason.");
			return false;
		}

		const wallet = this.ethers.Wallet.createRandom();

		return {
			address: wallet.address,
			phrase: wallet.mnemonic?.phrase,
			privKey: wallet.privateKey,
			pubKey: wallet.publicKey,
		};
	}

	/**Add new tokens to circulation without accounting for PEG */
	public async mint(recipient: string, amount: number) {
		await this.connect();

		if (!this.ethers) {
			logger.log("error", "Neoconomy.mint", "Ethers is not defined... for some reason.");
			return false;
		}

		if (!this.cn) {
			logger.log("error", "Neoconomy.mint", "The contract is not defined... for some reason.");
			return false;
		}

		const valueInWei = this.ethers.parseUnits(amount.toString(), 18);

		try {
			const res = await (await this.cn.mint(recipient, valueInWei)).wait();

			if (!res) {
				logger.log(
					"error",
					"Neoconomy.mint",
					"Failed to mint for some reason... maybe the contract address? Or the gas?",
				);
				return false;
			}

			if (!res.hash.length) {
				logger.log(
					"error",
					"Neoconomy.mint",
					`Well it failed to hash because:\n${JSON.stringify(res)}\n`,
				);
				return false;
			}

			const { hash, blockHash, blockNumber, gasUsed, index, from, to } = res;

			return {
				hash,
				blockHash,
				blockNumber,
				gasUsed,
				index,
				recipient: to,
				sender: from,
				value: amount,
				valueInWei,
			};
		} catch (ex: any) {
			logger.log("error", "Neoconomy.mint EX", String(ex));
			return false;
		}
	}

	/**Add new tokens to circulation without accounting for PEG */
	public async burn(recipient: string, amount: number) {
		await this.connect();

		if (!this.ethers) {
			logger.log("error", "Neoconomy.burn", "Ethers is not defined... for some reason.");
			return false;
		}

		if (!this.cn) {
			logger.log("error", "Neoconomy.burn", "The contract is not defined... for some reason.");
			return false;
		}

		const valueInWei = this.ethers.parseUnits(amount.toString(), 18);

		try {
			const res = await (await this.cn.burn(recipient, valueInWei)).wait();

			if (!res) {
				logger.log(
					"error",
					"Neoconomy.burn",
					"Failed to burn for some reason... maybe the contract address? Or the gas?",
				);
				return false;
			}

			if (!res.hash.length) {
				logger.log(
					"error",
					"Neoconomy.burn",
					`Well it failed to hash because:\n${JSON.stringify(res)}\n`,
				);
				return false;
			}

			const { hash, blockHash, blockNumber, gasUsed, index, from, to } = res;

			return {
				hash,
				blockHash,
				blockNumber,
				gasUsed,
				index,
				recipient: to,
				sender: from,
				value: amount * -1,
				valueInWei,
			};
		} catch (ex: any) {
			logger.log("error", "Neoconomy.burn EX", String(ex));
			return false;
		}
	}

	private async getTotalSupply() {
		await this.connect();
		try {
			if (!this.cn) {
				logger.log(
					"error",
					"Neoconomy.getTotalSupply",
					"The contract is not defined... for some reason.",
				);
				return false;
			}

			const supplyInWei = await this.cn.totalSupply();

			if (!this.ethers) {
				logger.log(
					"error",
					"Neoconomy.getTotalSupply",
					"Ethers is not defined... for some reason.",
				);
				return false;
			}

			const supplyInCnHumanReadable = this.ethers.formatUnits(supplyInWei, 18);

			return {
				wei: supplyInWei,
				normal: supplyInCnHumanReadable,
				_normal: Number(supplyInCnHumanReadable),
			};
		} catch (ex) {
			logger.log("error", "Neoconomy.getTotalSupply", String(ex));
			return false;
		}
	}

	private async getTreasry() {
		await this.connect();

		if (!this.ethers) {
			logger.log("error", "Neoconomy.getTreasry", "Ethers is not defined... for some reason.");
			return false;
		}

		if (!this.cn) {
			logger.log(
				"error",
				"Neoconomy.getTotalSupply",
				"The contract is not defined... for some reason.",
			);
			return false;
		}

		//console.log({ owner: await this.cn.owner() });

		const treasury = await this.ethers.provider.getBalance(this.OWNER_ADDRESS);

		// console.log(treasury);

		const tHuman = this.ethers.formatUnits(treasury, 18);

		return { wei: treasury, normal: tHuman, _normal: Number(tHuman) };
	}

	public async getTokenValue() {
		await this.connect();

		if (!this.ethers) {
			logger.log("error", "Neoconomy.getTokenValue", "Ethers is not defined... for some reason.");
			return false;
		}

		const [neoconomySupply, treasury] = await Promise.all([
			this.getTotalSupply(),
			this.getTreasry(),
		]);

		if (!neoconomySupply) {
			logger.log("error", "Neoconomy.getTokenValue", "Failed to get token supply!.");
			return false;
		}

		if (!treasury) {
			logger.log("error", "Neoconomy.getTokenValue", "Failed to get treasury!.");
			return false;
		}

		return {
			base: "POL",
			token: this.contractTitle,
			treasuryWei: treasury.wei,
			treasury: numParse(treasury._normal.toFixed(2)),
			supplyWei: neoconomySupply.wei,
			supply: numParse(neoconomySupply._normal),
			/**Human readable */
			floor: numParse(treasury._normal / neoconomySupply._normal),
			floorBase: "POL/SBZK",
		};
	}

	/**For the client */
	public async getUserTokenHoldings(recipient: string) {
		await this.connect();

		if (!this.ethers) {
			logger.log(
				"error",
				"Neoconomy.getUserTokenHoldings",
				"Ethers is not defined... for some reason.",
			);
			return false;
		}

		if (!this.cn) {
			logger.log(
				"error",
				"Neoconomy.getUserTokenHoldings",
				"The contract is not defined... for some reason.",
			);
			return false;
		}

		const tokenHoldingsWei = await this.cn.balanceOf(recipient);

		const tokenHoldings = this.ethers.formatUnits(tokenHoldingsWei, 18);

		return {
			wei: tokenHoldingsWei,
			normal: tokenHoldings,
			_normal: Number(tokenHoldings),
			token: this.contractTitle,
		};
	}

	public async getTransactions(recipient: string) {
		await this.connect();

		if (!this.ethers) {
			logger.log("error", "Neoconomy.getTransactions", "Ethers is not defined... for some reason.");
			return false;
		}

		if (!this.cn) {
			logger.log(
				"error",
				"Neoconomy.getTransactions",
				"The contract is not defined... for some reason.",
			);
			return false;
		}

		// credits only
		const f1 = this.cn.filters.Transfer(undefined, recipient);
		// debits only
		const f2 = this.cn.filters.Transfer(recipient, undefined);

		const [l1, l2] = await Promise.all([
			this.cn.queryFilter(f1, 0, "latest"),
			this.cn.queryFilter(f2, 0, "latest"),
		]);

		const logs = [...l1, ...l2];

		/**
		 * Money in => mint => credit => C
		 * Money out => burn => debit => D
		 * bx => block hash
		 * tx => transaction hash
		 */
		const neoconomyTransactions: {
			from: string;
			to: string;
			token: string;
			valueWei: bigint;
			value: number;
			type: "D" | "C";
			reason: string;
			date: string;
			bx: string;
			blockNumber: number;
			tx: string;
			tNum: number;
			brief: "buy" | "sell" | "transfer";
			contract: string;
		}[] = [];

		const _genLog = async (
			log: TypedEventLog<
				TypedContractEvent<
					TransferEvent.InputTuple,
					TransferEvent.OutputTuple,
					TransferEvent.OutputObject
				>
			>,
			user: string,
		) => {
			if (!this.ethers) {
				logger.log(
					"error",
					"Neoconomy.getTransactions",
					`Ethers was undefined for tx ${log.transactionHash} in block ${log.blockHash} (no. ${log.blockNumber})`,
				);
				return false;
			}

			const dstamp = await this.ethers.provider.getBlock(log.blockNumber);

			if (!dstamp) {
				logger.log(
					"error",
					"Neoconomy.getTransactions",
					`Failed to get block data for tx ${log.transactionHash} in block ${log.blockHash} (no. ${log.blockNumber})`,
				);
				return false;
			}

			const isoString = new Date(dstamp.timestamp * 1000).toISOString();

			const [from, to, value] = log.args;

			neoconomyTransactions.push({
				blockNumber: log.blockNumber,
				brief: to.toLowerCase() === user.toLowerCase() ? "buy" : "sell",
				bx: log.blockHash,
				contract: log.address,
				date: isoString,
				from,
				to,
				reason: "",
				tNum: log.transactionIndex,
				token: this.contractTitle,
				tx: log.transactionHash,
				type: to.toLowerCase() === user.toLowerCase() ? "C" : "D",
				value: Number(this.ethers.formatUnits(value, 18)),
				valueWei: value,
			});
		};

		await Promise.all(logs.map((log) => _genLog(log, recipient)));

		return neoconomyTransactions;
	}
}

export default Neoconomy;
