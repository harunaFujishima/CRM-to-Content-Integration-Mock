// data.js
// In-memory data store for the Mock Content Platform service.
// Simulates the distribution log a Vault PromoMats/MedComms-style
// platform would keep once content clears approval upstream.

let distributions = [];

const DISTRIBUTION_CHANNELS = [
  "Field Rep CLM Library (Veeva CRM)",
  "Veeva Vault Content Library",
  "Email Notification (Mock)"
];

function add(record) {
  const entry = {
    ...record,
    distributedAt: new Date().toISOString(),
    channels: DISTRIBUTION_CHANNELS,
    status: "distributed"
  };
  distributions.unshift(entry);
  return entry;
}

function getAll() {
  return distributions;
}

function getByContentId(contentId) {
  return distributions.find((d) => d.contentId === contentId);
}

function reset() {
  distributions = [];
  return distributions;
}

module.exports = { add, getAll, getByContentId, reset };
