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


export const autonome = async (channelId: string, options: any, userId: any) => {
    const query = options[0].value;
    const response = await callAutonome(query);
    console.log("response", response);
    if (response.text) {
        await sendMessage(channelId, { content: `**Autonome**: ${response.text}` });
    } else {
        await sendMessage(channelId, { content: "Autonome Error: " + response });
    }
};
