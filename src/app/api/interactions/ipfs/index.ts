import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";
import { initializeAgent } from "../agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "../agentkit/edit";

dotenv.config();

/**
 * Uploads a file to IPFS via Infura.
 * @param {string} channel_id - The Discord channel ID (optional for logging).
 * @param {string} userId - The Discord user ID (who is uploading).
 * @param {string} fileUrl - The URL of the file from Discord.
 * @returns {Promise<string | undefined>} - The IPFS URL of the uploaded NFT.
 */
export const ipfs = async (channel_id: string, userId: string, fileUrl: any) => {
    try {
        const { agent, config } = await initializeAgent(userId);
        const stream = await agent.stream({ messages: [new HumanMessage(`upload to IPFS, image URL if ${fileUrl}`)] }, config);
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