import { initializeAgent } from "./agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "./edit";

export const agentkit = async (channel_id: string, options: any) => {
    const { agent, config } = await initializeAgent();
    const stream = await agent.stream({ messages: [new HumanMessage(options[0].value)] }, config);
    for await (const chunk of stream) {
        if ("agent" in chunk) {
            console.log("agent", chunk.agent.messages[0].content);
            await sendMessage(channel_id, chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
            console.log("tools", chunk.tools.messages[0].content);
            await sendMessage(channel_id, chunk.tools.messages[0].content);
        }
    }
};
