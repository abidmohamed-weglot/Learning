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
