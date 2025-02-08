import { CdpAction } from "../cdp-agentkit-core";
import { Wallet } from "@coinbase/coinbase-sdk";
import { z } from "zod";
import { poseidon1 } from "poseidon-lite";
import Decimal from "decimal.js";
import { ZKPoseidonDepositAddress } from ".";

const ZK_DEPOSIT_PROMPT = `
This tool will call a base-sepolia contract. It takes the recipient's discord ID as the input. And it will generate a poseidon hash of the discord ID and send it to the contract. And it will deposit the amount of eth to the contract. Don't reveal the discord ID to anyone.
- amount: The amount to transfer
- contractAddress: The contract address of the PoseidonDeposit
- discordId: The recipient's discord ID

Important notes:
- Don't reveal the discord ID to anyone.
`;

const DEPOSIT_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "recipientHash",
                "type": "uint256"
            }
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
]

/**
 * Input schema for mint NFT action.
 */
export const ZkDepositInput = z
    .object({
        amount: z.string().describe("The amount of the asset to deposit"),
        discordId: z.string().describe("The recipient's discord ID"),
    })
    .strip()
    .describe("Instructions for depositing eth with recipient's discord ID");

/**
 * Deposits ETH to a specified destination address onchain.
 *
 * @param wallet - The wallet to deposit ETH from.
 * @param args - The input arguments for the action.
 * @returns A message containing the deposit details.
 */
export async function zkDeposit(wallet: Wallet, args: z.infer<typeof ZkDepositInput>): Promise<string> {

    const IDHash = poseidon1([args.discordId]).toString();
    const depositArgs = {
        recipientHash: IDHash,
    };

    try {
        const depositInvocation = await wallet.invokeContract({
            contractAddress: ZKPoseidonDepositAddress,
            method: "deposit",
            args: depositArgs,
            abi: DEPOSIT_ABI,
            amount: new Decimal(args.amount),
            assetId: "eth",
        });

        const result = await depositInvocation.wait();

        return `ZK deposit to contract ${ZKPoseidonDepositAddress} to discord ID hash ${IDHash} on network ${wallet.getNetworkId()}.\nTransaction hash for the deposit: ${result
            .getTransaction()
            .getTransactionHash()}\nTransaction link for the deposit: ${result
                .getTransaction()
                .getTransactionLink()}`;
    } catch (error) {
        return `Error depositing ETH: ${error}`;
    }
}

/**
 * ZK Deposit ETH action.
 */
export class ZkDepositAction implements CdpAction<typeof ZkDepositInput> {
    public name = "zk_deposit";
    public description = ZK_DEPOSIT_PROMPT;
    public argsSchema = ZkDepositInput;
    public func = zkDeposit;
}
