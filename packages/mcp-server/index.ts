import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { prisma } from "db";
import { ScraperManager } from "./scrapers/manager.js";

const scraperManager = new ScraperManager();

const server = new Server(
  {
    name: "dataharvest-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_target_sites",
        description: "監視対象のWebサイトリストをDBから取得します。",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "scrape_site_content",
        description: "指定したURLのWebサイトをスクレイピングし、テキストを抽出します。scraperIdが指定されている場合は専用スクリプトを使用します。",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "スクレイピング対象のURL" },
            scraperId: { type: "string", description: "使用するスクレイパーの識別子（任意）" },
          },
          required: ["url"],
        },
      },
      {
        name: "save_update_log",
        description: "Webサイトのチェック結果（変更の有無、要約、現在のコンテンツ）をDBに保存します。",
        inputSchema: {
          type: "object",
          properties: {
            siteId: { type: "number", description: "サイトのID" },
            hasChange: { type: "boolean", description: "前回から重要な変更があったか" },
            summary: { type: "string", description: "AIによる変更内容の要約" },
            fullContent: { type: "string", description: "今回取得したコンテンツ全体（比較用）" },
          },
          required: ["siteId", "hasChange", "summary"],
        },
      },
    ],
  };
});

/**
 * Handle tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_target_sites": {
        const sites = await prisma.site.findMany();
        return {
          content: [{ type: "text", text: JSON.stringify(sites, null, 2) }],
        };
      }

      case "scrape_site_content": {
        const { url, scraperId } = args as { url: string; scraperId?: string };
        const result = await scraperManager.scrape(url, scraperId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "save_update_log": {
        const { siteId, hasChange, summary, fullContent } = args as {
          siteId: number;
          hasChange: boolean;
          summary: string;
          fullContent?: string;
        };

        const log = await prisma.updateLog.create({
          data: {
            siteId,
            hasChange,
            summary,
            fullContent,
          },
        });

        await prisma.site.update({
          where: { id: siteId },
          data: { lastCheckedAt: new Date() },
        });

        return {
          content: [{ type: "text", text: `Log saved for site ${siteId}. Log ID: ${log.id}` }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("DataHarvest MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
