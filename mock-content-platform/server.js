// server.js — Mock Content Platform (simulates Veeva Vault PromoMats/MedComms)
//
// Responsibilities:
//   1. Receive a webhook from the CRM service when a piece of content
//      is approved (event: "content.approved").
//   2. Verify a shared-secret header, the same way a real Vault webhook
//      receiver would validate inbound calls.
//   3. "Distribute" the content (write a distribution record covering
//      the channels reps and HCPs would actually see) and expose it
//      through a REST API for the dashboard to display.

const express = require("express");
const cors = require("cors");
const data = require("./data");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "demo-shared-secret";

// ---- Webhook receiver ----

app.post("/webhooks/crm-approval", (req, res) => {
  const incomingSecret = req.header("X-Webhook-Secret");
  if (incomingSecret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: "invalid webhook secret" });
  }

  const { event, contentId, contentTitle, contentType, repName, accountName, approvedBy, approvedAt } =
    req.body || {};

  if (event !== "content.approved" || !contentId) {
    return res.status(400).json({ error: "unsupported or malformed event payload" });
  }

  const record = data.add({
    contentId,
    contentTitle,
    contentType,
    repName,
    accountName,
    approvedBy,
    approvedAt
  });

  console.log(`[mock-content-platform] received content.approved for ${contentId} -> distributed`);

  res.status(201).json({ received: true, distribution: record });
});

// ---- REST API ----

app.get("/api/health", (req, res) => {
  res.json({ service: "mock-content-platform", status: "ok", time: new Date().toISOString() });
});

app.get("/api/distributions", (req, res) => {
  res.json(data.getAll());
});

app.get("/api/distributions/:contentId", (req, res) => {
  const item = data.getByContentId(req.params.contentId);
  if (!item) return res.status(404).json({ error: "not found" });
  res.json(item);
});

app.post("/api/reset", (req, res) => {
  res.json(data.reset());
});

app.listen(PORT, () => {
  console.log(`[mock-content-platform] listening on port ${PORT}`);
});
