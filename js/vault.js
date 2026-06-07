/**
 * SecureKey Vault — simulated internal KMS layer (frontend only).
 * Models key storage, versioning, rotation, revocation, and audit without real crypto.
 */
(function (global) {
  "use strict";

  const LIFECYCLE_STEPS = ["generated", "active", "rotated", "revoked", "destroyed"];

  function nowIso() {
    return new Date().toISOString();
  }

  function formatDisplayTime(iso) {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return iso.replace("T", " ").replace("Z", " UTC");
  }

  function getActiveVersion(key) {
    if (!key.versions?.length) return { num: key.currentVersion || 1, status: "active", created: key.created };
    return (
      key.versions.find((v) => v.status === "active") ||
      key.versions[key.versions.length - 1]
    );
  }

  function getCurrentVersionNum(key) {
    const av = getActiveVersion(key);
    return av.num;
  }

  function syncKeyFromVersions(key) {
    const active = key.versions.find((v) => v.status === "active");
    if (active) {
      key.currentVersion = active.num;
      if (key.status !== "revoked" && key.status !== "destroyed") {
        key.status = "active";
      }
    }
    const hasLegacy = key.versions.some((v) => v.status === "legacy");
    if (hasLegacy && key.status === "active") {
      key.lifecycleState = "rotated";
    }
  }

  function addAudit(action, resource, keyId, keyName, extra) {
    AUDIT_EVENTS.unshift({
      timestamp: nowIso(),
      displayTime: "Just now",
      action,
      keyId: keyId || "—",
      keyName: keyName || resource,
      resource,
      actor: "admin@acme-corp.com",
      actorDisplay: "Sarah Admin",
      ip: "203.0.113.45",
      result: "SUCCESS",
      flagged: false,
      ...extra,
    });
  }

  function rotateKey(keyId) {
    const key = VAULT_KEYS.find((k) => k.id === keyId);
    if (!key || key.status === "revoked" || key.status === "destroyed") return null;

    const prevNum = getCurrentVersionNum(key);
    const newNum = prevNum + 1;
    const ts = nowIso();

    key.versions.forEach((v) => {
      if (v.status === "active") v.status = "legacy";
    });
    key.versions.unshift({
      num: newNum,
      created: ts,
      status: "active",
    });
    key.currentVersion = newNum;
    key.lastRotated = ts;
    key.lifecycleState = "rotated";
    key.status = "active";

    if (!key.migration) {
      key.migration = { migrated: [], pending: [] };
    }
    key.migration.migrated = key.applications?.slice(0, 1) || [];
    key.migration.pending = (key.applications || []).slice(1);

    syncKeyFromVersions(key);
    addAudit("KEY_ROTATED", key.name, key.id, key.name);

    DASHBOARD_ACTIVITY.unshift({
      icon: "🔑",
      title: `Vault rotation: ${key.name} (v${prevNum} → v${newNum})`,
      meta: `${formatDisplayTime(ts)} · admin@acme-corp.com`,
    });

    return { key, oldVersion: prevNum, newVersion: newNum, rotatedAt: ts };
  }

  function bulkRotateKeys(keyIds) {
    const results = [];
    keyIds.forEach((id) => {
      const r = rotateKey(id);
      if (r) results.push(r);
    });
    if (results.length > 1) {
      DASHBOARD_ACTIVITY.unshift({
        icon: "🔑",
        title: `Bulk vault rotation: ${results.length} keys rotated`,
        meta: `${formatDisplayTime(nowIso())} · admin@acme-corp.com`,
      });
    }
    return results;
  }

  function revokeKey(keyId, reason) {
    const key = VAULT_KEYS.find((k) => k.id === keyId);
    if (!key || key.status === "revoked" || key.status === "destroyed") return null;

    const ts = nowIso();
    key.status = "revoked";
    key.lifecycleState = "revoked";
    key.revokeReason = reason;
    key.revokedAt = ts;
    key.expiry = "—";
    key.usage = "Revoked";

    key.versions.forEach((v) => {
      if (v.status === "active" || v.status === "legacy") v.status = "retired";
    });

    addAudit("KEY_REVOKED", key.name, key.id, key.name, { revokeReason: reason });

    DASHBOARD_ACTIVITY.unshift({
      icon: "🚫",
      title: `Key revoked: ${key.name} (${reason})`,
      meta: `${formatDisplayTime(ts)} · admin@acme-corp.com`,
    });

    return { key, reason, revokedAt: ts };
  }

  function generateKeyInVault(opts) {
    const hex = Math.random().toString(16).slice(2, 10);
    const id = `key_${hex}`;
    const ts = nowIso();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (opts.expiryDays || 365));

    const key = {
      id,
      name: opts.name || "new-vault-key",
      type: opts.type || "AES-256",
      purpose: opts.purpose || "ENCRYPT_DECRYPT",
      status: "active",
      lifecycleState: "active",
      owner: "admin@acme-corp.com",
      created: ts,
      expiry: expiry.toISOString(),
      storageLocation: `securekey-vault://cluster-us-east-1/keys/${id}`,
      region: "us-east-1",
      usage: "0 ops/day",
      currentVersion: 1,
      versions: [{ num: 1, created: ts, status: "active" }],
      applications: [],
      certificates: [],
      migration: { migrated: [], pending: [] },
    };

    VAULT_KEYS.unshift(key);
    addAudit("KEY_GENERATED", key.name, key.id, key.name);
    DASHBOARD_ACTIVITY.unshift({
      icon: "✦",
      title: `Key generated in vault: ${key.name}`,
      meta: `${formatDisplayTime(ts)} · admin@acme-corp.com`,
    });

    return key;
  }

  function renewCertificate(certId) {
    const cert = CERTIFICATES.find((c) => c.id === certId);
    if (!cert) return null;
    const ts = nowIso();
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    cert.expiry = expiry.toISOString();
    cert.status = "active";
    cert.lastRenewed = ts;
    addAudit("CERTIFICATE_RENEWED", cert.name, cert.keyId, cert.name);
    return cert;
  }

  function revokeCertificate(certId) {
    const cert = CERTIFICATES.find((c) => c.id === certId);
    if (!cert) return null;
    cert.status = "revoked";
    cert.revokedAt = nowIso();
    addAudit("CERTIFICATE_REVOKED", cert.name, cert.keyId, cert.name);
    return cert;
  }

  function isKeyPendingRotation(key) {
    if (key.status !== "active" || !key.expiry || key.expiry === "—") return false;
    const days = (new Date(key.expiry) - new Date()) / 86400000;
    return days <= 30;
  }

  function getPendingRotationKeys() {
    return VAULT_KEYS.filter(isKeyPendingRotation);
  }

  function getDashboardMetrics() {
    const keys = VAULT_KEYS;
    const legacyKeys = keys.filter((k) => k.versions?.some((v) => v.status === "legacy")).length;
    const pendingRotations = keys.filter((k) => {
      if (k.status !== "active") return false;
      const exp = k.expiry && k.expiry !== "—" ? new Date(k.expiry) : null;
      if (!exp) return false;
      const days = (exp - new Date()) / (86400000);
      return days <= 30;
    }).length;

    const appSet = new Set();
    keys.forEach((k) => (k.applications || []).forEach((a) => appSet.add(a)));

    return {
      totalKeys: keys.length,
      activeKeys: keys.filter((k) => k.status === "active").length,
      legacyKeys,
      revokedKeys: keys.filter((k) => k.status === "revoked").length,
      destroyedKeys: keys.filter((k) => k.status === "destroyed").length,
      certificates: CERTIFICATES.length,
      applicationsUsingKeys: appSet.size,
      pendingRotations,
    };
  }

  function getLifecycleIndex(state) {
    const map = { generated: 0, active: 1, rotated: 2, revoked: 3, destroyed: 4 };
    return map[state] ?? 1;
  }

  global.SecureKeyVault = {
    LIFECYCLE_STEPS,
    getActiveVersion,
    getCurrentVersionNum,
    getLifecycleIndex,
    rotateKey,
    bulkRotateKeys,
    revokeKey,
    generateKeyInVault,
    renewCertificate,
    revokeCertificate,
    getDashboardMetrics,
    isKeyPendingRotation,
    getPendingRotationKeys,
    formatDisplayTime,
    addAudit,
  };
})(typeof window !== "undefined" ? window : global);
