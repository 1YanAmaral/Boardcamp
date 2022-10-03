import connection from "../connection.js";
import dayjs from "dayjs";

export async function getRentals(req, res) {
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
}

export async function postRental(req, res) {
  const { customerId, gameId, daysRented } = req.body;

  try {
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
}

export async function returnRental(req, res) {
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
    const fee = parseInt(lateDays * pricePerDay);

    await connection.query(
      `UPDATE rentals SET "returnDate" = $1, "delayFee" = $2;`,
      [date, fee]
    );

    console.log(Math.ceil(lateDays), fee);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
}

export async function deleteRental(req, res) {
  const { id } = req.params;

  try {
    const existingId = (
      await connection.query(
        "SELECT rentals.id FROM rentals WHERE rentals.id = $1;",
        [id]
      )
    ).rows;
    if (existingId.length < 1) {
      return res.sendStatus(404);
    }

    const returnDate = (
      await connection.query(
        `SELECT "returnDate" FROM rentals WHERE rentals.id = $1;`,
        [id]
      )
    ).rows[0].returnDate;
    if (returnDate === null) {
      return res.sendStatus(400);
    }

    await connection.query("DELETE FROM rentals WHERE id = $1;", [id]);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
}
