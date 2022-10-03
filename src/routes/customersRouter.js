import express from "express";
import {
  getCustomers,
  getCustomersById,
  postCustomers,
  updateCustomer,
} from "../controllers/customersController.js";
import validateCustomer from "../middlewares/customerValidation.js";

const customerRouter = express.Router();

customerRouter.get("/customers", getCustomers);
customerRouter.get("/customers/:id", getCustomersById);
customerRouter.post("/customers", validateCustomer, postCustomers);
customerRouter.put("/customers/:id", updateCustomer);

export default customerRouter;
