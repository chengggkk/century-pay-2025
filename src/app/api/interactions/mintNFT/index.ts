import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";
import { initializeAgent } from "../agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "../agentkit/edit";
import wallet from "../database/models/wallet";

dotenv.config();

/**
 * Uploads a file to IPFS via Infura.
 * @param {string} channel_id - The Discord channel ID (optional for logging).
 * @param {string} userId - The Discord user ID (who is uploading).
 * @param {string} contractAddress - The contract address of the NFT.
 * @returns {Promise<string | undefined>} - The IPFS URL of the uploaded NFT.
 */
export const mintNFT = async (channel_id: string, userId: string, contractAddress: string) => {
    try {
        const { agent, config } = await initializeAgent(userId);
        const receiveAddress = await wallet.findOne({ user: userId });
        console.log("receiveAddress", receiveAddress.wallet);
        const stream = await agent.stream({
            messages: [new HumanMessage(`
            mint NFT ${contractAddress} to ${receiveAddress.wallet}, if user do not have wallet, tell user to use \`\`\`/wallet\`\`\` to create wallet. 
            **Formatting Instructions:**
            - Mint NFT: (NFT Contract Address)(NFT Token ID)
            to
            - (Receiver Address)
            Transaction Hash: [Transaction Hash](Transaction Hash URL)
              
            **Example Output:**
            - Mint NFT: [0xEda83609606BE0D80bE4660F3aDa3F7658F1C812](1)
            to
            - [0xEda83609606BE0D80bE4660F3aDa3F7658F1C812]
            Transaction Hash: [0x6cfe02c037f75590c9331edd93c5f1ad985c9c1b4fbcff79ee17475112371f50](https://sepolia.basescan.org/tx/0x76acd481d31718315664a024b9a26f09c7c9d5b5da5dc79500f71973292c6f5f)

            `)]
        }, config);
        for await (const chunk of stream) {
            if ("agent" in chunk) {
                const response = chunk.agent.messages[0].content;
                console.log("agent", response);
                await sendMessage(channel_id, {
                    content: response,
                });

            } else if ("tools" in chunk) {
                const response = chunk.tools.messages[0].content;
                console.log("tools", response);
            }
        }
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
};