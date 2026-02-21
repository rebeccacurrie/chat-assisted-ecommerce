import "dotenv/config";
import express from "express";
import handler from "./api/command.ts";

const app = express();
app.use(express.json());

app.post("/api/command", (req, res) => {
  handler(req as any, res as any);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
