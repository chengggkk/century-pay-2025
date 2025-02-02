import dotenv from "dotenv";
import { initializeAgent } from "../agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "../agentkit/edit";
import { processingMessage } from "../utils";

dotenv.config();

/**
 * Uploads a file to IPFS via Infura.
 * @param {string} channelId - The Discord channel ID (optional for logging).
 * @param {string} userId - The Discord user ID (who is uploading).
 * @param {string} fileUrl - The URL of the file from Discord.
 * @returns {Promise<string | undefined>} - The IPFS URL of the uploaded NFT.
 */
export const ipfs = async (channelId: string, userId: string, fileUrl: any) => {
    try {
        await sendMessage(channelId, processingMessage);
        const { agent, config } = await initializeAgent(userId);
        const stream = await agent.stream({ messages: [new HumanMessage(`upload to IPFS, image URL if ${fileUrl}`)] }, config);
        for await (const chunk of stream) {
            if ("agent" in chunk) {
                const response = chunk.agent.messages[0].content;
                console.log("agent", response);
                await sendMessage(channelId, {
                    content: response,
                });

            } else if ("tools" in chunk) {
                const response = chunk.tools.messages[0].content;
                console.log("tools", response);
                await sendMessage(channelId, {
                    content: response,
                });

            }
        }
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
};