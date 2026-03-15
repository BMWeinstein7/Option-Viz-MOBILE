import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import marketRouter from "./market.js";
import strategyRouter from "./strategy.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketRouter);
router.use(strategyRouter);

export default router;
