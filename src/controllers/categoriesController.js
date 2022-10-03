import connection from "../connection.js";

export async function getCategories(req, res) {
  try {
    const categories = await connection.query("SELECT * FROM categories;");
    res.send(categories.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
}

export async function postCategories(req, res) {
  const { name } = req.body;

  try {
    const existingNames = await connection.query(
      "SELECT name FROM categories;"
    );
    const compare = existingNames.rows.find(
      (categories) => categories.name === name
    );
    if (compare) {
      return res.sendStatus(409);
    }
    await connection.query("INSERT INTO categories (name) VALUES ($1);", [
      name,
    ]);
    res.send(existingNames.rows).status(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
}
