
// Next.js Edge API Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/router-handlers#edge-and-nodejs-runtimes

import { InteractionResponseType, InteractionType } from 'discord-interactions';
import { NextResponse, type NextRequest } from 'next/server'
import { test } from './test';
import { agentkit } from './agentkit';
import { twitter } from './twitter';
import { createWallet } from './wallet/index';
import { autonome } from './autonome';
import { send } from './send';
import { covalent } from './covalent';
import { handleCovalentCommand } from './utils';

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
                await agentkit(channel_id, options, userId); // run in the background
                return NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: "The AgentKit is running",
                        flags: 64,
                    },
                });
            } else if (name === "agentkit_twitter") {
                await twitter(channel_id, options, userId);
                return NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: "The AgentKit is running",
                        flags: 64,
                    },
                });
            } else if (name === "autonome") {
                await autonome(channel_id, options, userId);
                return NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: "The Autonome is running",
                        flags: 64,
                    },
                });
            }
            else if (name === "wallet") {
                const response = await createWallet(userId); // Wait for wallet creation
                return response; // Return the response from createWallet
            }
            else if (name === "send") {
                const response = await send(channel_id, userId, options[0].value, options[1].value); // From, To, Amount
                return response;
            }
            else if (name === "ipfs") {
                return NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: "IPFS is running",
                        flags: 64,
                    },
                });
            }
            else if (name === "covalent") {
                if (options === undefined) {
                    const row = handleCovalentCommand();
                    return NextResponse.json({
                        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                            content: "Here are some options:",
                            components: [row],
                            ephemeral: true,
                        }
                    });
                } else {
                    await covalent(channel_id, options[0].value);
                    return NextResponse.json({
                        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                            content: "The Covalent is running",
                            flags: 64,
                        },
                    });
                }
            }
            else {
                return NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: "Command not found",
                        flags: 64,
                    },
                });
            }
        } else if (type === InteractionType.MESSAGE_COMPONENT) {
            const { custom_id } = data;
            let query = "";
            if (custom_id === "covalent_analyze_wallet") {
                query = "Analyze the token balances for address karanpargal.eth on eth-mainnet..."
            }
            else if (custom_id === "covalent_other_analysis") {
                query = "What NFTs does address karanpargal.eth own on eth-mainnet?..."
            }

            if (custom_id.startsWith("covalent_")) {
                await covalent(channel_id, query);
                return NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: "The Covalent is running",
                        flags: 64,
                    },
                });
            }
        } else if (type === InteractionType.MODAL_SUBMIT) {
        }
        else {
            return NextResponse.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: "Action not found",
                    flags: 64,
                },
            });
        }

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
