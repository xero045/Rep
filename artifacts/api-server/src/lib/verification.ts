import { createHash } from "node:crypto";
import { db, type VerificationRun, verificationRunsTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { ethers } from "ethers";

const POLYGON_RPC_URL =
  process.env.POLYGON_RPC_URL ?? "https://rpc-amoy.polygon.technology";
const POLYGON_CHAIN_ID = 80002;
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_ANCHOR_ADDRESS = process.env.POLYGON_ANCHOR_ADDRESS;
const WHO_API_URL = process.env.WHO_API_URL;
const DHIS2_BASE_URL = process.env.DHIS2_BASE_URL;
const DHIS2_DATASET_ID = process.env.DHIS2_DATASET_ID;
let seedPromise: Promise<void> | null = null;

export type SourceResult = {
  source: string;
  status: "matched" | "diverged" | "unavailable" | "demo";
  value: number | null;
  unit: string;
  observedAt: string;
  note: string;
};

export type SourceStatus = {
  id: string;
  label: string;
  kind: "source" | "chain";
  status: "connected" | "pending" | "unavailable" | "demo";
  detail: string;
  lastCheckedAt: string;
  network: string | null;
  explorerUrl: string | null;
};

type Input = {
  geography: string;
  indicator: string;
  period: string;
  anchor?: boolean;
};

const nowIso = () => new Date().toISOString();

function normalizeUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function extractNumber(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const candidates = [
    record.value,
    record.Value,
    record.count,
    record.Count,
    record.total,
    record.Total,
  ];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) return value;
  }
  for (const key of ["dataValues", "rows", "data", "value"]) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      const values = nested.map(extractNumber).filter((value): value is number => value !== null);
      if (values.length) return values.reduce((sum, value) => sum + value, 0);
    }
  }
  return null;
}

async function fetchJson(url: string, headers?: Record<string, string>) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

async function anchorHash(contentHash: string) {
  if (!POLYGON_PRIVATE_KEY) return null;
  const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL, POLYGON_CHAIN_ID, {
    staticNetwork: true,
  });
  const wallet = new ethers.Wallet(POLYGON_PRIVATE_KEY, provider);
  const transaction = await wallet.sendTransaction({
    to: POLYGON_ANCHOR_ADDRESS ?? wallet.address,
    data: ethers.hexlify(ethers.toUtf8Bytes(contentHash)),
  });
  await transaction.wait(1);
  return transaction.hash;
}

async function getDhisResult(input: Input): Promise<SourceResult> {
  if (!DHIS2_BASE_URL || !DHIS2_DATASET_ID) {
    return {
      source: "DHIS2",
      status: "unavailable",
      value: null,
      unit: "records",
      observedAt: nowIso(),
      note: "Add DHIS2_BASE_URL and DHIS2_DATASET_ID to enable this source.",
    };
  }

  const params = new URLSearchParams({
    dataSet: DHIS2_DATASET_ID,
    period: input.period,
    orgUnit: input.geography,
  });
  const headers: Record<string, string> = {};
  if (process.env.DHIS2_USERNAME && process.env.DHIS2_PASSWORD) {
    headers.authorization = `Basic ${Buffer.from(
      `${process.env.DHIS2_USERNAME}:${process.env.DHIS2_PASSWORD}`,
    ).toString("base64")}`;
  }

  try {
    const payload = await fetchJson(
      normalizeUrl(DHIS2_BASE_URL, `/api/dataValueSets.json?${params.toString()}`),
      headers,
    );
    const value = extractNumber(payload);
    return {
      source: "DHIS2",
      status: value === null ? "unavailable" : "matched",
      value,
      unit: "reported records",
      observedAt: nowIso(),
      note: value === null ? "The DHIS2 response did not contain a numeric value." : "Live DHIS2 response.",
    };
  } catch (error) {
    return {
      source: "DHIS2",
      status: "unavailable",
      value: null,
      unit: "reported records",
      observedAt: nowIso(),
      note: `DHIS2 could not be reached: ${error instanceof Error ? error.message : "unknown error"}.`,
    };
  }
}

async function getWhoResult(input: Input): Promise<SourceResult> {
  if (!WHO_API_URL) {
    return {
      source: "WHO",
      status: "unavailable",
      value: null,
      unit: "records",
      observedAt: nowIso(),
      note: "Add WHO_API_URL to enable a configured WHO indicator endpoint.",
    };
  }

  const url = new URL(WHO_API_URL);
  url.searchParams.set("geography", input.geography);
  url.searchParams.set("indicator", input.indicator);
  url.searchParams.set("period", input.period);

  try {
    const payload = await fetchJson(url.toString());
    const value = extractNumber(payload);
    return {
      source: "WHO",
      status: value === null ? "unavailable" : "matched",
      value,
      unit: "reported records",
      observedAt: nowIso(),
      note: value === null ? "The WHO response did not contain a numeric value." : "Live WHO response.",
    };
  } catch (error) {
    return {
      source: "WHO",
      status: "unavailable",
      value: null,
      unit: "reported records",
      observedAt: nowIso(),
      note: `WHO could not be reached: ${error instanceof Error ? error.message : "unknown error"}.`,
    };
  }
}

export async function getSourceStatuses(): Promise<SourceStatus[]> {
  const checkedAt = nowIso();
  const statuses: SourceStatus[] = [
    {
      id: "dhis2",
      label: "DHIS2",
      kind: "source",
      status: DHIS2_BASE_URL && DHIS2_DATASET_ID ? "connected" : "pending",
      detail: DHIS2_BASE_URL && DHIS2_DATASET_ID
        ? "Configured for live data comparison."
        : "Waiting for an instance URL and dataset identifier.",
      lastCheckedAt: checkedAt,
      network: null,
      explorerUrl: null,
    },
    {
      id: "who",
      label: "WHO API",
      kind: "source",
      status: WHO_API_URL ? "connected" : "pending",
      detail: WHO_API_URL
        ? "Configured for live indicator comparison."
        : "Waiting for a WHO indicator endpoint.",
      lastCheckedAt: checkedAt,
      network: null,
      explorerUrl: null,
    },
  ];

  try {
    const payload = await fetchJson(POLYGON_RPC_URL, {
      "content-type": "application/json",
    });
    const chainIdHex = (payload as { result?: string }).result;
    const chainId = chainIdHex ? Number.parseInt(chainIdHex, 16) : 0;
    statuses.push({
      id: "polygon",
      label: "Polygon Amoy",
      kind: "chain",
      status: chainId === POLYGON_CHAIN_ID ? (process.env.POLYGON_PRIVATE_KEY ? "connected" : "pending") : "unavailable",
      detail: chainId === POLYGON_CHAIN_ID
        ? process.env.POLYGON_PRIVATE_KEY
          ? "Testnet is reachable and a signer is configured."
          : "Testnet is reachable; add a signer to anchor hashes."
        : "Connected RPC is not Polygon Amoy.",
      lastCheckedAt: checkedAt,
      network: "Amoy testnet",
      explorerUrl: "https://amoy.polygonscan.com",
    });
  } catch (error) {
    statuses.push({
      id: "polygon",
      label: "Polygon Amoy",
      kind: "chain",
      status: "unavailable",
      detail: `Polygon RPC could not be reached: ${error instanceof Error ? error.message : "unknown error"}.`,
      lastCheckedAt: checkedAt,
      network: "Amoy testnet",
      explorerUrl: "https://amoy.polygonscan.com",
    });
  }

  return statuses;
}

export async function ensureSeedRuns() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(verificationRunsTable);
    if (Number(count) > 0) return;

    const seedRuns = [
      {
        geography: "Nigeria",
        indicator: "Cholera suspected cases",
        period: "2026-W34",
        status: "needs-review",
        agreement: 0.5,
        recordsCompared: 1,
        sourceResults: [
          { source: "DHIS2", status: "demo", value: null, unit: "records", observedAt: "2026-08-24T09:14:00.000Z", note: "Illustrative record awaiting DHIS2 connection." },
          { source: "WHO", status: "demo", value: null, unit: "records", observedAt: "2026-08-24T09:14:00.000Z", note: "Illustrative record awaiting WHO connection." },
        ],
        report: "Illustrative verification record. No public-health conclusion should be drawn until live DHIS2 and WHO sources are connected.",
        contentHash: createHash("sha256").update("outbreak-trust-seed-1").digest("hex"),
        txHash: null,
        explorerUrl: null,
      },
      {
        geography: "Ghana",
        indicator: "Measles suspected cases",
        period: "2026-W33",
        status: "needs-review",
        agreement: 0.5,
        recordsCompared: 1,
        sourceResults: [
          { source: "DHIS2", status: "demo", value: null, unit: "records", observedAt: "2026-08-17T11:32:00.000Z", note: "Illustrative record awaiting DHIS2 connection." },
          { source: "WHO", status: "demo", value: null, unit: "records", observedAt: "2026-08-17T11:32:00.000Z", note: "Illustrative record awaiting WHO connection." },
        ],
        report: "Illustrative verification record. No public-health conclusion should be drawn until live DHIS2 and WHO sources are connected.",
        contentHash: createHash("sha256").update("outbreak-trust-seed-2").digest("hex"),
        txHash: null,
        explorerUrl: null,
      },
    ];

    await db.insert(verificationRunsTable).values(seedRuns);
  })();
  return seedPromise;
}

export async function listRuns(limit: number): Promise<VerificationRun[]> {
  await ensureSeedRuns();
  return db.select().from(verificationRunsTable).orderBy(desc(verificationRunsTable.createdAt)).limit(limit);
}

export async function getRun(id: number): Promise<VerificationRun | undefined> {
  await ensureSeedRuns();
  const [run] = await db.select().from(verificationRunsTable).where(eq(verificationRunsTable.id, id));
  return run;
}

export async function createRun(input: Input): Promise<VerificationRun> {
  const [dhis, who] = await Promise.all([getDhisResult(input), getWhoResult(input)]);
  const results = [dhis, who];
  const available = results.filter((result) => result.value !== null);
  let agreement = 0;
  let status: "verified" | "needs-review" = "needs-review";
  if (available.length === 2) {
    const first = available[0].value ?? 0;
    const second = available[1].value ?? 0;
    agreement = first === 0 && second === 0 ? 1 : Math.max(0, 1 - Math.abs(first - second) / Math.max(Math.abs(first), Math.abs(second), 1));
    status = agreement >= 0.9 ? "verified" : "needs-review";
    results[0].status = agreement >= 0.9 ? "matched" : "diverged";
    results[1].status = agreement >= 0.9 ? "matched" : "diverged";
  } else if (available.length === 1) {
    agreement = 0.5;
  }

  let report = available.length === 2
    ? `${input.indicator} for ${input.geography} in ${input.period}: two live sources compared. Agreement is ${(agreement * 100).toFixed(1)}%. ${status === "verified" ? "The sources are within the verification threshold." : "The difference requires human review before publication."}`
    : `The comparison for ${input.indicator} in ${input.geography} for ${input.period} is incomplete. ${available.length === 0 ? "Neither configured source returned a numeric value." : "Only one configured source returned a numeric value."} No public-health conclusion should be drawn from this run.`;

  const canonical = JSON.stringify({
    geography: input.geography,
    indicator: input.indicator,
    period: input.period,
    agreement,
    recordsCompared: available.length,
    sourceResults: results,
    report,
  });
  const contentHash = createHash("sha256").update(canonical).digest("hex");
  let txHash: string | null = null;
  if (input.anchor !== false) {
    try {
      txHash = await anchorHash(contentHash);
      if (!txHash && status === "verified") {
        report += " The report hash is ready, but Polygon anchoring is waiting for a configured signer.";
      }
    } catch (error) {
      report += ` Polygon anchoring was not completed: ${error instanceof Error ? error.message : "unknown error"}.`;
    }
  }
  const [created] = await db.insert(verificationRunsTable).values({
    geography: input.geography,
    indicator: input.indicator,
    period: input.period,
    status,
    agreement,
    recordsCompared: available.length,
    sourceResults: results,
    report,
    contentHash,
    txHash,
    explorerUrl: txHash ? `https://amoy.polygonscan.com/tx/${txHash}` : null,
  }).returning();

  return created;
}

export async function getSummary() {
  await ensureSeedRuns();
  const runs = await listRuns(50);
  const anchoredRuns = runs.filter((run) => run.txHash).length;
  const totalCompared = runs.reduce((sum, run) => sum + Number(run.recordsCompared), 0);
  const latest = runs[0];
  return {
    totalRuns: runs.length,
    anchoredRuns,
    sourceAgreement: latest ? Number(latest.agreement) : 0,
    recordsCompared: totalCompared,
    lastVerifiedAt: latest?.createdAt ? new Date(latest.createdAt).toISOString() : null,
    latestHash: latest?.contentHash ?? null,
    latestTxHash: latest?.txHash ?? null,
  };
}