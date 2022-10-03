import express from "express";
import cors from "cors";
import categoryRouter from "./routes/categoriesRouter.js";
import gameRouter from "./routes/gamesRouter.js";
import customerRouter from "./routes/customersRouter.js";
import rentalRouter from "./routes/rentalsRouter.js";

const server = express();
server.use(express.json());
server.use(cors());

server.use(categoryRouter);
server.use(gameRouter);
server.use(customerRouter);
server.use(rentalRouter);

server.listen(4000, () => {
  console.log("Server listening on port 4000.");
});
