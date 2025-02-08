import { sendMessage } from "../agentkit/edit";
import { Agent, Tool } from "@covalenthq/ai-agent-sdk";
import { StateFn } from "@covalenthq/ai-agent-sdk/dist/core/state";
import { TokenBalancesTool } from "@covalenthq/ai-agent-sdk";
import { NFTBalancesTool } from "@covalenthq/ai-agent-sdk";
import { TransactionsTool } from "@covalenthq/ai-agent-sdk";
import { user } from "@covalenthq/ai-agent-sdk/dist/core/base";
import { splitContent } from "../agentkit";
import { HistoryDailyPortfolioTool } from "./historyDailyProfolio";

type ChatCompletionToolMessageParam = {
    id: string;
    role: "tool";
    type: string,
    tool_call_id: string;
    content: string;
    function: {
        name: string;
        arguments: string;
    }
    tool_calls?: any[];
}

async function runToolCalls(
    tools: Record<string, Tool>,
    toolCalls: ChatCompletionToolMessageParam[]
): Promise<ChatCompletionToolMessageParam[]> {
    const results = await Promise.all(
        toolCalls.map(async (tc) => {
            if (tc.type !== "function") {
                throw new Error("Tool call needs to be a function");
            }

            const tool = tools[tc.function.name];
            if (!tool) {
                throw new Error(`Tool ${tc.function.name} not found`);
            }

            const response = await tool.execute(
                JSON.parse(tc.function.arguments)
            );

            return {
                role: "tool",
                tool_call_id: tc.id,
                content: response,
            };
        })
    );

    return results as ChatCompletionToolMessageParam[];
}

export const covalent = async (channelId: string, query: string) => {
    if (!process.env.GOLDRUSH_API_KEY) {
        throw new Error("GOLDRUSH_API_KEY is not set");
    }
    const apiKey = process.env.GOLDRUSH_API_KEY;
    const tools = {
        tokenBalances: new TokenBalancesTool(apiKey),
        nftBalances: new NFTBalancesTool(apiKey),
        transactions: new TransactionsTool(apiKey),
        historyDailyPortfolio: new HistoryDailyPortfolioTool(apiKey),
    };

    const agent = new Agent({
        name: "blockchain researcher",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "You are a blockchain researcher analyzing wallet activities across different chains.",
        instructions: [
            "Analyze wallet activities using the provided blockchain tools",
            "Summarize token holdings, NFT collections, and recent transactions",
            "Provide insights about the wallet's activity patterns",
        ],
        tools
    });

    const state = StateFn.root(agent.description);
    state.messages.push(
        // user(
        //     "Analyze wallet address karanpargal.eth on eth-mainnet and provide a complete analysis of its activities"
        // )
        user(
            query
        )
    );
    const result = await agent.run(state);
    const toolCall = result.messages[
        result.messages.length - 1
    ] as ChatCompletionToolMessageParam;

    const toolResponses = await runToolCalls(tools, toolCall?.tool_calls ?? []);

    const updatedState = {
        ...result,
        status: "running" as const,
        messages: [...result.messages, ...toolResponses],
    };

    const finalResult = await agent.run(updatedState);
    console.log(finalResult);
    for (const message of finalResult.messages) {
        const chunks = splitContent(message?.content as string ?? "");
        for (const chunk of chunks) {
            await sendMessage(channelId, { content: `**${message.role}:** ${chunk}` });
        }
    }
};