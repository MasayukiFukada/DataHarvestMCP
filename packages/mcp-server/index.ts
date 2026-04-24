import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { prisma } from "db";

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
        name: "check_all_sites",
        description: "巡回の定型作業: 全登録サイトのHTML取得・変更検知・保存をまとめて実行する。初回は過去ログなしでチェックし、結果を返す。",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_target_sites",
        description: "Fetch a list of registered websites to monitor for updates.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "scrape_site_content",
        description: "Fetches the HTML content of a specific site and extracts text for analysis.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL of the website to scrape." },
          },
          required: ["url"],
        },
      },
      {
        name: "save_update_log",
        description: "Saves the analysis result of a website check into the database.",
        inputSchema: {
          type: "object",
          properties: {
            siteId: { type: "number", description: "The ID of the site being checked." },
            hasChange: { type: "boolean", description: "Whether any significant change was detected." },
            summary: { type: "string", description: "A concise summary of the changes or the current state." },
            fullContent: { type: "string", description: "The content observed during this check for future comparison." },
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
const scrape = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const html = await response.text();
  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10000);
};

const detectChange = (current: string, previous: string | null): boolean => {
  if (!previous) return false;
  return current !== previous;
};

const buildResult = (sites: any[], results: any[], logs: any[]): string => {
  const lines = sites.map((site, i) => {
    const r = results[i];
    const log = logs[i];
    return `## ${site.title} (id:${site.id})\n- URL: ${site.url}\n- 変化: ${r.hasChange ? "あり" : "なし"}\n- 要約: ${log.summary}`;
  }).join("\n\n");
  return `巡回去了完了:${sites.length}件\n${lines}`;
};

server.setRequestHandler(CallToolRequestSchema, async () => {
  const sites = await prisma.site.findMany();
  const lastLogs = await Promise.all(
    sites.map((s) => prisma.updateLog.findFirst({ where: { siteId: s.id }, orderBy: { createdAt: "desc" } }))
  );
  const htmls = await Promise.allSettled(sites.map((s) => scrape(s.url)));
  const results = await Promise.all(
    sites.map(async (site, i) => {
      const html = htmls[i];
      if (html.status === "rejected") return { site, html: null, hasChange: false };
      const prev = lastLogs[i]?.fullContent ?? null;
      return { site, html: html.value, hasChange: detectChange(html.value, prev) };
    })
  );
  const logs = await Promise.all(
    results.map((r) =>
      prisma.updateLog.create({
        data: {
          siteId: r.site.id,
          hasChange: r.hasChange,
          summary: r.html ? `(${r.hasChange ? "変化あり" : "変化なし"}) ${r.html.slice(0, 200)}` : "取得エラー",
          fullContent: r.html ?? null,
        },
      })
    )
  );
  await Promise.all(sites.map((s) => prisma.site.update({ where: { id: s.id }, data: { lastCheckedAt: new Date() } })));
  return { content: [{ type: "text", text: buildResult(sites, results, logs) }] };
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
