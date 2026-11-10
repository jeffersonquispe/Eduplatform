import "./lib/env.js";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listPublicAssets, readPublicAsset } from "./lib/assets.js";
import { getSiteMap } from "./lib/sitemap.js";
import { listPublishedCourses } from "./lib/courses.js";

const server = new McpServer({ name: "plataforma-cursos-mcp", version: "1.0.0" });

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

function jsonResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

server.registerTool(
  "list_public_assets",
  {
    title: "Listar assets publicos",
    description: "Lista los archivos dentro de la carpeta public/ del proyecto (rutas relativas y tamano en bytes).",
    inputSchema: {},
    annotations: READ_ONLY,
  },
  async () => jsonResult(listPublicAssets()),
);

server.registerTool(
  "read_public_asset",
  {
    title: "Leer asset publico",
    description:
      "Lee el contenido de un archivo dentro de public/. Rechaza cualquier ruta que intente salir de esa carpeta.",
    inputSchema: {
      path: z.string().describe('Ruta relativa a public/, p. ej. "next.svg"'),
    },
    annotations: READ_ONLY,
  },
  async ({ path: assetPath }) => {
    try {
      return jsonResult(readPublicAsset(assetPath));
    } catch (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
  },
);

server.registerTool(
  "get_site_map",
  {
    title: "Mapa de paginas del sitio",
    description:
      "Recorre src/app (App Router de Next.js) y devuelve las rutas de pagina y los endpoints de API, con el archivo que las define.",
    inputSchema: {},
    annotations: READ_ONLY,
  },
  async () => jsonResult(getSiteMap()),
);

server.registerTool(
  "list_published_courses",
  {
    title: "Cursos publicados",
    description:
      "Trae los cursos con status=published desde Supabase (anon key), solo con columnas publicas: id, title, description, rating_avg, rating_count, created_at, categoria e instructor.",
    inputSchema: {
      category: z.string().optional().describe("Slug de categoria para filtrar, p. ej. \"marketing-digital\""),
      limit: z.number().int().positive().max(100).optional().describe("Maximo de cursos a devolver (por defecto todos)"),
    },
    annotations: READ_ONLY,
  },
  async ({ category, limit }) => {
    try {
      return jsonResult(await listPublishedCourses({ category, limit }));
    } catch (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
