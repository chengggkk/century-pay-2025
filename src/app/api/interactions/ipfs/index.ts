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
        const stream = await agent.stream({
            messages: [
                new HumanMessage(`
                    Upload the provided image to IPFS. The image URL is: ${fileUrl}.
                    
                    After uploading, provide the user with **both the Image IPFS URL and the Metadata IPFS URL**.
        
                    **Formatting Instructions:**
                    - Format **both** links using **Markdown**.
                    - The **Image IPFS URL** should be formatted like this:
                      - **Image IPFS URL:** [View Image](<Image IPFS URL>)
                    - The **Metadata IPFS URL** should be formatted like this:
                      - **Metadata IPFS URL:** [View Metadata](<Metadata IPFS URL>)
                      
                    **Example Output:**
                    - **Image IPFS URL:** [View Image](https://ipfs.io/ipfs/YourImageCID)
                    - **Metadata IPFS URL:** [View Metadata](https://ipfs.io/ipfs/YourMetadataCID)

        
                    After displaying the links, instruct the user to deploy the NFT by typing:
                    \`\`\`/deploynft name:NFTname symbol:NFTsymbol metadata:<Metadata IPFS URL>\`\`\`
        
                    **Ensure the Metadata Link is formatted in Markdown and the raw link is included in a code block for easy copying.**
                `)
            ]
        }, config);
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