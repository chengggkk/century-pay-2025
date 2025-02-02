import { InteractionResponseType } from "discord-interactions";
import { NextResponse } from "next/server";
import { sendMessage } from "../agentkit/edit";

async function callAutonome(query: string) {
    const url = process.env.AUTONOME_URL;
    if (!url) {
        throw new Error("AUTONOME_URL is not set");
    }
    if (!process.env.AUTONOME_KEY) {
        throw new Error("AUTONOME_KEY is not set");
    }
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Basic ${process.env.AUTONOME_KEY}`
    };

    const body = JSON.stringify({
        text: query
    });

    try {
        const response = await fetch(url, {
            method: "POST",
            headers,
            body
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response:", data);
        return data;
    } catch (error) {
        console.error("Error sending message:", error);
        return error;
    }
}


export const autonome = async (channelId: string, options: any) => {
    const query = options[0].value;
    const response = await callAutonome(query);
    if (response.length > 0) {
        await sendMessage(channelId, { content: response[0].text });
    } else {
        await sendMessage(channelId, { content: "Autonome Error: " + response });
    }
};
