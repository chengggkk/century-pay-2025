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
 * @param {string} content - The contract address of the NFT.
 * @returns {Promise<string | undefined>} - The IPFS URL of the uploaded NFT.
 */
export const Reply = async (channel_id: string, userId: string, content:string) => {
    try {
        const { agent, config } = await initializeAgent(userId);
        const stream = await agent.stream({
            messages: [new HumanMessage(` ${content} (do no sign the message)`)]
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