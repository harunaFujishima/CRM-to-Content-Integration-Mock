// server.js — Mock CRM (simulates Veeva CRM, sales-side)
//
// Responsibilities:
//   1. Expose a REST API for content approval requests (the kind of
//      record a field rep sees in Veeva CRM before sharing content
//      with an HCP).
//   2. When an approval request is approved, fire a webhook to the
//      Content Platform service so it can distribute the approved
//      content — mirroring how Veeva CRM and Veeva Vault PromoMats/
//      MedComms stay in sync today.

const express = require("express");
const cors = require("cors");
const path = require("path");
const data = require("./data");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "dashboard")));

const PORT = process.env.PORT || 4001;
const CONTENT_PLATFORM_WEBHOOK_URL =
  process.env.CONTENT_PLATFORM_WEBHOOK_URL ||
  "http://localhost:4002/webhooks/crm-approval";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "demo-shared-secret";

// ---- REST API ----

app.get("/api/health", (req, res) => {
  res.json({ service: "mock-crm", status: "ok", time: new Date().toISOString() });
});

app.get("/api/approvals", (req, res) => {
  res.json(data.getAll());
});

app.get("/api/approvals/:id", (req, res) => {
  const item = data.getById(req.params.id);
  if (!item) return res.status(404).json({ error: "not found" });
  res.json(item);
});

app.post("/api/approvals/:id/approve", async (req, res) => {
  const item = data.getById(req.params.id);
  if (!item) return res.status(404).json({ error: "not found" });
  if (item.status === "approved") {
    return res.status(409).json({ error: "already approved" });
  }

  const approvedBy = (req.body && req.body.approvedBy) || "Unknown Approver";
  const approvedAt = new Date().toISOString();

  const updated = data.update(item.id, {
    status: "approved",
    approvedBy,
    approvedAt
  });

  // Build the webhook payload that downstream content platforms
  // (Vault PromoMats / MedComms in the real Veeva ecosystem) would
  // consume to know a piece of content has cleared MLR approval.
  const webhookPayload = {
    event: "content.approved",
    contentId: updated.id,
    contentTitle: updated.contentTitle,
    contentType: updated.contentType,
    repName: updated.repName,
    accountName: updated.accountName,
    approvedBy: updated.approvedBy,
    approvedAt: updated.approvedAt
  };

  let webhookDelivery;
  try {
    const webhookRes = await fetch(CONTENT_PLATFORM_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": WEBHOOK_SECRET
      },
      body: JSON.stringify(webhookPayload)
    });

    const body = await webhookRes.json().catch(() => ({}));
    webhookDelivery = {
      delivered: webhookRes.ok,
      statusCode: webhookRes.status,
      respondedAt: new Date().toISOString(),
      response: body
    };
  } catch (err) {
    webhookDelivery = {
      delivered: false,
      error: err.message,
      respondedAt: new Date().toISOString()
    };
  }

  const finalItem = data.update(item.id, { webhookDelivery });

  res.json(finalItem);
});

app.post("/api/reset", (req, res) => {
  res.json(data.reset());
});

app.listen(PORT, () => {
  console.log(`[mock-crm] listening on port ${PORT}`);
  console.log(`[mock-crm] will POST webhooks to ${CONTENT_PLATFORM_WEBHOOK_URL}`);
});
