import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import dayjs from "dayjs";
import cors from "cors";

dotenv.config();

const server = express();
server.use(express.json());
server.use(cors());

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
    if (!name) {
      const games = await connection.query(`
      SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id;
    `);
      return res.send(games.rows);
    }
    const games = await connection.query(
      `SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id WHERE lower(games.name) LIKE '%'||$1||'%';
  `,
      [name]
    );
    res.send(games.rows);
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
    res.send(customer.rows[0]);
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

server.get("/rentals", async (req, res) => {
  const { customerId, gameId } = req.query;

  try {
    if (customerId) {
      const rentals = await connection.query(
        `SELECT rentals.*, json_build_object('id', customers.id, 'name', customers.name) AS customer, json_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game FROM customers JOIN rentals ON customers.id = rentals."customerId" JOIN games ON games.id = rentals."gameId" JOIN categories ON categories.id = games."categoryId" WHERE customers.id = $1;`,
        [customerId]
      );

      return res.send(rentals.rows);
    }

    if (gameId) {
      const rentals = await connection.query(
        `SELECT rentals.*, json_build_object('id', customers.id, 'name', customers.name) AS customer, json_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game FROM customers JOIN rentals ON customers.id = rentals."customerId" JOIN games ON games.id = rentals."gameId" JOIN categories ON categories.id = games."categoryId" WHERE games.id = $1;`,
        [gameId]
      );

      return res.send(rentals.rows);
    }

    const rentals = await connection.query(
      `SELECT rentals.*, json_build_object('id', customers.id, 'name', customers.name) AS customer, json_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game FROM customers JOIN rentals ON customers.id = rentals."customerId" JOIN games ON games.id = rentals."gameId" JOIN categories ON categories.id = games."categoryId";`
    );

    res.send(rentals.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.post("/rentals", async (req, res) => {
  const { customerId, gameId, daysRented } = req.body;

  try {
    if (daysRented <= 0) {
      return res.sendStatus(400);
    }

    const customer = await connection.query(
      "SELECT id FROM customers WHERE id = $1",
      [customerId]
    );

    if (!customer) {
      return res.sendStatus(400);
    }

    const game = (
      await connection.query("SELECT id FROM games WHERE id = $1", [gameId])
    ).rows;
    if (game.length < 1) {
      return res.sendStatus(400);
    }

    const price = (
      await connection.query(`SELECT "pricePerDay" FROM games WHERE id = $1;`, [
        gameId,
      ])
    ).rows[0].pricePerDay;

    const rentDate = dayjs().format("YYYY-MM-DD");
    const originalPrice = daysRented * price;
    const returnDate = null;
    const delayFee = null;

    await connection.query(
      `INSERT INTO rentals ("customerId", "gameId", "daysRented", "rentDate", "originalPrice", "returnDate", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [
        customerId,
        gameId,
        daysRented,
        rentDate,
        originalPrice,
        returnDate,
        delayFee,
      ]
    );

    res.send(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.post("/rentals/:id/return", async (req, res) => {
  const { id } = req.params;
  const date = dayjs().format("YYYY-MM-DD");

  try {
    const rentDate = (
      await connection.query(
        `SELECT "rentDate" FROM rentals WHERE rentals.id = $1;`,
        [id]
      )
    ).rows[0].rentDate;

    const pricePerDay = (
      await connection.query(
        `SELECT "pricePerDay" FROM games JOIN rentals ON games.id = rentals."gameId" WHERE rentals.id = $1;`,
        [id]
      )
    ).rows[0].pricePerDay;

    const lateDays = (new Date(date) - rentDate) / (1000 * 60 * 60 * 24);
    const fee = lateDays * pricePerDay;

    await connection.query(
      `UPDATE rentals SET "returnDate" = $1, "delayFee" = $2`,
      [date, fee]
    );

    console.log(Math.ceil(lateDays), fee);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.delete("/rentals/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const existingId = (
      await connection.query(
        "SELECT rentals.id FROM rentals WHERE rentals.id = $1",
        [id]
      )
    ).rows;
    if (existingId.length < 1) {
      return res.sendStatus(404);
    }

    const returnDate = (
      await connection.query(
        "SELECT returnDate FROM rentals WHERE rentals.id = $1",
        [id]
      )
    ).rows[0].returnDate;
    if (returnDate === null) {
      return res.sendStatus(400);
    }

    await connection.query("DELETE FROM rentals WHERE id = $1", [id]);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.listen(4000, () => {
  console.log("Server listening on port 4000.");
});
