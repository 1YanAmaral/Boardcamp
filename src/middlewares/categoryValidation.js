import categorySchema from "../schemas/categorySchema.js";

function validateCategory(req, res, next) {
  const name = req.body;
  const validation = categorySchema.validate(name, { abortEarly: true });

  if (validation.error) {
    console.log(validation.error.details);
    return res.sendStatus(401);
  }
  next();
}

export default validateCategory;
