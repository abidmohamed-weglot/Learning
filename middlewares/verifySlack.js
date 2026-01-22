// middlewares/verifySlack.js
import getRawBody from "raw-body";
import crypto from "crypto";

// --- Vérification signature Slack --- (middleware) obligatoire pour les routes Slack et protections des webhook
export async function verifySlack(req, res, next) {
    try {
        const raw = await getRawBody(req);
        const timestamp = req.headers["x-slack-request-timestamp"];
        const slackSig = req.headers["x-slack-signature"];
        if (!timestamp || !slackSig) return res.status(400).send("Bad Request");
        if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 60 * 5) {
            return res.status(400).send("Ignore stale request");
        }
        const base = `v0:${timestamp}:${raw.toString("utf8")}`;
        const mySig =
        "v0=" +
        crypto
        .createHmac("sha256", process.env.SLACK_SIGNING_SECRET)
        .update(base)
        .digest("hex");
        if (!crypto.timingSafeEqual(Buffer.from(mySig), Buffer.from(slackSig))) {
            return res.status(401).send("Invalid signature");
        }
        const params = new URLSearchParams(raw.toString("utf8"));
        req.body = Object.fromEntries(params.entries());
        next();
    } catch (e) {
        console.error(e);
        return res.status(400).send("Bad Request");
    }
}