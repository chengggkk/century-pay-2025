import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";

// Define the prompt for the sign message action
export const IPFS_UPLOAD_PROMPT = `
this function requires a image url to upload to ipfs
`;

// Define the input schema using Zod
export const IpfsInput = z
    .object({
        url: z.string().describe("the url for image to upload"),
    })
    .strip()
    .describe("Instructions for uploading image to ipfs");

/**
 * Signs a message using EIP-191 message hash from the wallet
 *
 * @returns The message and corresponding signature
 */
export async function ipfsUpload(
    args: z.infer<typeof IpfsInput>,
): Promise<string> {
    try {
        console.log(`📥 Downloading file from: ${args.url}`);
        const url = 'https://ipfs.infura.io:5001/api/v0/add';

        // Step 1: Download file from Discord
        const fileResponse = await axios.get(args.url, { responseType: "arraybuffer" });
        const fileBuffer = Buffer.from(fileResponse.data);

        // Step 2: Prepare the file for Infura
        const formData = new FormData();
        formData.append("file", fileBuffer, "nft_upload.png");

        // Step 3: Upload to Infura
        console.log(`🚀 Uploading to IPFS via Infura...`);
        const response = await axios.post(url, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Basic ${Buffer.from(`${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`).toString("base64")}`,
            },
        });

        // Step 4: Get IPFS Hash
        const ipfsHash = response.data.Hash;
        const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

        console.log(`✅ Uploaded to IPFS: ${ipfsUrl}`);
        return ipfsUrl;

    } catch (error) {
        console.error("❌ Error uploading to IPFS:", error);
        return `error: ${error}`;
    }

}
