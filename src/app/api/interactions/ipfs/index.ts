import dotenv from "dotenv";
import { initializeAgent } from "../agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "../agentkit/edit";

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
        const { agent, config } = await initializeAgent(userId);
        const stream = await agent.stream({ messages: [new HumanMessage(`upload to IPFS, image URL if ${fileUrl} and ask user to type /deploynft NFTname NFTsymbol NFTmetadataLink (also tell the user the metadataLink of this picture) if they want to deploy NFT. Make sure return both Image IPFS URL and Metadata IPFS URL(and use markdown make user copy the Metadata IPFS URL and "\n" at last) 
            and format the link like "- **Image IPFS URL:** [View Image](Image IPFS URL) - **Metadata IPFS URL:** [View Metadata](Metadata IPFS URL)" `)] }, config);
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
            }
        }
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
};