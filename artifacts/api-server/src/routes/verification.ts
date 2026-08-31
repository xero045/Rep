import { Router, type IRouter } from "express";
import {
  CreateVerificationRunBody,
  CreateVerificationRunResponse,
  GetSourceStatusesResponse,
  GetVerificationRunParams,
  GetVerificationRunResponse,
  GetVerificationSummaryResponse,
  ListVerificationRunsQueryParams,
  ListVerificationRunsResponse,
} from "@workspace/api-zod";
import {
  createRun,
  getRun,
  getSourceStatuses,
  getSummary,
  listRuns,
} from "../lib/verification";

const router: IRouter = Router();

router.get("/verification/summary", async (_req, res): Promise<void> => {
  res.json(GetVerificationSummaryResponse.parse(await getSummary()));
});

router.get("/verification/runs", async (req, res): Promise<void> => {
  const parsed = ListVerificationRunsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(ListVerificationRunsResponse.parse(await listRuns(parsed.data.limit ?? 20)));
});

router.post("/verification/runs", async (req, res): Promise<void> => {
  const parsed = CreateVerificationRunBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const run = await createRun(parsed.data);
  res.status(201).json(CreateVerificationRunResponse.parse(run));
});

router.get("/verification/runs/:id", async (req, res): Promise<void> => {
  const parsed = GetVerificationRunParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const run = await getRun(parsed.data.id);
  if (!run) {
    res.status(404).json({ error: "Verification run not found" });
    return;
  }
  res.json(GetVerificationRunResponse.parse(run));
});

router.get("/verification/sources", async (_req, res): Promise<void> => {
  res.json(GetSourceStatusesResponse.parse(await getSourceStatuses()));
});

export default router;