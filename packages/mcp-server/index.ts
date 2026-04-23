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
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_target_sites": {
      const sites = await prisma.site.findMany();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(sites, null, 2),
          },
        ],
      };
    }

    case "scrape_site_content": {
      const { url } = request.params.arguments as { url: string };
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const html = await response.text();
        
        // Simple text extraction (stripping scripts and styles)
        // Note: For better results, use cheerio or a similar library.
        const cleanContent = html
          .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
          .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 10000); // Limit to avoid hitting token limits

        return {
          content: [
            {
              type: "text",
              text: cleanContent,
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error scraping site: ${error.message}`,
            },
          ],
        };
      }
    }

    case "save_update_log": {
      const { siteId, hasChange, summary, fullContent } = request.params.arguments as any;
      
      const log = await prisma.updateLog.create({
        data: {
          siteId,
          hasChange,
          summary,
          fullContent,
        },
      });

      // Update the lastCheckedAt field of the site
      await prisma.site.update({
        where: { id: siteId },
        data: { lastCheckedAt: new Date() },
      });

      return {
        content: [
          {
            type: "text",
            text: `Log saved successfully (ID: ${log.id})`,
          },
        ],
      };
    }

    default:
      throw new Error("Tool not found");
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
