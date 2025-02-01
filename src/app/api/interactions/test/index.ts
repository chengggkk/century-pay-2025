import { InteractionResponseType } from "discord-interactions";
import { NextResponse } from "next/server";

export const test = (userId: string) => {
    return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: "hello world " + userId,
            flags: 64,
        },
    });
};
