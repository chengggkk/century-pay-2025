import { z } from "zod";
import fs from 'fs';
import { exec } from 'child_process';

function writeToFile(args) {
    const inputs = { a: args.a, b: args.b };

    // Convert the inputs object to a JSON string
    const data = JSON.stringify(inputs, null, 2); // Pretty-print with 2 spaces

    // Write the data to a file (replace 'input.json' with your desired filename)
    fs.writeFile('input.json', data, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return;
        }

        console.log('Data written to file successfully!');
    });
}


// Define the prompt for the snarkjs action
export const SNARKJS_PROMPT = `
This tool will generate a proof for a given data using snarkjs.
`;

// Define the input schema using Zod
export const SnarkjsInput = z
    .object({
        a: z.string().describe("The first data. e.g. `3`"),
        b: z.string().describe("The second data. e.g. `5`"),
    })
    .strip()
    .describe("Instructions for generating a proof using snarkjs");

/**
 * Generates a proof using snarkjs
 *
 * @param args - The input arguments for the action
 * @returns The message and corresponding signature
 */
export async function generateSnarkjsProof(
    args: z.infer<typeof SnarkjsInput>,
): Promise<string> {
    writeToFile(args);
    return new Promise((resolve, reject) => {
        exec(
            "npx snarkjs g16f input.json public/multiplier2.wasm public/multiplier2_final.zkey proof.json public.json",
            (error, stdout, stderr) => {
                if (error) {
                    console.log(`Error: ${error.message}`);
                    reject(error);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    reject(new Error(stderr));
                    return;
                }
                console.log(`stdout: ${stdout}`);

                try {
                    const proof = fs.readFileSync("proof.json", "utf8").replace(/\n/g, "").replace(/\\"/g, '"');
                    const publicSignals = fs.readFileSync("public.json", "utf8").replace(/\n/g, "").replace(/\\"/g, '"');

                    // Cleanup files
                    fs.unlinkSync("proof.json");
                    fs.unlinkSync("public.json");
                    fs.unlinkSync("input.json");

                    resolve(`**Proof**: \n \`\`\`json\n${proof}\n\`\`\` \n **Public Signals**: \n \`\`\`json\n${publicSignals}\n\`\`\``);
                } catch (fileError) {
                    reject(fileError);
                }
            }
        );
    });

}