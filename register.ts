
import dotenv from "dotenv";
dotenv.config();

async function DiscordRequest(endpoint: string, options: any) {
    const url = "https://discord.com/api/v10/" + endpoint;
    if (options.body) options.body = JSON.stringify(options.body);
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            "Content-Type": "application/json; charset=UTF-8",
            "User-Agent":
                "DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)",
        },
        ...options,
    });
    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    return res;
}


async function InstallGlobalCommands(appId: string | undefined, commands: any) {
    if (!appId) {
        throw new Error("APP_ID is not set");
    }
    const endpoint = `applications/${appId}/commands`;
    try {
        await DiscordRequest(endpoint, { method: "PUT", body: commands });
    } catch (err) {
        console.error(err);
    }
}

// Define commands
const TEST_COMMAND = {
    name: "test",
    description: "Basic command",
    type: 1, // CHAT_INPUT
};

const AGENTKIT_COMMAND = {
    name: "agentkit",
    description: "Interact with the agentkit",
    type: 1, // CHAT_INPUT
    options: [
        {
            type: 3, // STRING
            name: "prompt",
            description: "Prompt to send to the agentkit",
            required: true,
        },
    ],
};

const TWITTER_COMMAND = {
    name: "agentkit_twitter",
    description: "Interact with the agentkit and publish to twitter",
    type: 1, // CHAT_INPUT
    options: [
        {
            type: 3, // STRING
            name: "prompt",
            description: "Prompt to send to the agentkit to generate a tweet",
            required: true,
        },
    ],
};

const WALLET_COMMAND = {
    name: "wallet",
    description: "Create a new wallet",
    type: 1, // CHAT_INPUT
};

const AUTONOME_COMMAND = {
    name: "autonome",
    description: "Interact with the autonome",
    type: 1, // CHAT_INPUT
    options: [
        {
            type: 3, // STRING
            name: "prompt",
            description: "Prompt to send to the autonome",
            required: true,
        },
    ],
};

// Update command list
const ALL_COMMANDS = [
    TEST_COMMAND,
    AGENTKIT_COMMAND,
    TWITTER_COMMAND,
    WALLET_COMMAND,
    AUTONOME_COMMAND
];

async function main() {
    await InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
}

main().then(() => {
    console.log("Commands installed successfully.");
}).catch((error) => {
    console.error("Failed to install commands: ", error);
});
