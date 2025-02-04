import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";
import { initializeAgent } from "../agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "../agentkit/edit";
import { getContractAddress } from "viem";

dotenv.config();

/**
 * Deploys an NFT to the blockchain.
 * @param {string} channel_id - The Discord channel ID (optional for logging).
 * @param {string} userId - The Discord user ID (who is deploying).
 * @param {string} NFTname - The name of the NFT.
 * @param {string} NFTsymbol - The symbol of the NFT.
 * @param {string} NFTmetadataLink - The metadata link of the NFT.
 * @returns {Promise<void>} - The response from the agent.
 * @example
 * deplotnft(channel_id, userId, "MyNFT", "MNFT", "https://ipfs.io/ipfs/QmZzv1
    */

export const deplotnft = async (channel_id: string, userId: string, NFTname: string, NFTsymbol: string, NFTmetadataLink: string) => {
    try {
        const { agent, config } = await initializeAgent(userId);
        const stream = await agent.stream({ messages: [new HumanMessage(`deploy NFT ${NFTname} ${NFTsymbol} ${NFTmetadataLink}`)] }, config);
        let contractAddress = "";  // Variable to store the extracted contract address
        for await (const chunk of stream) {
            if ("agent" in chunk) {
                const response = chunk.agent.messages[0].content;
                console.log("agent", response);
                await sendMessage(channel_id, {
                    content: response,
                });

                // Extract contract address from the response using regex
                const addressMatch = response.match(/0x[a-fA-F0-9]{40}/);
                if (addressMatch) {
                    contractAddress = addressMatch[0];
                    console.log("Extracted Contract Address:", contractAddress);

                } else if ("tools" in chunk) {
                    const response = chunk.tools.messages[0].content;
                    console.log("tools", response);
                    await sendMessage(channel_id, {
                        content: response,
                    });

                }
            }

            await sendMessage(channel_id, {
                content: "✅ Your file has been uploaded to IPFS! Choose how you'd like to deploy your NFT:",
                components: [
                    {
                        type: 1, // Action Row
                        components: [
                            {
                                type: 2, // Button
                                label: "Mint NFT",
                                style: 1, // Primary button (blue)
                                custom_id: `mint_${contractAddress}`,
                            }
                        ]
                    }
                ]
            });
        }
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
