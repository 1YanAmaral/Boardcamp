import joi from "joi";

const customerSchema = joi.object({
  name: joi.string().required(),
  cpf: joi.string().required().length(11),
  birthday: joi.date(),
  password: joi.string().min(4),
});

export default customerSchema;
