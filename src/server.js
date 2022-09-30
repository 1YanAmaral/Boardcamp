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

server.get("/games", async (req, res) => {
  const name = req.query.name;
  try {
    if (name) {
      const games = await connection.query(
        `SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id WHERE lower(games.name) LIKE '%'||$1||'%';
    `,
        [name]
      );
      res.send(games.rows);
    } else {
      const games = await connection.query(`
      SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id;
    `);
      res.send(games.rows);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.post("/games", async (req, res) => {
  const { name, image, stockTotal, categoryId, pricePerDay } = req.body;

  if (!name || stockTotal < 0 || pricePerDay < 0) {
    return res.send(400);
  }

  const existingNames = await connection.query("SELECT name FROM games;");
  const compare = existingNames.rows.find((games) => games.name === name);
  if (compare) {
    return res.sendStatus(409);
  }

  try {
    await connection.query(
      `INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);`,
      [name, image, stockTotal, categoryId, pricePerDay]
    );
    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.get("/customers", async (req, res) => {
  const cpf = req.query.cpf;
  try {
    if (cpf) {
      const customers = await connection.query(
        `SELECT * FROM customers WHERE cpf LIKE '%'||$1||'%';
    `,
        [cpf]
      );
      res.send(customers.rows);
    } else {
      const customers = await connection.query("SELECT * FROM customers;");
      res.send(customers.rows);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.get("/customers/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await connection.query(
      "SELECT * FROM customers WHERE id = $1;",
      [id]
    );
    if (customer.rows.lenght < 1) {
      return res.sendStatus(404);
    }
    res.send(customer.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.post("/customers", async (req, res) => {
  const { name, phone, cpf, birthday } = req.body;

  try {
    const existingCpf = await connection.query("SELECT cpf FROM customers;");
    const compare = existingCpf.rows.find((customer) => customer.cpf === cpf);
    if (compare) {
      return res.sendStatus(409);
    }
    await connection.query(
      "INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);",
      [name, phone, cpf, birthday]
    );
    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.put("/customers/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, cpf, birthday } = req.body;

  try {
    const existingCpf = await connection.query("SELECT cpf FROM customers;");
    const compare = existingCpf.rows.find((customer) => customer.cpf === cpf);
    if (compare) {
      return res.sendStatus(409);
    }
    await connection.query(
      "UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4  WHERE id = $5;",
      [name, phone, cpf, birthday, id]
    );
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.listen(4000, () => {
  console.log("Server listening on port 4000.");
});
