
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
import { ipfs } from './ipfs';
import { deplotnft } from './deployNFT';
import { mintNFT } from './mintNFT';
import { sendNFT } from './sendNFT';
import { processingMessage } from "./utils";
import { zkDeposit } from './zk_deposit';
import { zkWithdraw } from './zk_withdraw';

require('dotenv').config();

// export const runtime = 'edge'

export async function POST(request: NextRequest) {
    try {
        const res = await request.json();
        const { type, data, member, user, channel_id } = res;
        if (type === InteractionType.PING) {
            return new Response(JSON.stringify({ type: InteractionResponseType.PONG }));
        }
        const userId = member?.user?.id || user?.id;

        if (type === InteractionType.APPLICATION_COMMAND) {
            const { name, options, custom_id, id, resolved } = data;

            if (name === "test") {
                return test(userId);
            } else if (name === "agentkit") {
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await agentkit(channel_id, options, userId);
                })();
                return initialResponse
            } else if (name === "agentkit_twitter") {
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await twitter(channel_id, options, userId);
                })();
                return initialResponse
            } else if (name === "autonome") {
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await autonome(channel_id, options, userId);
                })();
                return initialResponse
            }
            else if (name === "wallet") {
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await createWallet(userId);
                })();
                return initialResponse;
            }
            else if (name === "send") {
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await send(channel_id, userId, options[0].value, options[1].value);
                })();
                return initialResponse;
            }
            else if (name === "ipfs") {
                console.log(resolved.attachments[`${options[0].value}`].url);
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await ipfs(channel_id, userId, resolved.attachments[`${options[0].value}`].url);
                })();
                return initialResponse;
            } else if (name === "covalent") {
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
                        data: processingMessage,
                    });
                }
            }

            else if (name === "deploynft") {
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await deplotnft(channel_id, userId, options[0].value, options[1].value, options[2].value);
                })();
                return initialResponse;
            }

            else if (name === "sendnft") {
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await sendNFT(channel_id, userId, options[0].value, options[1].value, options[2].value);
                })();
                return initialResponse;
            }
            else if (name === "zk_deposit") {
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await zkDeposit(channel_id, userId, options[0].value, options[1].value);
                })();
                return initialResponse;
            }
            else if (name === "zk_withdraw") {
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await zkWithdraw(channel_id, userId);
                })();
                return initialResponse;
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
            else if (custom_id === "covalent_history_daily_portfolio") {
                query = "Get daily profolio balance for an address karanpargal.eth for the last 15 days..."
            }

            if (custom_id.startsWith("covalent_")) {
                await covalent(channel_id, query);
                return NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
            }

            if (custom_id.startsWith("mint_")) {
                const contractAddress = custom_id.split("_")[1];
                const initialResponse = NextResponse.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: processingMessage,
                });
                (async () => {
                    await mintNFT(channel_id, userId, contractAddress);
                })();
                return initialResponse
            }


        } else if (type === InteractionType.MODAL_SUBMIT) {
            return NextResponse.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: "Not implemented",
                    flags: 64,
                },
            });
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
