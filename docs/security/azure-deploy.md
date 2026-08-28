# Azure client deploy

The **BrokerBook API** repo owns the Bicep platform (`infra/`). This repo only publishes the Vite SPA into the Static Web App that infra already created.

## Split of responsibility

| Repo | What it does |
|------|----------------|
| BrokerBook API | Deploys Bicep (SQL, Key Vault, ACR, Container Apps, Static Web App, OIDC). Deploys the API container image. |
| BrokerBook client (this repo) | `npm run build` and uploads `dist` to Azure Static Web Apps. |

Do not copy Bicep into this repository. CORS, the API FQDN, and the client origin are wired in the API infra stack.

## One-time GitHub setup

1. Deploy infrastructure from the API repo (`deploy-infrastructure.yml` or `scripts/deploy-infra-dev.ps1`).
2. Copy these outputs from that deployment:

| Output | Where it goes |
|--------|----------------|
| `githubClientDeployClientId` | GitHub environment secret `AZURE_CLIENT_ID` **in this repo** |
| Tenant ID | `AZURE_TENANT_ID` |
| Subscription ID | `AZURE_SUBSCRIPTION_ID` |

Use a **different** `AZURE_CLIENT_ID` than the API repo. The API identity is Contributor on the resource group; the client identity can only update the Static Web App and read the API Container App FQDN.

3. Create GitHub Environments `dev` and `prod` in this repository (names must match the Bicep `environment` parameter).
4. After the first infra deploy, add the Bicep output `clientRedirectUri` (for example `https://<hostname>.azurestaticapps.net/`) as an Entra **SPA** redirect URI on `BrokerBookCRM-SPA`. See [entra-policies.md](entra-policies.md).
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
2. Resolves the Static Web App and API Container App in that resource group.
3. Builds with `VITE_API_BASE_URL` set to `https://<api-fqdn>` and the Entra SPA variables above.
4. Fetches a short-lived SWA deployment token from Azure and uploads `src/dist`.

The SPA origin is already in API `Cors:AllowedOrigins` from Bicep. MSAL uses that origin as the redirect URI.
