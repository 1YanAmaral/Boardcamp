import express from "express";
import { getGames, postGames } from "../controllers/gamesController.js";
import validateGame from "../middlewares/gameValidation.js";

const gameRouter = express.Router();

gameRouter.get("/games", getGames);
gameRouter.post("/games", validateGame, postGames);

export default gameRouter;
