import { initializeAgent } from "../agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "../agentkit/edit";

const payload = {
    components: [
        {
            type: 1, // Action Row
            components: [
                {
                    type: 2, // Button
                    label: "Tweet",
                    style: 5, // Primary Button (blue)
                    url: "https://twitter.com/intent/tweet"
                }
            ]
        }
    ]
}

export const twitter = async (channel_id: string, options: any) => {
    try {
        const { agent, config } = await initializeAgent();
        const stream = await agent.stream({ messages: [new HumanMessage(options[0].value + ", write a tweet max 150 characters")] }, config);
        for await (const chunk of stream) {
            if ("agent" in chunk) {
                const response = chunk.agent.messages[0].content;
                console.log("agent", response);
                payload.components[0].components[0].url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(response)}`
                await sendMessage(channel_id, {
                    ...payload,
                    content: response,
                });

            } else if ("tools" in chunk) {
                const response = chunk.tools.messages[0].content;
                console.log("tools", response);
                payload.components[0].components[0].url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(response)}`
                await sendMessage(channel_id, {
                    ...payload,
                    content: response,
                });

            }
        }
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
};