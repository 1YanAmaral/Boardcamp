import express from "express";
import pg from "pg";

const app = express();
app.use(express.json());

const { Pool } = pg;

const connection = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/status", (req, res) => {
  res.send("ok");
});

app.listen(3000, () => {
  console.log("Server listening on port 3000.");
});
