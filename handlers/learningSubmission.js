import { DateTime } from "luxon";
import { createGCalEvent } from "../services/google-calendar.js";
import { createNotionLearning } from "../services/notion.js";
import { scheduleLearningReminders } from "../services/reminder.js";


const isUrl = (s) => /^https?:\/\/\S+$/i.test(s);

export async function handleLearningSubmission(payload, res, { slack }) {
  const pv = payload.view.state.values;

  const who = pv["who_block"]["who_input"].selected_user;
  const what = pv["what_block"]["what_input"].value?.trim();
  const when = pv["when_block"]["when_input"].selected_date;
  const desc = pv["desc_block"]["desc_input"].value?.trim();
  const resrc = pv["res_block"]?.["res_input"]?.value?.trim() || "";

  // validations Slack
  const errors = {};
  if (!what) errors["what_block"] = "Nom requis";
  if (!when) errors["when_block"] = "Date requise";
  if (resrc && !isUrl(resrc)) errors["res_block"] = "URL invalide";

  if (Object.keys(errors).length) {
    return {
      ack: { response_action: "errors", errors },
      run: async () => {},
    };
  }

  // ACK immédiat -> ferme le modal
  const ack = { response_action: "clear" };

  // le “run” fait le traitement long
  const run = async () => {
    const targetChannel = process.env.SLACK_LEARNING_CHANNEL_ID;
    if (!targetChannel) {
      await slack.chat.postMessage({
        channel: payload.user.id,
        text: "SLACK_LEARNING_CHANNEL_ID non défini côté serveur.",
      });
      return;
    }

    // Date/heure
    const tz = "Europe/Paris";
    const startAt = DateTime.fromISO(when, { zone: tz }).set({
      hour: 14,
      minute: 15,
      second: 0,
      millisecond: 0,
    });

     /* -- REMINDER -- En pause pour l'avancer du projet, fonctionnel.
    await scheduleLearningReminders({
    startAt,
    what,
    who,
    targetChannel,
    slack
    });
    */

    // Récup info user Slack 
    let slackUser = { id: payload.user.id, name: payload.user.username };
    try {
      const userInfo = await slack.users.info({ user: payload.user.id });
      if (userInfo.ok && userInfo.user) {
        slackUser = {
          id: userInfo.user.id,
          name: userInfo.user.name,
          realName: userInfo.user.real_name,
          email: userInfo.user.profile?.email,
        };
      }
    } catch (err) {
      console.error("Erreur récupération user Slack:", err);
    }

    // 1) GCal 
    let meetLink = "";
    try {
      const event = await createGCalEvent({ what, desc, resrc, startAt, slackUser });
      meetLink = event?.hangoutLink || "";
    } catch (err) {
      console.error("Erreur GCal:", err?.response?.data || err);
      await slack.chat.postMessage({
        channel: payload.user.id,
        text: "Impossible de créer l'événement Google Calendar.",
      });
    }

    // 2) Notion 
    await createNotionLearning({ who, what, when, startAt, desc, resrc });

    // 3) Slack message final 
    const blocks = [
      { type: "header", text: { type: "plain_text", text: "Nouvelle learning" } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Présentateur de la learning:*\n<@${who}>` },
          { type: "mrkdwn", text: `*Date:*\n${when} ${startAt.toFormat("HH:mm")}` },
          { type: "mrkdwn", text: `*Sujet de la learning:*\n${what}` },
        ],
      },
      ...(desc ? [{ type: "section", text: { type: "mrkdwn", text: `*Description:*\n${desc}` } }] : []),
      ...(resrc ? [{ type: "section", text: { type: "mrkdwn", text: `*Ressource:*\n${resrc}` } }] : []),
      ...(meetLink ? [{ type: "section", text: { type: "mrkdwn", text: `*Lien Meet:*\n${meetLink}` } }] : []),
      { type: "context", elements: [{ type: "mrkdwn", text: `Ajouté par <@${payload.user.id}>` }] },
    ];

    await slack.chat.postMessage({
      channel: targetChannel,
      text: `Learning: ${what}`,
      blocks,
    });
  };

  return { ack, run };
}
