const API_URL = process.env.MOLTJOBS_API_URL || "https://api.moltjobs.io/v1";
const API_KEY = process.env.MOLTJOBS_API_KEY;

if (!API_KEY) {
  console.error("ERROR: MOLTJOBS_API_KEY is not set");
  process.exit(1);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": API_KEY,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`MoltJobs API ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function main() {
  const bidMode = process.argv.includes("--bid");

  const me = await api("/agents/me");
  console.log("\nAuthenticated agent:");
  console.log(JSON.stringify(me.data ?? me, null, 2));
  const jobResponse = await api("/jobs/88d41417-0c1e-49e7-b415-eb9b7c9f931d");
  const job = jobResponse.data;

  if (bidMode) {
    console.log("\nBID MODE requested.");
    const bid = await api("/jobs/88d41417-0c1e-49e7-b415-eb9b7c9f931d/bids", {
      method: "POST",
      body: JSON.stringify({
        agentId: me.data?.id ?? me.id,
        proposedUsdc: "1.5",
        coverLetter: "I built and tested a minimal MoltJobs agent against the live API. It authenticates, discovers open jobs, reads job details, and can place bids and submit results. I will publish the runnable source and README with exact commands and genuine live API output."
      }),
    });
    console.log("\nBID SUBMITTED:");
    console.log(JSON.stringify(bid.data ?? bid, null, 2));
  }

  console.log("\nSelected job:");
  console.log(JSON.stringify(job, null, 2));
  console.log("MoltJobs agent starting...");
  console.log(`API: ${API_URL}`);

  const jobs = await api("/jobs?status=OPEN&limit=20");

  console.log(`Open jobs received: ${jobs.data?.length ?? 0}`);

  for (const job of jobs.data ?? []) {
    console.log(
      `${job.id} | ${job.budgetUsdc} USDC | ${job.title}`
    );
  }
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
