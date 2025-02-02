import { CdpAgentkit } from "./cdp-agentkit-core";
import { CdpTool, CdpToolkit } from "./cdp-langchain";
import { MemorySaver } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { z } from "zod";
import { SIGN_MESSAGE_PROMPT, signMessage } from "./sign";

// dotenv.config();

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * Initialize the agent with CDP AgentKit
 *
 * @returns Agent executor and config
 */
export async function initializeAgent() {
  // Initialize LLM
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
  });

  let walletDataStr: string | null = null;

  // Read existing wallet data if available
  //   if (fs.existsSync(WALLET_DATA_FILE)) {
  //     try {
  //       walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
  //     } catch (error) {
  //       console.error("Error reading wallet data:", error);
  //       // Continue without wallet data
  //     }
  //   }

  // Configure CDP AgentKit
  const config = {
    cdpWalletData: walletDataStr || undefined,
    networkId: process.env.NETWORK_ID || "base-sepolia",
  };

  const getWeather = tool((input) => {
    if (["sf", "san francisco"].includes(input.location.toLowerCase())) {
      return "It's 60 degrees and foggy.";
    } else {
      return "It's 90 degrees and sunny.";
    }
  }, {
    name: "get_weather",
    description: "Call to get the current weather.",
    schema: z.object({
      location: z.string().describe("Location to get the weather for."),
    })
  })


  // Initialize CDP AgentKit
  const agentkit = await CdpAgentkit.configureWithWallet(config);
  const wallet = await agentkit.exportWallet()
  // Initialize CDP AgentKit Toolkit and get tools
  const cdpToolkit = new CdpToolkit(agentkit as any);
  const tools = cdpToolkit.getTools();
  const SignMessageInput = z
    .object({
      message: z.string().describe("The message to sign. e.g. `hello world`"),
    })
    .strip()
    .describe("Instructions for signing a blockchain message");
  const signMessageTool = new CdpTool(
    {
      name: "sign_message",
      description: SIGN_MESSAGE_PROMPT,
      argsSchema: SignMessageInput,
      func: signMessage,
    },
    agentkit,
  );
  tools.push(signMessageTool);

  // Store buffered conversation history in memory
  const memory = new MemorySaver();
  const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

  // Create React Agent using the LLM and CDP AgentKit tools
  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    messageModifier:
      "You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit...",
  });

  // Save wallet data
  //   const exportedWallet = await agentkit.exportWallet();
  //   fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);

  return { agent, config: agentConfig };
}
