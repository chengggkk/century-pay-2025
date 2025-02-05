
import { SlashCommandBuilder } from "discord.js";
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

const SEND_COMMAND = {
    name: "send",
    description: "Send money to a user",
    type: 1, // CHAT_INPUT
    options: [
        {
            type: 3, // STRING
            name: "to",
            description: "User to send money to",
            required: true,
        },
        {
            type: 3, // STRING
            name: "amount",
            description: "Amount to send",
            required: true,
        },
    ],
};

const IPFS_COMMAND = {
    name: "ipfs",
    description: "Upload files to IPFS",
    options: [
        {
            type: 11, // ATTACHMENT
            name: "file",
            description: "Upload a file to IPFS",
            required: true,
        },
    ],
};
const COVALENT_COMMAND = new SlashCommandBuilder()
    .setName("covalent")
    .setDescription("Interact with Covalent")
    .addStringOption(option =>
        option.setName("prompt")
            .setDescription("Prompt to send to Covalent")
            .setRequired(false) // Optional because we have buttons
    );

const DEPLOYNFT_COMMAND = {
    name: "deploynft",
    description: "Deploy NFT",
    type: 1, // CHAT_INPUT
    options: [
        {
            type: 3, // STRING
            name: "name",
            description: "Name of the NFT",
            required: true,
        },

        {
            type: 3, // STRING
            name: "symbol",
            description: "Symbol of the NFT",
            required: true,
        },

        {
            type: 3, // STRING
            name: "metadata",
            description: "Metadata Link or CID of the NFT",
            required: true,
        }
    ],
}

const SENDNFT_COMMAND = {
    name: "sendnft",
    description: "Send NFT",
    type: 1, // CHAT_INPUT
    options: [
        {
            type: 3, // STRING
            name: "to_address",
            description: "User to send NFT to",
            required: true,
        },
        {
            type: 3, // STRING
            name: "contract_address",
            description: "Contract address of the NFT",
            required: true,
        },
        {
            type: 3, // STRING
            name: "token_id",
            description: "Token ID of the NFT",
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
    AUTONOME_COMMAND,
    SEND_COMMAND,
    IPFS_COMMAND,
    COVALENT_COMMAND,
    DEPLOYNFT_COMMAND,
    SENDNFT_COMMAND,
];

async function main() {
    await InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
}

main().then(() => {
    console.log("Commands installed successfully.");
}).catch((error) => {
    console.error("Failed to install commands: ", error);
});

