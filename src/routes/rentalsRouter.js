import express from "express";
import {
  getRentals,
  postRental,
  returnRental,
  deleteRental,
} from "../controllers/rentalsController.js";

import validateRental from "../middlewares/rentalValidation.js";

const rentalRouter = express.Router();

rentalRouter.get("/rentals", getRentals);
rentalRouter.post("/rentals", validateRental, postRental);
rentalRouter.post("/rentals/:id/return", returnRental);
rentalRouter.delete("/rentals/:id", deleteRental);

export default rentalRouter;
