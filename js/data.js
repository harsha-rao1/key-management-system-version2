/**
 * Mock KMS data — SecureKey Vault simulated estate (frontend only).
 */

const VAULT_KEYS = [
  {
    id: "key_d91b7e32",
    name: "payment-hsm-key",
    type: "AES-256",
    purpose: "ENCRYPT_DECRYPT",
    status: "active",
    lifecycleState: "rotated",
    owner: "payments-team@acme-corp.com",
    created: "2024-01-10T11:30:00Z",
    expiry: "2026-01-10T11:30:00Z",
    storageLocation: "securekey-vault://cluster-eu-west-1/keys/key_d91b7e32",
    region: "eu-west-1",
    usage: "28,400 ops/day",
    currentVersion: 3,
    versions: [
      { num: 3, created: "2025-04-01T09:00:00Z", status: "active" },
      { num: 2, created: "2024-07-15T09:00:00Z", status: "legacy" },
      { num: 1, created: "2024-01-10T11:30:00Z", status: "retired" },
    ],
    applications: ["Payments API", "Billing Service", "Mobile Backend"],
    certificates: ["cert_payments", "cert_api"],
    migration: { migrated: ["Payments API"], pending: ["Billing Service", "Mobile Backend"] },
  },
  {
    id: "key_a8f3c21d",
    name: "prod-db-encryption",
    type: "AES-256",
    purpose: "ENCRYPT_DECRYPT",
    status: "active",
    lifecycleState: "active",
    owner: "platform@acme-corp.com",
    created: "2024-03-15T09:22:00Z",
    expiry: "2025-03-15T09:22:00Z",
    storageLocation: "securekey-vault://cluster-us-east-1/keys/key_a8f3c21d",
    region: "us-east-1",
    usage: "12,847 ops/day",
    currentVersion: 1,
    versions: [{ num: 1, created: "2024-03-15T09:22:00Z", status: "active" }],
    applications: ["Core Database Service", "Analytics ETL"],
    certificates: ["cert_db_internal"],
    migration: { migrated: ["Core Database Service", "Analytics ETL"], pending: [] },
  },
  {
    id: "key_b2e91f04",
    name: "api-signing-primary",
    type: "RSA-4096",
    purpose: "SIGN_VERIFY",
    status: "active",
    lifecycleState: "active",
    owner: "api-platform@acme-corp.com",
    created: "2024-06-01T14:00:00Z",
    expiry: "2025-06-01T14:00:00Z",
    storageLocation: "securekey-vault://cluster-us-east-1/keys/key_b2e91f04",
    region: "us-east-1",
    usage: "3,201 ops/day",
    currentVersion: 2,
    versions: [
      { num: 2, created: "2025-02-10T10:00:00Z", status: "active" },
      { num: 1, created: "2024-06-01T14:00:00Z", status: "legacy" },
    ],
    applications: ["Public API Gateway", "Webhook Dispatcher"],
    certificates: ["cert_api"],
    migration: { migrated: ["Public API Gateway"], pending: ["Webhook Dispatcher"] },
  },
  {
    id: "key_c7d45a88",
    name: "backup-tape-key",
    type: "AES-256",
    purpose: "WRAP_UNWRAP",
    status: "active",
    lifecycleState: "active",
    owner: "infra@acme-corp.com",
    created: "2023-11-20T08:00:00Z",
    expiry: "2025-05-20T08:00:00Z",
    storageLocation: "securekey-vault://cluster-us-west-2/keys/key_c7d45a88",
    region: "us-west-2",
    usage: "42 ops/day",
    currentVersion: 1,
    versions: [{ num: 1, created: "2023-11-20T08:00:00Z", status: "active" }],
    applications: ["Backup Orchestrator"],
    certificates: [],
    migration: { migrated: ["Backup Orchestrator"], pending: [] },
  },
  {
    id: "key_e3a56c90",
    name: "legacy-migration-key",
    type: "RSA-4096",
    purpose: "ENCRYPT_DECRYPT",
    status: "legacy",
    lifecycleState: "rotated",
    owner: "platform@acme-corp.com",
    created: "2022-08-05T16:45:00Z",
    expiry: "2024-08-05T16:45:00Z",
    storageLocation: "securekey-vault://cluster-us-east-1/keys/key_e3a56c90",
    region: "us-east-1",
    usage: "0 ops/day",
    currentVersion: 2,
    versions: [
      { num: 2, created: "2024-01-01T00:00:00Z", status: "legacy" },
      { num: 1, created: "2022-08-05T16:45:00Z", status: "retired" },
    ],
    applications: ["Legacy Monolith"],
    certificates: [],
    migration: { migrated: [], pending: ["Legacy Monolith"] },
  },
  {
    id: "key_f1b82d44",
    name: "compromised-test-key",
    type: "AES-256",
    purpose: "SIGN_VERIFY",
    status: "revoked",
    lifecycleState: "revoked",
    owner: "security@acme-corp.com",
    created: "2024-09-12T10:00:00Z",
    expiry: "—",
    storageLocation: "securekey-vault://cluster-us-east-1/keys/key_f1b82d44",
    region: "us-east-1",
    usage: "Revoked",
    currentVersion: 1,
    revokeReason: "Compromised",
    revokedAt: "2025-05-30T18:40:11Z",
    versions: [{ num: 1, created: "2024-09-12T10:00:00Z", status: "retired" }],
    applications: ["Sandbox API"],
    certificates: [],
    migration: { migrated: [], pending: [] },
  },
];

const CERTIFICATES = [
  {
    id: "cert_payments",
    name: "payments.company.com",
    expiry: "2025-09-30T23:59:59Z",
    status: "active",
    keyId: "key_d91b7e32",
    keyName: "payment-hsm-key",
    issuer: "eMudhra CA",
  },
  {
    id: "cert_api",
    name: "api.company.com",
    expiry: "2025-12-01T23:59:59Z",
    status: "active",
    keyId: "key_d91b7e32",
    keyName: "payment-hsm-key",
    issuer: "eMudhra CA",
  },
  {
    id: "cert_db_internal",
    name: "db-internal.acme.local",
    expiry: "2025-04-15T23:59:59Z",
    status: "active",
    keyId: "key_a8f3c21d",
    keyName: "prod-db-encryption",
    issuer: "ACME Internal CA",
  },
  {
    id: "cert_webhook",
    name: "webhooks.company.com",
    expiry: "2024-11-01T23:59:59Z",
    status: "revoked",
    keyId: "key_b2e91f04",
    keyName: "api-signing-primary",
    issuer: "eMudhra CA",
    revokedAt: "2025-03-01T12:00:00Z",
  },
];

const AUDIT_EVENTS = [
  {
    timestamp: "2025-05-31T14:22:18Z",
    displayTime: "Today 2:22 PM",
    action: "KEY_DECRYPT",
    resource: "prod-db-encryption",
    keyId: "key_a8f3c21d",
    actor: "app-prod-api@acme",
    actorDisplay: "App Service",
    ip: "10.0.4.22",
    result: "SUCCESS",
    flagged: false,
  },
  {
    timestamp: "2025-05-31T13:55:02Z",
    displayTime: "Today 1:55 PM",
    action: "KEY_ROTATED",
    resource: "legacy-migration-key",
    keyId: "key_e3a56c90",
    keyName: "legacy-migration-key",
    actor: "admin@acme-corp.com",
    actorDisplay: "Sarah Admin",
    ip: "203.0.113.45",
    result: "SUCCESS",
    flagged: false,
  },
  {
    timestamp: "2025-05-31T12:30:44Z",
    displayTime: "Today 12:30 PM",
    action: "KEY_GENERATED",
    resource: "staging-webhook-signer",
    keyId: "key_g7c23a01",
    actor: "admin@acme-corp.com",
    actorDisplay: "Sarah Admin",
    ip: "203.0.113.45",
    result: "SUCCESS",
    flagged: false,
  },
  {
    timestamp: "2025-05-31T02:14:33Z",
    displayTime: "Today 2:14 AM",
    action: "KEY_DECRYPT",
    resource: "prod-db-encryption",
    keyId: "key_a8f3c21d",
    keyName: "db-prod-aes-01",
    actor: "svc-backup@acme",
    actorDisplay: "Backup Service",
    ip: "192.168.4.22",
    result: "SUCCESS",
    flagged: true,
  },
  {
    timestamp: "2025-05-30T18:40:11Z",
    displayTime: "Yesterday 6:40 PM",
    action: "KEY_REVOKED",
    resource: "compromised-test-key",
    keyId: "key_f1b82d44",
    keyName: "compromised-test-key",
    actor: "security@acme-corp.com",
    actorDisplay: "Security Team",
    ip: "203.0.113.12",
    result: "SUCCESS",
    flagged: false,
  },
  {
    timestamp: "2025-05-28T10:00:00Z",
    displayTime: "2025-05-28 10:00 UTC",
    action: "CERTIFICATE_RENEWED",
    resource: "payments.company.com",
    keyId: "key_d91b7e32",
    actor: "admin@acme-corp.com",
    actorDisplay: "Sarah Admin",
    ip: "203.0.113.45",
    result: "SUCCESS",
    flagged: false,
  },
];

const KMS_USERS = [
  {
    id: "user_john",
    name: "John Smith",
    email: "john@acme-corp.com",
    role: "admin",
    roleLabel: "Admin",
    initials: "JS",
    status: "active",
    lastActive: "2025-05-31T14:20:00Z",
  },
  {
    id: "user_rahul",
    name: "Rahul Sharma",
    email: "rahul@acme-corp.com",
    role: "developer",
    roleLabel: "Developer",
    initials: "RS",
    status: "active",
    lastActive: "2025-05-31T11:05:00Z",
  },
  {
    id: "user_priya",
    name: "Priya Nair",
    email: "priya@acme-corp.com",
    role: "auditor",
    roleLabel: "Auditor",
    initials: "PN",
    status: "active",
    lastActive: "2025-05-30T16:42:00Z",
  },
  {
    id: "user_sarah",
    name: "Sarah Admin",
    email: "admin@acme-corp.com",
    role: "admin",
    roleLabel: "Admin",
    initials: "SA",
    status: "active",
    lastActive: "2025-05-31T14:30:00Z",
  },
];

const ACCESS_OVERRIDES = {};

function getKeyAccessForUser(user, key) {
  const override = ACCESS_OVERRIDES?.[user.id]?.[key.id];
  if (override && typeof override.allowed === "boolean") {
    return override.allowed
      ? { allowed: true, actions: "Allowed (override)", reason: null }
      : { allowed: false, actions: "—", reason: "Denied (override)" };
  }
  if (user.role === "admin") {
    return {
      allowed: true,
      actions: "All (provision, rotate, revoke, encrypt, decrypt, sign)",
      reason: null,
    };
  }
  if (user.role === "auditor") {
    return {
      allowed: false,
      actions: "Audit logs, metadata (read-only)",
      reason: "Auditors cannot perform cryptographic operations on production keys",
    };
  }
  if (user.role === "developer") {
    const assigned = ["key_d91b7e32", "key_a8f3c21d", "key_b2e91f04"];
    if (assigned.includes(key.id)) {
      return { allowed: true, actions: "Encrypt, decrypt, sign (assigned key)", reason: null };
    }
    return { allowed: false, actions: "—", reason: "Developer not assigned to this key" };
  }
  return { allowed: false, actions: "—", reason: "Unknown role" };
}

function setAccessOverride(userId, keyId, allowed) {
  if (!ACCESS_OVERRIDES[userId]) ACCESS_OVERRIDES[userId] = {};
  ACCESS_OVERRIDES[userId][keyId] = { allowed: !!allowed };
}

const DASHBOARD_ACTIVITY = [
  { icon: "🔑", title: "Vault rotation: payment-hsm-key (v2 → v3)", meta: "2025-04-01 · admin@acme-corp.com" },
  { icon: "✦", title: "Key generated in vault: staging-webhook-signer", meta: "2025-05-31T12:30:44Z · admin@acme-corp.com" },
  { icon: "⚠", title: "Off-hours access flagged: prod-db-encryption", meta: "2025-05-31T02:14:33Z · svc-backup@acme" },
  { icon: "🚫", title: "Key revoked: compromised-test-key", meta: "2025-05-30T18:40:11Z · security@acme-corp.com" },
];

const API_AUTH_LINE = `<span class="key">Authorization</span>: <span class="val">Bearer &lt;your-api-key&gt;</span>`;

const API_ENDPOINTS = [
  {
    method: "POST",
    path: "/v1/keys",
    description: "Generate a new cryptographic key",
    danger: false,
    request: `// Request
<span class="method">POST</span> <span class="path">/v1/keys</span>
${API_AUTH_LINE}
Content-Type: application/json

{
  <span class="key">"name"</span>: <span class="val">"prod-api-signing"</span>,
  <span class="key">"type"</span>: <span class="val">"AES-256"</span>,
  <span class="key">"purpose"</span>: <span class="val">"SIGN_VERIFY"</span>,
  <span class="key">"expiry_days"</span>: <span class="val">365</span>
}`,
    response: `// Response <span class="val">201 Created</span>
{
  <span class="key">"key_id"</span>: <span class="val">"key_f4e92b17"</span>,
  <span class="key">"status"</span>: <span class="val">"active"</span>,
  <span class="key">"version"</span>: <span class="val">1</span>,
  <span class="key">"storage"</span>: <span class="val">"securekey-vault://..."</span>
}`,
  },
  {
    method: "GET",
    path: "/v1/keys",
    description: "List all keys with filters",
    danger: false,
    request: `// Request
<span class="method">GET</span> <span class="path">/v1/keys?status=active&amp;type=AES-256</span>
${API_AUTH_LINE}`,
    response: `// Response <span class="val">200 OK</span>`,
  },
  {
    method: "POST",
    path: "/v1/keys/{id}/rotate",
    description: "Rotate an existing key (creates new version)",
    danger: false,
    request: `// Request
<span class="method">POST</span> <span class="path">/v1/keys/key_a8f3c21d/rotate</span>
${API_AUTH_LINE}`,
    response: `// Response — new version active, prior version legacy`,
  },
  {
    method: "POST",
    path: "/v1/keys/{id}/revoke",
    description: "Immediately revoke a key",
    danger: true,
    request: `// Request — reason required`,
    response: `// Response — new encryptions blocked`,
  },
  {
    method: "GET",
    path: "/v1/audit",
    description: "Retrieve audit log events",
    danger: false,
    request: `// Request`,
    response: `// Response`,
  },
];

function getCertById(id) {
  return CERTIFICATES.find((c) => c.id === id);
}

function getCertsForKey(key) {
  return (key.certificates || []).map((id) => CERTIFICATES.find((c) => c.id === id)).filter(Boolean);
}
