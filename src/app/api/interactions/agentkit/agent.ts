import { CdpAgentkit } from "./cdp-agentkit-core";
import { CdpTool, CdpToolkit } from "./cdp-langchain";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { SIGN_MESSAGE_PROMPT, signMessage } from "./sign";
import dbConnect from "../database/connectdb/connectdb";
import walletModel from "../database/models/wallet";
import { IPFS_UPLOAD_PROMPT, IpfsInput, ipfsUpload } from "./ipfs";
import { ZkDepositAction } from "./zk/deposit";
import { ZkWithdrawAction } from "./zk/withdraw";


// dotenv.config();

/**
 * Initialize the agent with CDP AgentKit
 * @param userId - The user ID
 * @returns Agent executor and config
 */
export async function initializeAgent(userId: string) {
  await dbConnect();
  let walletDataStr: string = "";

  try {
    const walletData = await walletModel.findOne({ user: userId }); // Use walletModel instead of wallet
    if (walletData) {
      console.log("Wallet data found:", walletData);
      walletDataStr = walletData.wallet; // Assuming 'wallet' is the field containing the wallet address
    }
    else {
      // Generate a new wallet using CDP AgentKit
      const agentkit = await CdpAgentkit.configureWithWallet({
        networkId: process.env.NETWORK_ID || "base-sepolia",
      });

      const generatedWallet = await agentkit.exportWallet();

      // Store the new wallet in MongoDB
      const newWallet = new walletModel({
        user: userId,
        wallet: generatedWallet,
      });

      await newWallet.save();
      walletDataStr = generatedWallet;
      console.log("New wallet created:", walletDataStr);
    }
  } catch (error) {
    console.error("Error fetching wallet data:", error);
  }

  return initializeAgentWithWallet(walletDataStr);
}

export async function initializeAgentWithWallet(walletDataStr?: string, mnemonicPhrase?: string) {
  // Initialize LLM
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
  });
  // Configure CDP AgentKit
  const config = {
    cdpWalletData: walletDataStr,
    mnemonicPhrase: mnemonicPhrase,
    networkId: process.env.NETWORK_ID || "base-sepolia",
  };

  // Initialize CDP AgentKit
  const agentkit = await CdpAgentkit.configureWithWallet(config);
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
  const ipfsUploadTool = new CdpTool(
    {
      name: "ipfs_upload",
      description: IPFS_UPLOAD_PROMPT,
      argsSchema: IpfsInput,
      func: ipfsUpload,
    },
    agentkit,
  );
  const zkDepositTool = new CdpTool(
    new ZkDepositAction(),
    agentkit,
  );
  const zkWithdrawTool = new CdpTool(
    new ZkWithdrawAction(),
    agentkit,
  );

  tools.push(signMessageTool);
  tools.push(ipfsUploadTool);
  tools.push(zkDepositTool);
  tools.push(zkWithdrawTool);

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

  return { agent, config: agentConfig, walletDataStr };
}