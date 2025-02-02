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