# Staging operations

## 1. Deployment contract

**Target:** the dedicated `ms-agentic-staging` Google Cloud project in `us-east4`. The API service is `ms-agentic-api`; its separate worker pool is `ms-agentic-worker`. One immutable image supplies the API, worker, and migration entrypoints. The application binds synthetic smoke access to one configured account and channel through a high-entropy bearer token stored in Secret Manager.

**Current readiness:** database creation and connection URLs, the E2B key, paid cloud provisioning, deployment, and live acceptance remain pending. A bootstrap deployment exposes public health and reports incomplete readiness with HTTP 503. It does not prove foreground execution, queued execution, file retention/restoration, or redeployment. Full acceptance requires all of those observations on the same candidate.

The selected runtime allocation is one manually scaled API instance and one manually scaled worker instance, each with 1 vCPU and 1 GiB RAM. The API uses instance-based billing and public ingress; protected operations require application authentication. The worker has no HTTP ingress.

### 1.1 Resources and retention

| Resource | Staging contract |
| --- | --- |
| Artifact Registry | `us-east4-docker.pkg.dev/ms-agentic-staging/backend/backend` |
| Private network/subnet | `ms-agentic-private`, `10.42.0.0/24` |
| Queue | `ms-agentic-queue`: Valkey, cluster mode disabled, one `custom-pico` shard, zero replicas, AOF every second, `noeviction`, private PSC and TLS |
| Retained files | `gs://ms-agentic-staging-analysis`, regional Standard storage, uniform access, public access prevention, no age-based expiry |
| Application identity | `ms-agentic-runtime@ms-agentic-staging.iam.gserviceaccount.com` |
| Migration identity | `ms-agentic-migrate@ms-agentic-staging.iam.gserviceaccount.com` |
| Deployment identity | `github-deploy@ms-agentic-staging.iam.gserviceaccount.com` |
| Database | Dedicated Tiger Cloud Performance service in AWS `us-east-1`; creation and credentials deferred |

Queue persistence accepts maintenance downtime and loss of recent unflushed writes. Application deployment must preserve Valkey, PostgreSQL, and GCS data. Retained storage grows until an approved cleanup policy exists. The USD 250 monthly planning allowance is an estimate, not an enforced billing limit; the selected always-on allocation is approximately USD 138 monthly before storage, traffic, model/sandbox calls, and other usage.

## 2. Provisioning and credentials

The operator must use an authenticated Google Cloud CLI account with project, organization, billing, network, and IAM permissions. Provisioning derives the organization and billing account from `mystacks-staging`, verifies the target relationship, and changes only this project's resources. If billing linkage is denied, the operator must obtain `billing.resourceAssociations.create` or link the project through an authorized billing administrator before creating billable resources.

The provisioning command contract is:

```sh
bash scripts/cloud/configure-identity.sh
bash scripts/cloud/provision-staging.sh
bash scripts/cloud/configure-runtime.sh
```

The first command configures identities and GitHub federation without creating billable runtime resources. The second resumes an existing target project and provisions the selected resources. The third stores the provider's public Valkey CA bundle. The Valkey client verifies the certificate against that bundle; operators must refresh it before an announced CA rotation.

### 2.1 Secret ownership

| Secret | Consumer | Approved source |
| --- | --- | --- |
| `openai-api-key` | API and worker | Only `OPENAI_API_KEY` from the local reference application's environment |
| `staging-auth-token` | API and operational smoke runner | Newly generated high-entropy synthetic bearer token |
| `database-url` | API and worker | Application database role; pending |
| `migrate-database-url` | Migration job only | Separate database schema owner/migration role; pending |
| `e2b-api-key` | API and worker | Intended E2B account; pending |
| `valkey-ca-cert` | API and worker | Public CA bundle returned by this project's Valkey instance |

Secret containers do not imply usable versions. Add secret values through local files or stdin with `gcloud secrets versions add`; never put values in workflow variables, command arguments, Git, logs, or chat. Runtime identities cannot read the migration secret. The deployment identity can read only the smoke bearer secret; Cloud Run resolves the other secret references using its assigned runtime identities.

GitHub federation must restrict numeric owner `280283955`, numeric repository `1432887469`, and the exact subject `repo:hsignals/ms-agentic-be:environment:staging`. The GitHub `staging` environment owns deployment access. No service-account key file is needed.

## 3. Releases and recovery

The manual `Deploy ms-agentic staging` workflow owns releases once its definition exists on the default branch. GitHub cannot dispatch a workflow that exists only on an unmerged feature branch. Initial authorized staging verification can run the same release script locally with a recorded commit, immutable digest, and deployment identity; it does not prove GitHub Actions deployment or authorize merging. It serializes runs without cancelling an active deployment, verifies code and the container, builds once, resolves an immutable digest, and uses that same digest for migration, API, and worker. An optional existing `sha256:` digest selects a recovery image; it does not rebuild that image.

- **`bootstrap`:** deploy the API health surface while deferred dependencies remain absent. Keep a worker disabled. Report full acceptance as pending.
- **`full`:** require enabled versions of every runtime and migration secret, run storage initialization using the migration identity, deploy both entrypoints, verify deployment identity/readiness, and run authenticated foreground/background/file smoke tests.

A bootstrap request must fail if an existing live worker would otherwise be silently left running. Database changes must be compatible with the previous application image. Recovery never down-migrates a database.

### 3.1 Stop/start handoff

The API has foreground operations and queue submission; the worker is the sole background consumer. Product channel-coordinator behavior remains future work.

Before replacement, the release saves the previous digest and configuration, removes API revision tags, sets native service scaling to zero, and disables the worker pool. Tagged API revisions remain callable when only service scaling is disabled, so clearing tags is required. The release must observe a fresh zero-instance sample from Cloud Monitoring before starting a replacement. A successful scaling command alone is insufficient evidence.

If the provider does not emit an explicit zero sample within the bounded wait, the release stops with the resources disabled and reports the evidence gap. It must not infer shutdown from missing metrics. For a first deployment with no previous resource, this drain gate is unnecessary. Cloud Run documents [manual zero scaling and tagged revision behavior](https://docs.cloud.google.com/run/docs/configuring/services/manual-scaling) and [worker-pool shutdown by scaling to zero](https://docs.cloud.google.com/run/docs/managing/workerpools).

If deployment or verification fails, use the saved image digest and configuration to recover through the same serialized release path. If only the shutdown evidence gate failed and the image was never replaced, the operator may restore the unchanged resources with:

```sh
gcloud run services update ms-agentic-api --project=ms-agentic-staging --region=us-east4 --scaling=1
gcloud run worker-pools update ms-agentic-worker --project=ms-agentic-staging --region=us-east4 --instances=1
```

Restore the worker only when it existed and its database and E2B configuration remain valid. Keep the failing workflow's configuration snapshots and error output. Report partial deployment explicitly; a healthy API does not prove a healthy worker.

## 4. Acceptance evidence

Run operational smoke tests against the deployed URL with the bearer token loaded from Secret Manager into the runner's environment. The test runner must never print it. The command contract is:

```sh
bun --no-env-file scripts/smoke/staging.ts
```

The full test requires public health, unauthenticated rejection, real authenticated foreground execution, queued execution with native E2B tool activity, known calculation output, retained-file retrieval, and restoration in a fresh sandbox. Readiness and result checks must verify the expected deployment identity. Synthetic endpoints do not implement customer identity onboarding or channel linking.

Record the tested commit, workflow URL, image digest, API revision, worker revision, smoke results, file IDs, storage use, provider usage, and remaining gaps. A second deployment must prove existing records/files and a waiting job survive replacement. Automated checks do not provide the contributor's personal acceptance; runtime and deployment pull requests stay in draft until that requirement is met.

### 4.1 Provider references

The provisioning flags use current native [Valkey creation options](https://docs.cloud.google.com/sdk/gcloud/reference/memorystore/instances/create), [one-second AOF persistence](https://docs.cloud.google.com/memorystore/docs/valkey/manage-persistence), [private service connectivity](https://docs.cloud.google.com/memorystore/docs/valkey/networking), and [per-instance certificate authorities](https://docs.cloud.google.com/memorystore/docs/valkey/manage-in-transit-encryption). Native [Cloud Run worker pools](https://docs.cloud.google.com/run/docs/deploy-worker-pools) supply continuous background execution without an HTTP service.
