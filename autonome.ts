import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeAgentWithWallet } from "./src/app/api/interactions/agentkit/agent";
import { HumanMessage } from "@langchain/core/messages";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

app.get("/api/data", (req, res) => {
    res.json({ message: "Hello from the backend!" });
});

app.post("/chat", async (req, res) => {
    console.log("env", process.env.WALLET_DATA, process.env.MNEMONIC_PHRASE);
    console.log("req.body", req.body);
    const walletData = process.env.WALLET_DATA;
    const mnemonicPhrase = process.env.MNEMONIC_PHRASE;
    if (!walletData && !mnemonicPhrase) {
        res.json({ text: "Wallet data or mnemonic phrase not found" });
        return;
    }
    let agent, config;
    if (mnemonicPhrase) {
        const result = await initializeAgentWithWallet(undefined, mnemonicPhrase);
        agent = result.agent;
        config = result.config;
    } else {
        const result = await initializeAgentWithWallet(walletData);
        agent = result.agent;
        config = result.config;
    }
    const stream = await agent.stream({
        messages: [new HumanMessage(`${req.body}`)]
    }, config);
    let finalResponse = "";
    for await (const chunk of stream) {
        if ("agent" in chunk) {
            const response = chunk.agent.messages[0].content;
            console.log("agent", response);
            finalResponse += response;

        } else if ("tools" in chunk) {
            const response = chunk.tools.messages[0].content;
            finalResponse += response;
        }
    }
    res.json({ text: finalResponse });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
