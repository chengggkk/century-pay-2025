import { CdpAgentkit } from "../agentkit/cdp-agentkit-core";
import wallet from "../database/models/wallet";
import dotenv from "dotenv";
import { InteractionResponseType } from "discord-interactions";
import { NextResponse } from "next/server";
import dbConnect from "../database/connectdb/connectdb";
import transaction from "../database/models/transaction";

dotenv.config();

/**
 * Creates a new wallet for the user if they don’t already have one.
 * @param {string} fromId - The Discord user ID.
 * @param {string} ToId - The Discord user ID.
 * @returns {NextResponse} - Response containing the wallet creation message.
 */
export const send = async (fromId:string, ToId:string, amount:string) => {
  const cleanToId = ToId.replace(/[^0-9]/g, "");

  const amountINT = parseInt(amount);

  try {
    await dbConnect();

    // Check if the sender has a wallet
    const senderWallet = await wallet.findOne({ user: fromId });
    const receiverWallet = await wallet.findOne({ user: cleanToId });
    console.log(fromId, ToId, amount, cleanToId);
    if (!senderWallet) {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "❌ You don't have a wallet. Please create one first.",
          flags: 64,
        },
      });
    }
    else if (!receiverWallet) {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "❌ Receiver don't have a wallet. Please ask them to create one first.",
          flags: 64,
        },
      });
    }
    else if (senderWallet.balance < amount) {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "❌ You don't have enough balance to send this amount.",
          flags: 64,
        },
      });
    }
    else {
      const senderBalance = senderWallet.balance - amountINT;
      const receiverBalance = receiverWallet.balance + amountINT;

      await wallet.findOneAndUpdate({ user: fromId }, { balance: senderBalance });
      await wallet.findOneAndUpdate({ user: cleanToId }, { balance: receiverBalance });

      const newTransaction = new transaction({
        SenderId: fromId,
        ReceiverId: cleanToId,
        amount: amountINT,
        network: process.env.NETWORK_ID || "base-sepolia",
      });

      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `✅ Successfully sent ${amount} to <@${cleanToId}>.`,
        },
      });
    }
    
  } catch (error) {
    console.error("❌ Error generating wallet:", error);
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "❌ Failed to generate a wallet. Please try again.",
        flags: 64,
      },
    });
  }
};