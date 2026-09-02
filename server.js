const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { payments, settlements } = require("./src/mockData");
const {
  reconcileTransactions,
  investigateTransactions,
} = require("./src/services/reconciliation");
const { investigateWithAI } = require("./src/services/aiInvestigation");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ReconcileAI backend is running 🚀",
  });
});

// Backend health
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "ReconcileAI",
  });
});

// Reconciliation API
app.get("/api/reconciliation", (req, res) => {
  const results = reconcileTransactions(payments, settlements);

  const summary = {
    total: results.length,
    matched: results.filter((item) => item.status === "MATCHED").length,
    mismatched: results.filter((item) => item.status === "MISMATCH").length,
    unmatched: results.filter((item) => item.status === "UNMATCHED").length,
    partiallyMatched: results.filter(
      (item) => item.reconciliationStatus === "PARTIALLY_MATCHED"
    ).length,
    adjustments: results.filter(
      (item) => item.reconciliationStatus === "ADJUSTMENT"
    ).length,
    refunds: results.filter(
      (item) => item.reconciliationStatus === "REFUND"
    ).length,
  };

  res.json({
    success: true,
    summary,
    transactions: results,
  });
});

// Deterministic investigation API for problematic transactions
app.get("/api/reconciliation/investigate", (req, res) => {
  const investigations = investigateTransactions(payments, settlements);

  res.json({
    success: true,
    investigations,
  });
});

// LLM-backed investigation API
app.post("/api/ai/investigate", async (req, res) => {
  try {
    const result = await investigateWithAI(req.body);
    res.json({
      success: true,
      investigation: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 502;
    res.status(statusCode).json({
      success: false,
      error: error.message || "AI investigation failed.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`ReconcileAI backend running on http://localhost:${PORT}`);
});