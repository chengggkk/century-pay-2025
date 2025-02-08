import { CdpAgentkit } from "../agentkit/cdp-agentkit-core";
import wallet from "../database/models/wallet";
import dotenv from "dotenv";
import dbConnect from "../database/connectdb/connectdb";
import { sendMessage } from "../agentkit/edit";
import { initializeAgent } from "../agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";

dotenv.config();

/**
 * Creates a new wallet for the user if they don’t already have one.
 * @param {string} userId - The Discord user ID.
 * @returns {NextResponse} - Response containing the wallet creation message.
 */
export const createWallet = async (channelId: string, userId: string) => {
  try {
    await dbConnect();

    // Check if the wallet already exists
    const existingWallet = await wallet.findOne({ user: userId });

    if (existingWallet) {
      const { agent, config } = await initializeAgent(userId);
      const stream = await agent.stream({
        messages: [new HumanMessage(`find the balance of this wallet ${existingWallet.wallet}
        return format message:
        You already have a wallet \n
        - 👛Your wallet address is: defaultAddressId
        - Balance: 0.00 ETH
        `)]
      }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          const response = chunk.agent.messages[0].content;
          console.log("agent", response);
          await sendMessage(channelId, {
            content: response,
          });
        } else if ("tools" in chunk) {
          const response = chunk.tools.messages[0].content;
          console.log("tools", response);
        }
      }
    } else {

      
      // Generate a new wallet using CDP AgentKit
      const agentkit = await CdpAgentkit.configureWithWallet({
        networkId: process.env.NETWORK_ID || "base-sepolia",
      });

      const generatedWallet = await agentkit.exportWallet();

      // Store the new wallet in MongoDB
      const newWallet = new wallet({
        user: userId,
        wallet: generatedWallet,
        network: "base-sepolia",
      });

      await newWallet.save();

      const { agent, config } = await initializeAgent(userId);
      const stream = await agent.stream({
        messages: [new HumanMessage(`the wallet has been created ${generatedWallet}
        return format message:
        Wallet created successfully \n
        - 👛Your wallet address is: defaultAddressId
        - Network: base-sepolia
        `)]
      }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          const response = chunk.agent.messages[0].content;
          console.log("agent", response);
          await sendMessage(channelId, {
            content: response,
          });
        } else if ("tools" in chunk) {
          const response = chunk.tools.messages[0].content;
          console.log("tools", response);
        }
      }
    }

  } catch (error) {
    console.error("❌ Error generating wallet:", error);
    return sendMessage(channelId, {
      content: "❌ Failed to generate a wallet. Please try again.",
      flags: 64,
    });
  }
};