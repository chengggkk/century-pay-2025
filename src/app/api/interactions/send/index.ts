import { CdpAgentkit } from "../agentkit/cdp-agentkit-core";
import WalletModel from "../database/models/wallet";
import dotenv from "dotenv";
import { InteractionResponseType } from "discord-interactions";
import { NextResponse } from "next/server";
import dbConnect from "../database/connectdb/connectdb";
import transaction from "../database/models/transaction";
import { GetBalanceInput, getBalance } from "../agentkit/cdp-agentkit-core/actions/cdp/get_balance";
import { get } from "http";
import { agentkit } from "../agentkit";
import { initializeAgent } from "../agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessage } from "../agentkit/edit";
import { processingMessage } from "../utils";

dotenv.config();

/**
 * Creates a new wallet for the user if they don’t already have one.
 * @param {string} fromId - The Discord user ID.
 * @param {string} ToId - The Discord user ID.
 * @returns {NextResponse} - Response containing the wallet creation message.
 */
export const send = async (channelId: string, fromId: string, ToId: string, amount: string) => {
  const cleanToId = ToId.replace(/[^0-9]/g, "");
  const amountFloat = parseFloat(amount);

  try {
    await sendMessage(channelId, processingMessage);
    console.log(fromId, ToId, amount);
    await dbConnect();
    const result = await WalletModel.findOne({ user: cleanToId });
    console.log(result);
    if (!result) {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `User not found`,
          flags: 64, // Private response
        },
      });
    }
    const { defaultAddressId } = JSON.parse(result.wallet);
    const { agent, config } = await initializeAgent(fromId);
    const stream = await agent.stream({ messages: [new HumanMessage(`send ${amountFloat} ETH to ${defaultAddressId}`)] }, config);
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