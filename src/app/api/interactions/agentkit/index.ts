import { initializeAgent } from "./agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "./edit";

const maxLength = 1500;

export function splitContent(content: string): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < content.length) {
        // Find the slice's end point, starting with maxLength
        let endIndex = startIndex + maxLength;

        // If we exceed the string length, stop at the end of the content
        if (endIndex >= content.length) {
            chunks.push(content.slice(startIndex));
            break;
        }

        // Look for the nearest newline within the range of maxLength
        let newlineIndex = content.lastIndexOf("\n", endIndex);
        if (newlineIndex === -1 || newlineIndex < startIndex) {
            // If no newline is found or it's outside the current slice, just cut at maxLength
            newlineIndex = endIndex;
        }

        // Add the chunk and move the start index to the next part
        chunks.push(content.slice(startIndex, newlineIndex));
        startIndex = newlineIndex + 1;  // Move past the newline (if it exists)
    }

    return chunks;
}

export const agentkit = async (channel_id: string, options: any) => {
    const { agent, config } = await initializeAgent();
    const stream = await agent.stream({ messages: [new HumanMessage(options[0].value)] }, config);
    for await (const chunk of stream) {
        if ("agent" in chunk) {
            console.log("agent", chunk.agent.messages[0].content);
            const chunks = splitContent(chunk.agent.messages[0].content);
            for (const chunk of chunks) {
                await sendMessage(channel_id, { content: chunk });
            }
        } else if ("tools" in chunk) {
            console.log("tools", chunk.tools.messages[0].content);
            const chunks = splitContent(chunk.tools.messages[0].content);
            for (const chunk of chunks) {
                await sendMessage(channel_id, { content: chunk });
            }
        }
    }
};
