import express from "express";
import { verifySlack } from "../middlewares/verifySlack.js";
import { handleLearningSubmission } from "../handlers/learningSubmission.js";

export function registerSlackRoutes(app, { slack }) {
    const router = express.Router();
    
    // ✅ Slash commands
    router.post("/commands", verifySlack, async (req, res) => {
        try {
            if (req.body.command === "/ping") {
                return res.json({ response_type: "ephemeral", text: "pong" });
            }
            
            if (req.body.command === "/learning") {
                const { trigger_id, channel_id } = req.body;
                
                res.status(200).send();
                
                await slack.views.open({
                    trigger_id,
                    view: {
                        type: "modal",
                        callback_id: "learning_form",
                        private_metadata: JSON.stringify({ channel_id }),
                        title: { type: "plain_text", text: "Learning" },
                        submit: { type: "plain_text", text: "Enregistrer" },
                        close: { type: "plain_text", text: "Annuler" },
                        blocks: [
                            {
                                type: "input",
                                block_id: "who_block",
                                label: { type: "plain_text", text: "Personne" },
                                element: {
                                    type: "users_select",
                                    action_id: "who_input",
                                    placeholder: {
                                        type: "plain_text",
                                        text: "Choisir une personne",
                                    },
                                },
                            },
                            {
                                type: "input",
                                block_id: "what_block",
                                label: { type: "plain_text", text: "Nom de la learning" },
                                element: {
                                    type: "plain_text_input",
                                    action_id: "what_input",
                                    placeholder: {
                                        type: "plain_text",
                                        text: "ex: Express + Slack API",
                                    },
                                },
                            },
                            {
                                type: "input",
                                block_id: "when_block",
                                label: { type: "plain_text", text: "Jour" },
                                element: {
                                    type: "datepicker",
                                    action_id: "when_input",
                                    placeholder: {
                                        type: "plain_text",
                                        text: "Sélectionne une date",
                                    },
                                },
                            },
                            // Pour ajouter l'heure à voir si besoin
                            // {
                            //   type: "input",
                            //   block_id: "time_block",
                            //   label: { type: "plain_text", text: "Heure de début" },
                            //   element: {
                            //     type: "timepicker",
                            //     action_id: "time_input",
                            //     placeholder: { type: "plain_text", text: "HH:MM" },
                            //   },
                            // },
                            {
                                type: "input",
                                block_id: "desc_block",
                                label: { type: "plain_text", text: "Description" },
                                element: {
                                    type: "plain_text_input",
                                    action_id: "desc_input",
                                    multiline: true,
                                    placeholder: {
                                        type: "plain_text",
                                        text: "Quelques lignes…",
                                    },
                                },
                            },
                            {
                                type: "input",
                                block_id: "res_block",
                                optional: true,
                                label: { type: "plain_text", text: "Ressource (URL)" },
                                element: {
                                    type: "plain_text_input",
                                    action_id: "res_input",
                                    placeholder: { type: "plain_text", text: "https://…" },
                                },
                            },
                        ],
                    },
                });
                
                return;
            }
            
            // fallback (commande inconnue)
            return res.status(200).send();
        } catch (err) {
            console.error("[/slack/commands] error:", err?.data || err);
            return res.status(500).send("Internal error");
        }
    });
    
    // Interactions (modal submit) -> handler unique
    router.post("/interactions", verifySlack, async (req, res) => {
        const { ack, run } = await handleLearningSubmission(payload, res, { slack });
        res.json(ack);
        run().catch((e) => console.error("[learningSubmission] failed:", e));
        return;
        
    });
    
    app.use("/slack", router);
}
