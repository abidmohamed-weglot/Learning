import { WebClient } from "@slack/web-api";
import { requiredEnv } from "../config/env.js";

export function makeSlackClient() {
  return new WebClient(requiredEnv("BOT_USER_TOKEN"));
}
