import { BaseGoldRushTool, BaseGoldRushSchema } from "@covalenthq/ai-agent-sdk";
import { type Chain } from "@covalenthq/client-sdk";
import { z } from "zod";

export const HistoryDailyPortfolioSchema = BaseGoldRushSchema;

export type HistoryDailyPortfolioParams = z.infer<typeof HistoryDailyPortfolioSchema>;

export class HistoryDailyPortfolioTool extends BaseGoldRushTool {
    constructor(apiKey?: string) {
        super(
            "history",
            "Render a daily portfolio balance for an address broken down by the token. The timeframe is user-configurable, defaults to 30 days.",
            HistoryDailyPortfolioSchema,
            apiKey
        );
    }

    protected async fetchData(params: HistoryDailyPortfolioParams): Promise<string> {
        try {
            const { chain, address, } = params;
            const days = 15;
            const txs =
                await this.client.BalanceService.getHistoricalPortfolioForWalletAddress(
                    chain as Chain,
                    address,
                    {
                        quoteCurrency: "USD",
                        days: days,
                    }
                )

            if (txs.error) {
                throw new Error(txs.error_message);
            }

            return `Transactions for ${address} on ${chain} in last ${days} days: ${JSON.stringify(txs.data, this.bigIntReplacer)}`;
        } catch (error) {
            return `Error fetching transactions: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}