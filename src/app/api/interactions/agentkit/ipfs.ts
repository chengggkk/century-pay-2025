import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";

// Load environment variables
dotenv.config();

// Define the prompt for the sign message action
export const IPFS_UPLOAD_PROMPT = `
This function requires an image URL to upload to IPFS along with a JSON metadata file.
`;

// Define the input schema using Zod
export const IpfsInput = z
  .object({
    url: z.string().describe("The URL for the image to upload"),
  })
  .strip()
  .describe("Instructions for uploading image and metadata to IPFS");

/**
 * Uploads an image and its metadata JSON to IPFS.
 *
 * The metadata JSON is wrapped in a directory with the file name "0"
 * so that it can be accessed at: 
 *   https://ipfs.io/ipfs/<directoryCID>/0
 *
 * @returns The IPFS URLs for the image and metadata JSON.
 */
export async function ipfsUpload(
  args: z.infer<typeof IpfsInput>,
): Promise<string> {
  try {
    const { url } = args;
    let tokenId = 0;  // Example tokenId

    console.log(`📥 Downloading image from: ${url}`);

    // Step 1: Download the image file
    const fileResponse = await axios.get(url, { responseType: "arraybuffer" });
    const fileBuffer = Buffer.from(fileResponse.data);

    // Step 2: Upload the image to IPFS via Pinata
    const imageFormData = new FormData();
    imageFormData.append("file", fileBuffer, "nft_upload.png");

    console.log(`🚀 Uploading image to IPFS via Pinata...`);
    const imageUploadResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      imageFormData,
      {
        maxContentLength: Infinity,
        headers: {
          ...imageFormData.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    const imageCid = imageUploadResponse.data.IpfsHash;
    const imageIpfsUrl = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
    console.log(`✅ Image uploaded to IPFS: ${imageIpfsUrl}`);

    // Step 3: Create metadata JSON
    const metadata = {
      attributes: [
        { trait_type: "Background", value: "Purple" },
        { trait_type: "Skin", value: "Mint" },
        { trait_type: "Body", value: "Hoodie Pink" },
        { trait_type: "Face", value: "Winking" },
        { trait_type: "Head", value: "Wizard Hat" },
      ],
      description: "A collection of 8888 Cute Chubby Pudgy Penguins sliding around on the freezing ETH blockchain.",
      image: `ipfs://${imageCid}`,
      name: `Pudgy Penguin #${tokenId}`
    };

    // Step 4: Prepare metadata JSON for Pinata upload in a folder
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const folderFormData = new FormData();

    // Use the correct filepath to ensure it's inside a folder named by tokenId
    folderFormData.append('file', metadataBuffer, {
      filepath: `${tokenId}/${tokenId}`,  // This will create a folder named '1' with 'metadata.json' inside
    });

    console.log(`🚀 Uploading folder with metadata JSON to IPFS via Pinata...`);
    const folderUploadResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      folderFormData,
      {
        maxContentLength: Infinity,
        headers: {
          ...folderFormData.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    const folderCid = folderUploadResponse.data.IpfsHash;
    const metadataIpfsUrl = `https://gateway.pinata.cloud/ipfs/${folderCid}/`;
    console.log(`✅ Metadata JSON uploaded to IPFS in folder: ${metadataIpfsUrl}`);

    // Return the final folder structure link
    return `Image IPFS URL: ${imageIpfsUrl}\nMetadata IPFS URL: ${metadataIpfsUrl} \n deploy NFTs: `;

  } catch (error) {
    console.error("❌ Error uploading to IPFS:", (error as any).response ? (error as any).response.data : error);
    return `error: ${error}`;
  }
}