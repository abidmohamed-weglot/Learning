import express from "express";
import dotenv from "dotenv";
import { registerDebugRoutes } from "./utils/debugRoutes.js";
import { registerSlackRoutes } from "./routes/slack.js";
import { requiredEnv, envInt } from "./config/env.js";
import { makeSlackClient } from "./services/slack.js";

dotenv.config();

// --- Setup Express ---
const app = express();

const port = envInt("PORT", 4000);
requiredEnv("BOT_USER_TOKEN");
requiredEnv("SLACK_SIGNING_SECRET");


// -- Debug --

const DEBUG = "true";
function debugEnv(name) {
  const v = process.env[name];
  const present = !!(v && v !== "undefined" && v !== "null");
  const len = present ? String(v).length : 0;
  if (DEBUG) console.log(`[debug-env] ${name}: present=${present} length=${len}`);
}

if (DEBUG) {
  console.log("[debug] booting…");
  debugEnv("PORT");
  debugEnv("BOT_USER_TOKEN");
  debugEnv("SLACK_SIGNING_SECRET");
  debugEnv("SLACK_LEARNING_CHANNEL_ID");
  debugEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
  debugEnv("NOTION_API_KEY");
  debugEnv("NOTION_PARENT_PAGE_ID"); // ou NOTION_DATABASE_ID selon ton code
  debugEnv("ENABLE_DEBUG_ROUTES");
}

// --- Slack client (via service, sans toucher services/) ---
const slack = makeSlackClient();

// --- Debug routes (optionnel) ---
if (process.env.ENABLE_DEBUG_ROUTES === "true") {
  registerDebugRoutes(app);
}

// --- Slack routes ---
registerSlackRoutes(app, { slack });

// --- Start server ---
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
