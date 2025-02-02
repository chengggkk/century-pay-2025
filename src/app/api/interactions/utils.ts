
// Function to handle the command
export function handleCovalentCommand() {
    // Create buttons
    const row = {
        "type": 1,
        "components": [
            {
                "type": 2,
                "custom_id": "covalent_analyze_wallet",
                "label": "Analyze the token balances for address karanpargal.eth on eth-mainnet...",
                "style": 1
            },
            {
                "type": 2,
                "custom_id": "covalent_other_analysis",
                "label": "What NFTs does address karanpargal.eth own on eth-mainnet?...",
                "style": 2
            },
        ]
    }

    return row;
}

export function covalentPromptModal() {
    const modal = {
        "type": 1,
        "components": [
            {
                "type": 4,
                "custom_id": "covalent_user_input_text",
                "label": "Your Prompt",
                "style": 1,
                "min_length": 5,
                "max_length": 500,
                "placeholder": "Type your prompt here...",
                "required": true
            }
        ]
    }

    return modal;
}

export const processingMessage = {
    // content: "⏳ Processing your request... Please wait!",
    embeds: [
        {
            title: "⏳ Processing your request... Please wait!",
            description: "We're working on your request. This may take a few seconds.",
            color: 0x3498db, // Blue color
            footer: {
                text: "Powered by Century Pay 2025 🚀",
            },
        },
    ],
    flags: 64,
}