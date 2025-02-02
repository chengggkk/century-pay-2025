import { CdpAgentkit } from "../agentkit/cdp-agentkit-core";
import mongoose from "mongoose";
import WalletModel from "../database/models/wallet";
import dotenv from "dotenv";
import { InteractionResponseType } from "discord-interactions";
import { NextResponse } from "next/server";

dotenv.config();

/**
 * Connects to MongoDB.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) return; // Prevent multiple connections

  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
}

/**
 * Checks if the user already has a wallet.
 * @param {string} userId - The Discord user ID.
 * @returns {Promise<boolean>} - `true` if no wallet exists, `false` if a wallet exists.
 */
const checkWallet = async (userId: string): Promise<boolean> => {
  try {
    await connectDB();

    // Find the user's wallet in MongoDB
    const wallet = await WalletModel.findOne({ user: userId }).lean().exec();

    return !wallet; // Returns true if no wallet exists, false otherwise
  } catch (error) {
    console.error("❌ Error checking wallet:", error);
    return false; // Assume false in case of an error
  }
};

/**
 * Creates a new wallet for the user if they don’t already have one.
 * @param {string} userId - The Discord user ID.
 * @returns {NextResponse} - Response containing the wallet creation message.
 */
export const createWallet = async (userId: string) => {
  if (!(await checkWallet(userId))) {
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "❌ You already have a wallet!",
        flags: 64, // Private response
      },
    });
  }

  try {
    await connectDB();

    // Generate a wallet using CDP AgentKit
    const agentkit = await CdpAgentkit.configureWithWallet({
      networkId: process.env.NETWORK_ID || "base-sepolia",
    });

    const generatedWallet = await agentkit.exportWallet();

    // Store wallet in MongoDB
    const newWallet = new WalletModel({
      user: userId,
      wallet: generatedWallet,
    });

    await newWallet.save();

    // Return response in required format
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