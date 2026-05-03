import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Command } from "commander";
import { existsSync } from "node:fs";
import { access } from "node:fs/promises";
import { createServer as createHttpServer, type Server } from "node:http";
import { basename, join, resolve } from "node:path";
import { WebSocketServer } from "ws";

import { initProject } from "./cli/init";
import { createBobRouter } from "./routes/bob";

dotenv.config();

type CreateServerOptions = {
  serveDashboard?: boolean;
};

export const createServer = (projectPath?: string, options: CreateServerOptions = {}) => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "@after/server" });
  });

  // Mount Bob routes if project path is provided
  if (projectPath) {
    dotenv.config({ path: join(projectPath, ".env"), override: true });
    app.use("/api/bob", createBobRouter(projectPath));
  }

  if (options.serveDashboard) {
    attachDashboard(app);
  }

  return app;
};

const attachDashboard = (app: express.Express): void => {
  const dashboardPath = findDashboardBuildPath();

  if (!dashboardPath) {
    app.get("/", (_request, response) => {
      response.status(503).send([
        "<!doctype html>",
        "<html><body style=\"font-family: system-ui; max-width: 720px; margin: 48px auto; line-height: 1.5;\">",
        "<h1>After dashboard is not built yet</h1>",
        "<p>Run <code>npm run build</code> inside the After workspace, then run <code>after launch .</code> again.</p>",
        "</body></html>",
      ].join(""));
    });
    return;
  }

  app.use(express.static(dashboardPath));
  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api/") || request.path === "/ws") {
      next();
      return;
    }

    response.sendFile(join(dashboardPath, "index.html"));
  });
};

const findDashboardBuildPath = (): string | null => {
  const candidates = [
    process.env.AFTER_DASHBOARD_DIST,
    resolve(process.cwd(), "apps", "ui", "dist"),
    resolve(__dirname, "..", "..", "..", "apps", "ui", "dist"),
  ].filter((value): value is string => Boolean(value));

  return candidates.find((candidate) => existsSync(join(candidate, "index.html"))) ?? null;
};

const hasProjectBrain = async (projectPath: string): Promise<boolean> => {
  try {
    await access(join(projectPath, "brain", "overview.md"));
    return true;
  } catch {
    return false;
  }
};

const listen = (
  projectPath: string,
  options: { port: string; serveDashboard?: boolean; initialize?: boolean },
): void => {
  const resolvedProjectPath = resolve(projectPath);
  const app = createServer(resolvedProjectPath, {
    serveDashboard: options.serveDashboard,
  });
  const server = createHttpServer(app);
  const port = Number(options.port);
  attachWebSocketServer(server);

  server.listen(port, () => {
    const baseUrl = `http://localhost:${port}`;
    console.log(`After is running at ${baseUrl}`);
    console.log(`API health: ${baseUrl}/api/health`);
    console.log(`Project: ${resolvedProjectPath}`);
    if (options.initialize) {
      console.log("Project Brain: ready");
    }
  });
};

export const attachWebSocketServer = (server: Server): WebSocketServer => {
  const websocketServer = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url !== "/ws") {
      socket.destroy();
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  websocketServer.on("connection", (websocket) => {
    websocket.send(
      JSON.stringify({
        id: `ws-${Date.now()}`,
        type: "milestone:reached",
        title: "Live connection established",
        summary: "Dashboard is receiving real-time updates from the After API server.",
        timestamp: new Date().toISOString(),
        source: "server:/ws",
      }),
    );
  });

  return websocketServer;
};

export const runCli = async (argv = process.argv): Promise<void> => {
  const program = new Command();

  program
    .name("after")
    .description("After MVP local-first developer journey tooling")
    .version("0.1.0");

  program
    .command("init")
    .argument("[projectPath]", "project path", ".")
    .option("-n, --name <projectName>", "project display name")
    .option("-p, --port <port>", "API port to use when you start After", process.env.PORT ?? "3000")
    .description("Initialize a local Project Brain")
    .action(async (projectPath: string, options: { name?: string; port: string }) => {
      const resolvedProjectPath = resolve(projectPath);
      const brainPath = await initProject(projectPath, {
        projectName: options.name,
      });
      console.log(`Project Brain initialized at ${brainPath}`);
      console.log(`Connected repository: ${resolvedProjectPath}`);
      console.log(`Start API: after start "${resolvedProjectPath}" -p ${options.port}`);
      console.log("Start dashboard: npm run dev --workspace=@after/ui");
      console.log("Open dashboard: http://localhost:5173");
    });

  program
    .command("start")
    .argument("[projectPath]", "project path", ".")
    .option("-p, --port <port>", "port", process.env.PORT ?? "3000")
    .description("Start the After API server")
    .action((projectPath: string, options: { port: string }) => {
      listen(projectPath, { port: options.port });
    });

  program
    .command("launch")
    .alias("up")
    .argument("[projectPath]", "project path", ".")
    .option("-n, --name <projectName>", "project display name")
    .option("-p, --port <port>", "port", process.env.PORT ?? "3000")
    .description("Initialize the current repo if needed and launch After with API and dashboard")
    .action(async (projectPath: string, options: { name?: string; port: string }) => {
      const resolvedProjectPath = resolve(projectPath);

      if (!(await hasProjectBrain(resolvedProjectPath))) {
        await initProject(resolvedProjectPath, {
          projectName: options.name ?? basename(resolvedProjectPath),
        });
      }

      listen(resolvedProjectPath, {
        port: options.port,
        serveDashboard: true,
        initialize: true,
      });
    });

  await program.parseAsync(argv);
};

if (require.main === module) {
  runCli().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
