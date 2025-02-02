import { CdpAgentkit } from "../agentkit/cdp-agentkit-core";
import wallet from "../database/models/wallet";
import dotenv from "dotenv";
import { InteractionResponseType } from "discord-interactions";
import { NextResponse } from "next/server";
import dbConnect from "../database/connectdb/connectdb";

dotenv.config();

/**
 * Creates a new wallet for the user if they don’t already have one.
 * @param {string} userId - The Discord user ID.
 * @returns {NextResponse} - Response containing the wallet creation message.
 */
export const createWallet = async (userId: string) => {
  try {
    await dbConnect();

    // Check if the wallet already exists
    const existingWallet = await wallet.findOne({ user: userId });

    if (existingWallet) {
      // Return the existing wallet address
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Already have a wallet \n 👛Your wallet address is: \`${existingWallet.wallet}\``,
          flags: 64, // Private respons
        },
      });
    }

    // Generate a new wallet using CDP AgentKit
    const agentkit = await CdpAgentkit.configureWithWallet({
      networkId: process.env.NETWORK_ID || "base-sepolia",
    });

    const generatedWallet = await agentkit.exportWallet();

    // Store the new wallet in MongoDB
    const newWallet = new wallet({
      user: userId,
      wallet: generatedWallet,
    });

    await newWallet.save();

    // Return response with the newly created wallet address
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Your wallet has been created: \`${generatedWallet}\``,
        flags: 64, // Private response
      },
    });
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