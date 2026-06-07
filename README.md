# SecureKey — Enterprise Key Management Prototype

A **vault-centric** client-side prototype that simulates how **SecureKey Vault** works internally: key creation, storage, versioning, rotation, revocation, certificate mapping, and audit tracking. All data is mocked; no backend, HSM, or HashiCorp Vault integration.

**Powered by eMudhra** — demo tenant: ACME Corp Financial Services.

## Run locally

Open `index.html` in a browser, or:

```bash
npx serve .
```

Then open the URL shown (e.g. `http://localhost:3000`). Use **Sign In to Console** on the login screen.

## What this MVP demonstrates

| Question | Where to see it |
|----------|-----------------|
| Where is a key stored? | **SecureKey Vault** → Storage Location; **Key Detail** → Metadata |
| How is a key generated? | **Generate Key** → 6-step pipeline modal → v1 stored → audit |
| How are versions managed? | **Key Detail** → Version History (Active / Legacy / Retired) |
| What happens on rotation? | Single or **bulk rotate** → new version active, old legacy, migration status |
| What happens on revocation? | **Revoke Key** → reason, affected apps, recovery plan |
| How are certificates linked? | **Certificates** → Certificate → Key → Version chain |

## Screens

| Screen | Description |
|--------|-------------|
| Dashboard | 5 metrics (total, active, revoked, certificates, pending rotations), recent activity, keys needing rotation |
| SecureKey Vault | Key repository; filters (All, Pending Rotation, Active, Legacy, Revoked); single + bulk rotate |
| Key Detail | Metadata, lifecycle, version history, apps, certificates; rotate / revoke |
| Generate Key | Form + simulated vault provisioning pipeline |
| Certificates | List; detail with renew/revoke and key chain |
| Audit Logs | Timestamp, user, action, resource, status |
| Users & Roles | RBAC story + editable Manage Access per key |
| API Access | REST endpoint reference; regenerate API key (demo) |
| AI Insights | Anomaly Detection + Compliance Assistant (roadmap preview) |

## Key workflows

### SecureKey Vault
- **Open** — full key detail page
- **Rotate** — per-row rotation with migration modal
- **Pending Rotation** filter — auto-selects expiring keys
- **Bulk Rotate Selected** — rotate multiple keys at once
- **Rotate next key →** — continue after single rotation

### Revocation
- Reason: Compromised, Employee Exit, Security Incident, Manual Revocation
- Shows: what happens next, affected applications, recovery plan

### Generate Key
1. Admin request → validation → vault generates key → v1 → metadata → audit

## Stack

- HTML5, CSS3 (`css/variables.css`, `css/main.css`)
- Vanilla JavaScript: `js/data.js`, `js/vault.js`, `js/app.js`
- IBM Plex Sans + Mono (Google Fonts)

## Demo limits

- No real cryptography, HSM, or persistent storage (refresh resets session)
- AI Insights and API docs are static demo content
- PDF downloads show toast only (no real files)
