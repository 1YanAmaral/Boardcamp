import gameSchema from "../schemas/gameSchema.js";

function validateGame(req, res, next) {
  const game = req.body;
  const validation = gameSchema.validate(game, { abortEarly: true });

  if (validation.error) {
    console.log(validation.error.details);
    return res.sendStatus(401);
  }
  next();
}

export default validateGame;
