// import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpToolkit } from "@coinbase/cdp-langchain";
import { MemorySaver } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { z } from "zod";

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
  //   const agentkit = await CdpAgentkit.configureWithWallet(config);

  // Initialize CDP AgentKit Toolkit and get tools
  //   const cdpToolkit = new CdpToolkit(agentkit);
  //   const tools = cdpToolkit.getTools();

  // Store buffered conversation history in memory
  const memory = new MemorySaver();
  const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

  // Create React Agent using the LLM and CDP AgentKit tools
  const agent = createReactAgent({
    llm,
    tools: [getWeather],
    checkpointSaver: memory,
    messageModifier:
      "You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit...",
  });

  // Save wallet data
  //   const exportedWallet = await agentkit.exportWallet();
  //   fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);

  return { agent, config: agentConfig };
}

// import { HumanMessage } from "@langchain/core/messages";
// import * as readline from "readline";

// /**
//  * Run the agent interactively based on user input
//  *
//  * @param agent - The agent executor
//  * @param config - Agent configuration
//  */
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// async function runChatMode(agent: any, config: any) {
//   console.log("Starting chat mode... Type 'exit' to end.");

//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   const question = (prompt: string): Promise<string> =>
//     new Promise(resolve => rl.question(prompt, resolve));

//   try {
//     // eslint-disable-next-line no-constant-condition
//     while (true) {
//       const userInput = await question("\nPrompt: ");

//       if (userInput.toLowerCase() === "exit") {
//         break;
//       }

//       const stream = await agent.stream({ messages: [new HumanMessage(userInput)] }, config);

//       for await (const chunk of stream) {
//         if ("agent" in chunk) {
//           console.log(chunk.agent.messages[0].content);
//         } else if ("tools" in chunk) {
//           console.log(chunk.tools.messages[0].content);
//         }
//         console.log("-------------------");
//       }
//     }
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error("Error:", error.message);
//     }
//     process.exit(1);
//   } finally {
//     rl.close();
//   }
// }

// // Start the agent
// if (require.main === module) {
//   console.log("Starting Agent...");
//   initializeAgent()
//     .then(({ agent, config }) => runChatMode(agent, config))
//     .catch(error => {
//       console.error("Fatal error:", error);
//       process.exit(1);
//     });
// }