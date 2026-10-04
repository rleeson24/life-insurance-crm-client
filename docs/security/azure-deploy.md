# Azure client deploy

The **BrokerBook API** repo owns the Bicep platform (`infra/`). This repo builds the Vite SPA into an nginx image and deploys it to the web Container App that infra already created.

## Split of responsibility

| Repo | What it does |
|------|----------------|
| BrokerBook API | Deploys Bicep (SQL, Key Vault, ACR, Container Apps for the API and the web UI, OIDC). Deploys the API container image. |
| BrokerBook client (this repo) | Builds `src/Dockerfile` and updates the web Container App image. |

Do not copy Bicep into this repository. CORS, the API FQDN, and the client origin are wired in the API infra stack.

## One-time GitHub setup

1. Deploy infrastructure from the API repo (`deploy-infrastructure.yml` or `scripts/deploy-infra-dev.ps1`).
2. Copy these outputs from that deployment:

| Output | Where it goes |
|--------|----------------|
| `githubClientDeployClientId` | GitHub environment secret `AZURE_CLIENT_ID` **in this repo** |
| Tenant ID | `AZURE_TENANT_ID` |
| Subscription ID | `AZURE_SUBSCRIPTION_ID` |

Use a **different** `AZURE_CLIENT_ID` than the API repo. The API identity has **BrokerBook GitHub Deployer** on the resource group (it cannot delete SQL, backups, logs, or locks, or export the database). The client identity can push to ACR, update the web Container App, and read the API Container App FQDN.

3. Create GitHub Environments `dev` and `prod` in this repository (names must match the Bicep `environment` parameter).
4. After the first infra deploy, add the Bicep output `clientRedirectUri` (for example `https://bbcrm-dev-web.<env>.azurecontainerapps.io/`) as an Entra **SPA** redirect URI on `BrokerBookCRM-SPA`. See [entra-policies.md](entra-policies.md).
5. Set GitHub **environment variables** (not secrets — these are public in the SPA bundle) on `dev` and `prod`:

| Variable | Value |
|----------|--------|
| `VITE_AZURE_AD_CLIENT_ID` | SPA application (client) ID |
| `VITE_AZURE_AD_TENANT_ID` | Directory (tenant) ID |
| `VITE_AZURE_AD_API_SCOPE` | `api://6c970234-fee3-4568-97d8-7d015c903368/access_as_user` |

## Deploy

Run **Deploy client** (`deploy-client.yml`) with:

- environment: `dev` or `prod`
- resource group: the same group the API infra deployed (for example `rg-bbcrm-dev`)

The workflow:

1. Signs in with OIDC (no long-lived Azure secret).
2. Reads the web Container App's registry and the API Container App FQDN.
3. Builds `src/Dockerfile` with `VITE_API_BASE_URL` set to `https://<api-fqdn>` and the Entra SPA variables above.
4. Pushes the image to ACR by digest and updates the web Container App.

The SPA origin is already in API `Cors:AllowedOrigins` from Bicep. MSAL uses that origin as the redirect URI.
