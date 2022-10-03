import rentalSchema from "../schemas/rentalSchema.js";

function validateRental(req, res, next) {
  const rental = req.body;
  const validation = gameSchema.validate(rental, { abortEarly: true });

  if (validation.error) {
    console.log(validation.error.details);
    return res.sendStatus(401);
  }
  next();
}

export default validateRental;
