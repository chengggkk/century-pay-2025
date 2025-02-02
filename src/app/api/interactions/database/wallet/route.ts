import dbConnect from "../connectdb/connectdb";
import wallet from "../models/wallet";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const walletAddress = req.nextUrl.searchParams.get("wallet");

    if (!walletAddress) {
        return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    try {
        await dbConnect();
        const walletData = await wallet.findOne({ wallet: walletAddress });

        if (!walletData) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        return NextResponse.json(walletData);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { wallet: walletAddress, balance, network } = body;

        if (!walletAddress || !balance || !network) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();
        const res = await wallet.updateOne(
            { wallet: walletAddress },
            { balance, network }
        );

        if (res.modifiedCount === 0) {
            return NextResponse.json({ error: "Wallet not found or no changes made" }, { status: 404 });
        }

        return NextResponse.json({ success: true, updated: res.modifiedCount });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}