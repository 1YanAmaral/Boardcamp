import connection from "../connection.js";

export async function getGames(req, res) {
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
}

export async function postGames(req, res) {
  const { name, image, stockTotal, categoryId, pricePerDay } = req.body;

  try {
    const existingNames = await connection.query("SELECT name FROM games;");
    const compare = existingNames.rows.find((games) => games.name === name);
    if (compare) {
      return res.sendStatus(409);
    }

    await connection.query(
      `INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);`,
      [name, image, stockTotal, categoryId, pricePerDay]
    );
    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
}
