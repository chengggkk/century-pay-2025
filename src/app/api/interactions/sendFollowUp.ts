import axios from 'axios';
import dotenv from 'dotenv';

/**
 * Sends a follow-up message after deferred response.
 * @param {string} interactionToken - The interaction token from Discord.
 * @param {string} content - The message content to send.
 */


dotenv.config();

export async function sendFollowUpMessage(interactionToken: string, content: string) {
    try {
        await axios.post(`https://discord.com/api/v10/webhooks/${process.env.CLIENT_ID}/${interactionToken}`, {
            content: content
        });
    } catch (error) {
        console.error("Error sending follow-up message:", error);
    }
}