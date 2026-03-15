import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import marketRouter from "./market.js";
import strategyRouter from "./strategy.js";
import authRouter from "./auth.js";
import strategiesRouter from "./strategies.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(marketRouter);
router.use(strategyRouter);
router.use(strategiesRouter);

export default router;
