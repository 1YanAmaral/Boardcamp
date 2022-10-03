import customerSchema from "../schemas/customerSchema.js";

function validateCustomer(req, res, next) {
  const customer = req.body;
  const validation = customerSchema.validate(customer, { abortEarly: true });

  if (validation.error) {
    console.log(validation.error.details);
    return res.sendStatus(401);
  }
  next();
}

export default validateCustomer;
