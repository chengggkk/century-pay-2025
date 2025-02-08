import dotenv from "dotenv";
import { initializeAgent } from "../agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "../agentkit/edit";

dotenv.config();

/**
 * Creates a new wallet for the user if they don’t already have one.
 * @param {string} fromId - The Discord user ID.
 * @param {string} ToId - The Discord user ID.
 * @returns {NextResponse} - Response containing the wallet creation message.
 */
export const zkDeposit = async (channelId: string, fromId: string, ToId: string, amount: string) => {
    const cleanToId = ToId.replace(/[^0-9]/g, "");
    const amountFloat = parseFloat(amount);

    try {
        const { agent, config } = await initializeAgent(fromId);
        const prompt = `Call zk_deposit to deposit ${amountFloat} eth to base-sepolia contract with discord ID ${cleanToId}. Don't reveal the discord ID in the response.`
        const stream = await agent.stream({ messages: [new HumanMessage(prompt)] }, config);
        for await (const chunk of stream) {
            if ("agent" in chunk) {
                const response = chunk.agent.messages[0].content;
                console.log("agent", response);
                await sendMessage(channelId, {
                    content: response,
                });
            } else if ("tools" in chunk) {
                const response = chunk.tools.messages[0].content;
                console.log("tool", response);
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