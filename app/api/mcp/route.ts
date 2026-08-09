import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  listPublicSpeakers,
  getPublicSpeaker,
  listPublicTalks,
  getPublicTalk,
  getAgenda,
  listTracks,
  listSessionTypes,
  getEventOverview,
  searchPublic,
} from "@/lib/mcp-data";

// Public, unauthenticated, read-only — see PRETALX.md > MCP for the scope
// rationale. Excluded from the login gate in proxy.ts.
export const dynamic = "force-dynamic";

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function getServer() {
  const server = new McpServer({
    name: "devopsdays-lima-2026",
    version: "1.0.0",
    title: "DevOpsDays Lima 2026",
  });

  server.registerTool(
    "list_speakers",
    {
      title: "List speakers",
      description:
        "List confirmed DevOpsDays Lima 2026 speakers (public profile only: no contact info, ID, or t-shirt size).",
      inputSchema: {
        track: z.string().optional().describe("Filter by track name (partial match)"),
      },
    },
    async ({ track }) => json(await listPublicSpeakers({ track }))
  );

  server.registerTool(
    "get_speaker",
    {
      title: "Get speaker",
      description: "Get one confirmed speaker's public profile and their talks, by Pretalx code.",
      inputSchema: { code: z.string().describe("Speaker code, e.g. FLMCJF") },
    },
    async ({ code }) => {
      const speaker = await getPublicSpeaker(code);
      if (!speaker) return { content: [{ type: "text", text: `No speaker found for code "${code}".` }], isError: true };
      return json(speaker);
    }
  );

  server.registerTool(
    "list_talks",
    {
      title: "List talks",
      description:
        "List confirmed talks (Talk, Workshop, Panel, Demo session, Keynote). Excludes program blocks like registration/lunch — use get_agenda for the full-day schedule.",
      inputSchema: {
        track: z.string().optional().describe("Filter by track name (partial match)"),
        type: z.string().optional().describe('Filter by session type, e.g. "Keynote", "Workshop"'),
        tag: z.string().optional().describe('Filter by level tag, e.g. "Intermediate"'),
        day: z.string().optional().describe("Filter by date, YYYY-MM-DD"),
      },
    },
    async ({ track, type, tag, day }) => json(await listPublicTalks({ track, type, tag, day }))
  );

  server.registerTool(
    "get_talk",
    {
      title: "Get talk",
      description: "Get one confirmed talk's full details (description, speakers, schedule), by Pretalx code.",
      inputSchema: { code: z.string().describe("Talk code, e.g. SDMJ7R") },
    },
    async ({ code }) => {
      const talk = await getPublicTalk(code);
      if (!talk) return { content: [{ type: "text", text: `No confirmed talk found for code "${code}".` }], isError: true };
      return json(talk);
    }
  );

  server.registerTool(
    "get_agenda",
    {
      title: "Get agenda",
      description:
        "Full published schedule (confirmed talks and program blocks like registration/lunch), optionally filtered to one day.",
      inputSchema: {
        day: z.string().optional().describe("YYYY-MM-DD, e.g. 2026-08-27. Omit for both days."),
      },
    },
    async ({ day }) => json(await getAgenda(day))
  );

  server.registerTool(
    "list_tracks",
    {
      title: "List tracks",
      description: "List content tracks with how many confirmed talks are in each.",
    },
    async () => json(await listTracks())
  );

  server.registerTool(
    "list_session_types",
    {
      title: "List session types",
      description: "List session types (Talk, Workshop, Panel, Demo session, Keynote) with counts.",
    },
    async () => json(await listSessionTypes())
  );

  server.registerTool(
    "get_event_info",
    {
      title: "Get event info",
      description: "Event name, dates, timezone, and headline counts (speakers, confirmed talks).",
    },
    async () => json(await getEventOverview())
  );

  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Full-text search across confirmed talk titles/descriptions and speaker names/bios.",
      inputSchema: { query: z.string().describe("Free-text search query") },
    },
    async ({ query }) => json(await searchPublic(query))
  );

  return server;
}

async function handle(request: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport();
  const server = getServer();
  await server.connect(transport);
  return transport.handleRequest(request);
}

export { handle as GET, handle as POST, handle as DELETE };
