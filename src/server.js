import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const server = express();
server.use(express.json());

const { Pool } = pg;

const connection = new Pool({
  connectionString: process.env.DATABASE_URL,
});

server.get("/status", (req, res) => {
  res.send("ok");
});

server.get("/categories", async (req, res) => {
  const categories = await connection.query("SELECT * FROM categories;");
  res.send(categories.rows);
});

server.post("/categories", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.sendStatus(400);
  }
  const existingNames = await connection.query("SELECT name FROM categories;");
  const compare = existingNames.rows.find(
    (categories) => categories.name === name
  );
  if (compare) {
    return res.sendStatus(409);
  }
  await connection.query("INSERT INTO categories (name) VALUES ($1);", [name]);
  res.send(existingNames.rows).status(201);
});

server.listen(4000, () => {
  console.log("Server listening on port 4000.");
});
