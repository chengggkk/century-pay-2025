import { InteractionResponseType } from "discord-interactions";
import { NextResponse } from "next/server";
import { initializeAgent } from "./agent";
import { HumanMessage } from "@langchain/core/messages";

export const agentkit = async (options: any) => {
    const { agent, config } = await initializeAgent();
    const stream = await agent.stream({ messages: [new HumanMessage(options[0].value)] }, config);
    let response = "";
    for await (const chunk of stream) {
        if ("agent" in chunk) {
            //   console.log("agent",chunk.agent.messages[0].content);
            response += chunk.agent.messages[0].content;
        } else if ("tools" in chunk) {
            // console.log("tools", chunk.tools.messages[0].content);
            response += chunk.tools.messages[0].content;
        }
        response += "\n";
    }
    return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: response,
            flags: 64,
        },
    });
};
