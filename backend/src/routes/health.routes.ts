import { Router, Request, Response } from "express";
import { checkDatabaseHealth } from "../database";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    database: dbHealth ? "connected" : "disconnected",
  });
});

export const healthRoutes = router;

