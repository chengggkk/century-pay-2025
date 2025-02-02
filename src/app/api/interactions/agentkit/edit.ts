export const edit = async (channel_id: string, id: string, content: string) => {
    const url = `https://discord.com/api/v10/channels/${channel_id}/messages/${id}`;

    const payload = {
        content: content,
    };

    await new Promise(resolve => setTimeout(resolve, 3000));
    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (response.ok) {
        console.log('Message edited successfully!');
    } else {
        console.error('Error editing message:', await response.text());
    }
}

export const sendMessage = async (channel_id: string, payload: any) => {
    const url = `https://discord.com/api/v10/channels/${channel_id}/messages`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (response.ok) {
        console.log('Message sent successfully!');
    } else {
        console.error('Error sending message:', await response.text());
    }

}

function splitContent(content: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < content.length) {
        // Find the slice's end point, starting with maxLength
        let endIndex = startIndex + maxLength;

        // If we exceed the string length, stop at the end of the content
        if (endIndex >= content.length) {
            chunks.push(content.slice(startIndex));
            break;
        }

        // Look for the nearest newline within the range of maxLength
        let newlineIndex = content.lastIndexOf("\n", endIndex);
        if (newlineIndex === -1 || newlineIndex < startIndex) {
            // If no newline is found or it's outside the current slice, just cut at maxLength
            newlineIndex = endIndex;
        }

        // Add the chunk and move the start index to the next part
        chunks.push(content.slice(startIndex, newlineIndex));
        startIndex = newlineIndex + 1;  // Move past the newline (if it exists)
    }

    return chunks;
}