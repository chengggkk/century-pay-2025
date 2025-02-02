
// Next.js Edge API Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/router-handlers#edge-and-nodejs-runtimes

import { InteractionResponseType, InteractionType } from 'discord-interactions';
import { NextResponse, type NextRequest } from 'next/server'
import { test } from './test';
import { agentkit } from './agentkit';
import { createWallet } from './wallet/index';

// export const runtime = 'edge'

export async function POST(request: NextRequest) {
    try {
        const res = await request.json();
        const { type, data, member, user, channel_id } = res;
        if (type === InteractionType.PING) {
            return new Response(JSON.stringify({ type: InteractionResponseType.PONG }));
        }

        if (type === InteractionType.APPLICATION_COMMAND) {
            const { name, options, custom_id, id } = data;
            const userId = member?.user?.id || user?.id;

            if (name === "test") {
                return test(userId);
            } else if (name === "agentkit") {
                await agentkit(channel_id, options); // run in the background
                return NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: "The AgentKit is running",
                        flags: 64,
                    },
                });
            }
            else if (name === "wallet") {
                const response = await createWallet(userId); // Wait for wallet creation
                return response; // Return the response from createWallet
            }
        }

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
