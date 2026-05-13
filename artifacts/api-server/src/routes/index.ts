import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import neighborhoodsRouter from "./neighborhoods";
import recommendationsRouter from "./recommendations";
import favoritesRouter from "./favorites";
import compareRouter from "./compare";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(neighborhoodsRouter);
router.use(recommendationsRouter);
router.use(favoritesRouter);
router.use(compareRouter);
router.use(adminRouter);

export default router;
