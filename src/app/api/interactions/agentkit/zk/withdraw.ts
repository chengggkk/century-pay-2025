import { CdpAction } from "../cdp-agentkit-core";
import { Wallet } from "@coinbase/coinbase-sdk";
import { z } from "zod";
import fs from 'fs';
import { exec } from 'child_process';
import { ZKPoseidonDepositAddress } from ".";

const ZK_WITHDRAW_PROMPT = `
This tool will call a base-sepolia contract. It take the recipient's wallet address and the Discord ID as the input. It will generate a zk poseidon hash of the discord ID and send it to the contract. And it will withdraw the amount of eth to the recipient's wallet address.
- contractAddress: The contract address of the PoseidonDeposit
- discordId: The recipient's discord ID
- address: The recipient's wallet address
`;

const WITHDRAW_ABI = [
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "recipientAddress",
                "type": "address"
            },
            {
                "internalType": "uint256[8]",
                "name": "_proof",
                "type": "uint256[8]"
            },
            {
                "internalType": "uint256[1]",
                "name": "_pubSignals",
                "type": "uint256[1]"
            }
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
]

/**
 * Input schema for zk withdraw action.
 */
export const ZkWithdrawInput = z
    .object({
        discordId: z.string().describe("The recipient's discord ID"),
        recipientAddress: z.string().describe("The recipient's wallet address"),
    })
    .strip()
    .describe("Instructions for withdrawing eth with recipient's discord ID's zk poseidon hash proof");

function writeToFile(discordId: string) {
    const inputs = { inputs: [discordId] };

    // Convert the inputs object to a JSON string
    const data = JSON.stringify(inputs, null, 2); // Pretty-print with 2 spaces

    // Write the data to a file (replace 'input.json' with your desired filename)
    fs.writeFile('input.json', data, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return;
        }

        console.log('Data written to file successfully!');
    });
}

async function generateZkPoseidonHash(discordId: string): Promise<{ proof: string, publicSignals: string }> {
    writeToFile(discordId);
    return new Promise((resolve, reject) => {
        exec(
            "npx snarkjs g16f input.json public/poseidon.wasm public/poseidon_final.zkey proof.json public.json",
            (error, stdout, stderr) => {
                if (error) {
                    console.log(`Error: ${error.message}`);
                    reject(error);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    reject(new Error(stderr));
                    return;
                }
                console.log(`stdout: ${stdout}`);

                try {
                    const proof = fs.readFileSync("proof.json", "utf8").replace(/\n/g, "").replace(/\\"/g, '"');
                    const publicSignals = fs.readFileSync("public.json", "utf8").replace(/\n/g, "").replace(/\\"/g, '"');

                    // Cleanup files
                    fs.unlinkSync("proof.json");
                    fs.unlinkSync("public.json");
                    fs.unlinkSync("input.json");

                    resolve({ proof, publicSignals });
                } catch (fileError) {
                    reject(fileError);
                }
            }
        );
    });
}

/**
 * Withdraws ETH to a specified destination address onchain.
 *
 * @param wallet - The wallet to deposit ETH from.
 * @param args - The input arguments for the action.
 * @returns A message containing the deposit details.
 */
export async function zkWithdraw(wallet: Wallet, args: z.infer<typeof ZkWithdrawInput>): Promise<string> {

    try {
        const { proof, publicSignals } = await generateZkPoseidonHash(args.discordId);
        const proofJson = JSON.parse(proof);
        const inputsJson = JSON.parse(publicSignals);
        const p = [
            proofJson.pi_a[0],
            proofJson.pi_a[1],
            proofJson.pi_b[0][1],
            proofJson.pi_b[0][0],
            proofJson.pi_b[1][1],
            proofJson.pi_b[1][0],
            proofJson.pi_c[0],
            proofJson.pi_c[1],
        ]
        console.log("p", p);
        console.log("inputsJson", inputsJson);
        const withdrawArgs = {
            recipientAddress: args.recipientAddress,
            _proof: p,
            _pubSignals: inputsJson,
        };
        // return `Proof: ${proof}\nPublic Signals: ${publicSignals}`;
        const withdrawInvocation = await wallet.invokeContract({
            contractAddress: ZKPoseidonDepositAddress,
            method: "withdraw",
            args: withdrawArgs,
            abi: WITHDRAW_ABI,
        });

        const result = await withdrawInvocation.wait();

        return `ZK withdraw from contract ${ZKPoseidonDepositAddress} to user address ${args.recipientAddress} on network ${wallet.getNetworkId()}.\nTransaction hash for the withdraw: ${result
            .getTransaction()
            .getTransactionHash()}\nTransaction link for the withdraw: ${result
                .getTransaction()
                .getTransactionLink()}`;
    } catch (error) {
        return `Error withdrawing ETH: ${error}`;
    }
}

/**
 * ZK Withdraw ETH action.
 */
export class ZkWithdrawAction implements CdpAction<typeof ZkWithdrawInput> {
    public name = "zk_withdraw";
    public description = ZK_WITHDRAW_PROMPT;
    public argsSchema = ZkWithdrawInput;
    public func = zkWithdraw;
}
