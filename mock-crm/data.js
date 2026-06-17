// data.js
// In-memory data store for the Mock CRM service.
// Simulates the kind of content-approval records a Veeva CRM
// (sales-side) instance surfaces to field reps.

let approvals = [
  {
    id: "appr-1001",
    contentTitle: "XYZ-Drug Efficacy Leave-Piece v3",
    contentType: "CLM Presentation",
    repName: "Haruna Tanaka",
    accountName: "Toronto General Hospital - Dr. Lee",
    status: "pending",
    createdAt: "2026-06-10T09:00:00Z",
    approvedBy: null,
    approvedAt: null,
    webhookDelivery: null
  },
  {
    id: "appr-1002",
    contentTitle: "Patient Education Brochure - Diabetes Care",
    contentType: "Print Leave-Behind",
    repName: "Haruna Tanaka",
    accountName: "North York Family Clinic - Dr. Singh",
    status: "pending",
    createdAt: "2026-06-11T13:30:00Z",
    approvedBy: null,
    approvedAt: null,
    webhookDelivery: null
  },
  {
    id: "appr-1003",
    contentTitle: "MOA Animation Video - Cardiology Update",
    contentType: "Video / Multichannel",
    repName: "Haruna Tanaka",
    accountName: "Mississauga Cardiology Group",
    status: "pending",
    createdAt: "2026-06-12T10:15:00Z",
    approvedBy: null,
    approvedAt: null,
    webhookDelivery: null
  }
];

function getAll() {
  return approvals;
}

function getById(id) {
  return approvals.find((a) => a.id === id);
}

function update(id, patch) {
  const idx = approvals.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  approvals[idx] = { ...approvals[idx], ...patch };
  return approvals[idx];
}

function reset() {
  approvals = approvals.map((a) => ({
    ...a,
    status: "pending",
    approvedBy: null,
    approvedAt: null,
    webhookDelivery: null
  }));
  return approvals;
}

module.exports = { getAll, getById, update, reset };
