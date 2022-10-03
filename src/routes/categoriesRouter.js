import express from "express";
import {
  getCategories,
  postCategories,
} from "../controllers/categoriesController.js";
import validateCategory from "../middlewares/categoryValidation.js";

const categoryRouter = express.Router();

categoryRouter.get("/categories", getCategories);
categoryRouter.post("/categories", validateCategory, postCategories);

export default categoryRouter;
