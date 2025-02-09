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
 * @param {string} receiveAddress - The receive address of the NFT.
 * @param {string} contractAddress - The contract address of the NFT.
 * @param {string} tokenId - The token ID of the NFT.
 * @returns {Promise<string | undefined>} - The IPFS URL of the uploaded NFT.
 */
export const sendNFT = async (channel_id: string, userId: string, receiveAddress: string, contractAddress: string, tokenId: string) => {
    try {
        const { agent, config } = await initializeAgent(userId);
        const from_address = await wallet.findOne({ user: userId });
        if (receiveAddress.startsWith("<@")) {
            const user = await wallet.findOne({ user: receiveAddress.slice(2, -1) });
            receiveAddress = user.wallet;
        }
        const stream = await agent.stream({ messages: [new HumanMessage(`send NFT ${contractAddress} ${tokenId} to ${receiveAddress} from ${from_address.wallet}(defaultAddressId), if the NFT is owned by ${from_address.wallet}
        to_address = defaultAddressId in ${receiveAddress}
            return format message (if the NFT is owned by the user) (only return the message below):
        - 📤 Sent NFT ${contractAddress} / TokenId: ${tokenId} to (to_address)
        - Transaction Hash: [Transaction Hash](Transaction Hash URL)

        example output:
        📤 Sent NFT 0xEda83609606BE0D80bE4660F3aDa3F7658F1C812 / TokenId: 0 to 0x9952dbfCb1e525133A6f9Fb425b9d915ecA1f534
        Transaction Hash: [0x6cfe02c037f75590c9331edd93c5f1ad985c9c1b4fbcff79ee17475112371f50](https://sepolia.basescan.org/tx/0x6cfe02c037f75590c9331edd93c5f1ad985c9c1b4fbcff79ee17475112371f50)

        return format message (if the NFT is not owned by the user) (only return the message below):
        ❌This NFT is not owned by you
            `)] }, config);
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