# Entra ID, MFA, and GitHub access policies

Canonical runbook (Conditional Access, both app registrations, Key Vault mapping):

[life-insurance-crm-api `docs/security/entra-policies.md`](https://github.com/rleeson24/life-insurance-crm-api/blob/main/docs/security/entra-policies.md)

This repository is the **SPA**. MFA is enforced in Entra. The React app uses MSAL (`@azure/msal-browser` + `@azure/msal-react`) in local, Azure dev, and prod.

## SPA registration (this repo)

Create **`LifeInsuranceCRM-SPA`** as a **separate** Entra app from `LifeInsuranceCRM-API`. Do not put a client secret on the SPA.

| Setting | Value |
|---------|--------|
| Account type | Single tenant |
| Platform | Single-page application |
| Redirect URI (local) | `http://localhost:5387/` |
| Redirect URI (Azure) | Bicep output `clientRedirectUri` from the API infra deploy (exact match, trailing slash) |
| API permission | Delegated `api://life-insurance-crm/access_as_user` |
| Admin consent | Required |

MSAL will use the SPA application (client) ID, the directory tenant ID, and scope `api://life-insurance-crm/access_as_user`.

### Local

1. Copy [`src/.env.example`](../../src/.env.example) to `src/.env.local` (gitignored) and set `VITE_AZURE_AD_CLIENT_ID`, `VITE_AZURE_AD_TENANT_ID`, and `VITE_AZURE_AD_API_SCOPE`.
2. On the API, put the **API** registration in user secrets so local JWT validation is on:

```powershell
cd life-insurance-crm-api/src/main
dotnet user-secrets set "AzureAd:TenantId" "<tenant-id>"
dotnet user-secrets set "AzureAd:ClientId" "<api-client-id>"
dotnet user-secrets set "AzureAd:Audience" "api://life-insurance-crm"
```

3. Insert your Entra **Object ID** into `OrganizationUsers.UserId` using `life-insurance-crm-api/scripts/provision-organization-user.ps1 -Role SuperAdmin` (JWT `oid` must match). Do not use `NameIdentifier` / `sub`. After that, SuperAdmin creates organizations and maps users from the app; organization Admins manage users in their own tenant only.

How to deploy the SPA into the Azure Static Web App provisioned by API-repo Bicep: [azure-deploy.md](azure-deploy.md).

## GitHub (this repository)

1. Enable **2FA** on the GitHub account (TOTP or passkey). No shared admin accounts.
2. Protect **`main`**: no direct pushes, no force pushes, no deleting the branch. Merges go through a pull request.
3. Required status checks from `.github/workflows/ci.yml`: `secret-scan`, `vulnerability-scan`, `build`.
4. Required approving reviews: **0** while this is a solo maintainer; raise to **1** when a second person can review.

Portal: **Settings** → **Rules** → **Rulesets** → target `main`. CLI (after `gh auth login`):

```powershell
$payload = @'
{
  "name": "protect-main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["refs/heads/main"], "exclude": [] }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "required_review_thread_resolution": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "secret-scan" },
          { "context": "vulnerability-scan" },
          { "context": "build" }
        ]
      }
    }
  ]
}
'@
$payload | gh api --method POST repos/rleeson24/life-insurance-crm-client/rulesets --input -
```

Private personal repositories may need GitHub Pro for rulesets. If the API returns 403, use classic branch protection with the same checks.
