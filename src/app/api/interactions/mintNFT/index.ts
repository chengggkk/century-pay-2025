import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";
import { initializeAgent } from "../agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "../agentkit/edit";
import wallet from "../database/models/wallet";
import { processingMessage } from "../utils";

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
        await sendMessage(channel_id, processingMessage);
        const { agent, config } = await initializeAgent(userId);
        const receiveAddress = await wallet.findOne({ user: userId });
        console.log("receiveAddress", receiveAddress.wallet);
        const stream = await agent.stream({ messages: [new HumanMessage(`mint NFT ${contractAddress} to ${receiveAddress.wallet}(defaultAddressId) pretty sure do not ask. if receive address is null, ask user to use /wallet to create one`)] }, config);
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
                await sendMessage(channel_id, {
                    content: response,
                });

            }
        }
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
};