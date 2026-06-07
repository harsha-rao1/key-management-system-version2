/**
 * SecureKey KMS — vault-centric MVP controller (frontend simulation).
 */

(function () {
  "use strict";

  const V = SecureKeyVault;
  let currentScreen = "dashboard";
  let viewedKeyId = null;
  let viewedCertId = null;
  let vaultFilter = "all";
  let rotateFromVault = false;
  let lastRotatedKeyId = null;
  const vaultSelectedKeys = new Set();
  let manageAccessDirty = false;
  let viewedUserId = null;
  const SPLASH_DURATION_MS = 2000;

  const loginScreen = document.getElementById("login-screen");
  const splashScreen = document.getElementById("splash-screen");
  const splashProgressBar = document.getElementById("splash-progress-bar");
  const appShell = document.getElementById("app-shell");
  const loginBtn = document.getElementById("login-btn");
  const toastEl = document.getElementById("toast");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const navItems = document.querySelectorAll(".nav-item[data-screen]");
  const screens = document.querySelectorAll(".screen");

  function formatTs(iso) {
    if (!iso || iso === "—") return "—";
    return iso.replace("T", " ").replace("Z", " UTC");
  }

  function formatDateShort(iso) {
    if (!iso || iso === "—") return "—";
    return iso.split("T")[0];
  }

  function statusBadgeClass(status) {
    const map = { active: "active", legacy: "rotated", revoked: "revoked", destroyed: "revoked", rotated: "rotated" };
    return map[status] || "pending";
  }

  function versionStatusLabel(s) {
    const labels = { active: "Active", legacy: "Legacy", retired: "Retired", destroyed: "Destroyed" };
    return labels[s] || s;
  }

  // ─── Login / splash ───
  loginBtn.addEventListener("click", () => {
    loginScreen.classList.add("hidden");
    splashScreen.classList.add("visible");
    splashScreen.setAttribute("aria-busy", "true");
    requestAnimationFrame(() => splashProgressBar.classList.add("fill"));
    setTimeout(() => {
      splashScreen.classList.add("fade-out");
      splashScreen.setAttribute("aria-busy", "false");
      setTimeout(() => {
        splashScreen.classList.remove("visible", "fade-out");
        splashProgressBar.classList.remove("fill");
        appShell.classList.add("visible");
        refreshDashboard();
      }, 500);
    }, SPLASH_DURATION_MS);
  });

  // ─── Navigation ───
  function navigateTo(screenId, breadcrumbLabel) {
    currentScreen = screenId;
    screens.forEach((s) => s.classList.toggle("active", s.id === `screen-${screenId}`));
    navItems.forEach((n) => n.classList.toggle("active", n.dataset.screen === screenId));
    const label = breadcrumbLabel || screenId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    breadcrumbEl.innerHTML = `Home / <strong>${label}</strong>`;
    if (screenId === "dashboard") refreshDashboard();
    if (screenId === "securekey-vault") renderVaultTable();
    if (screenId === "certificates") renderCertificatesTable();
    if (screenId === "audit-logs") renderAuditTable();
  }

  function navigateToKeyDetail(keyId) {
    viewedKeyId = keyId;
    const key = VAULT_KEYS.find((k) => k.id === keyId);
    if (!key) return;
    renderKeyDetailPage(key);
    currentScreen = "key-detail";
    screens.forEach((s) => s.classList.toggle("active", s.id === "screen-key-detail"));
    navItems.forEach((n) => n.classList.remove("active"));
    breadcrumbEl.innerHTML = `Home / <a href="#" id="breadcrumb-vault-link" style="color:var(--text2);text-decoration:none;">SecureKey Vault</a> / <strong>${key.name}</strong>`;
    document.getElementById("breadcrumb-vault-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("securekey-vault", "SecureKey Vault");
    });
  }

  function navigateToCertDetail(certId) {
    viewedCertId = certId;
    const cert = CERTIFICATES.find((c) => c.id === certId);
    if (!cert) return;
    renderCertDetailPage(cert);
    screens.forEach((s) => s.classList.toggle("active", s.id === "screen-certificate-detail"));
    navItems.forEach((n) => n.classList.remove("active"));
    breadcrumbEl.innerHTML = `Home / Certificates / <strong>${cert.name}</strong>`;
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => navigateTo(item.dataset.screen, item.dataset.breadcrumb));
  });

  document.querySelectorAll("[data-screen]").forEach((el) => {
    if (el.classList.contains("nav-item")) return;
    el.addEventListener("click", () => navigateTo(el.dataset.screen));
  });

  document.querySelectorAll(".nav-to-generate").forEach((btn) => {
    btn.addEventListener("click", () => navigateTo("generate-key", "Generate Key"));
  });

  document.getElementById("view-all-activity").addEventListener("click", () => navigateTo("audit-logs", "Audit Logs"));
  document.getElementById("key-detail-back-btn").addEventListener("click", () => navigateTo("securekey-vault", "SecureKey Vault"));
  document.getElementById("cert-detail-back-btn").addEventListener("click", () => navigateTo("certificates", "Certificates"));

  // ─── Modals ───
  function openModal(id, animateIn) {
    document.getElementById(id).classList.add("open");
    if (animateIn) {
      const modal = document.querySelector(`#${id} .modal`);
      if (modal) {
        modal.classList.remove("modal-animate-in");
        void modal.offsetWidth;
        modal.classList.add("modal-animate-in");
      }
    }
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove("open");
  }

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  let toastTimeout;
  function showToast(messageHtml) {
    toastEl.innerHTML = messageHtml;
    toastEl.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastEl.classList.remove("show"), 4500);
  }

  // ─── Dashboard ───
  function refreshDashboard() {
    const m = V.getDashboardMetrics();
    document.getElementById("dashboard-stats").innerHTML = `
      <div class="stat-card"><div class="label">Total Keys</div><div class="value">${m.totalKeys}</div></div>
      <div class="stat-card"><div class="label">Active Keys</div><div class="value">${m.activeKeys}</div></div>
      <div class="stat-card"><div class="label">Revoked Keys</div><div class="value">${m.revokedKeys}</div></div>
      <div class="stat-card"><div class="label">Certificates</div><div class="value">${m.certificates}</div></div>
      <div class="stat-card"><div class="label">Pending Rotations</div><div class="value">${m.pendingRotations}</div><div class="delta warn">Expiring ≤30d</div></div>`;

    const rotBody = document.getElementById("dashboard-rotation-tbody");
    const pending = V.getPendingRotationKeys();
    rotBody.innerHTML = pending.length
      ? pending
          .map((k) => {
            const days = Math.max(0, Math.ceil((new Date(k.expiry) - new Date()) / 86400000));
            const color = days <= 7 ? "var(--orange)" : "var(--yellow)";
            return `<tr><td class="mono">${k.id}</td><td>${k.name}</td><td><span style="color:${color}">${days} days</span></td></tr>`;
          })
          .join("")
      : `<tr><td colspan="3" style="text-align:center;color:var(--text3);">No keys due for rotation</td></tr>`;

    const pendingPill = document.getElementById("vault-pending-pill");
    if (pendingPill) {
      pendingPill.textContent = pending.length ? `Pending Rotation (${pending.length})` : "Pending Rotation";
    }

    renderDashboardActivity();
  }

  function renderDashboardActivity() {
    document.getElementById("dashboard-activity").innerHTML = DASHBOARD_ACTIVITY.map(
      (a) => `<li><div class="activity-icon">${a.icon}</div><div class="activity-body"><div class="title">${a.title}</div><div class="meta">${a.meta}</div></div></li>`
    ).join("");
  }

  // ─── SecureKey Vault table ───
  function updateVaultPendingBanner() {
    const banner = document.getElementById("vault-pending-banner");
    const pending = V.getPendingRotationKeys();
    if (vaultFilter === "pending-rotation" && pending.length) {
      banner.style.display = "flex";
      banner.textContent = `⚠ ${pending.length} key(s) expiring within 30 days — select keys and use Bulk Rotate, or rotate individually.`;
    } else {
      banner.style.display = "none";
    }
  }

  function getFilteredVaultKeys() {
    return VAULT_KEYS.filter((k) => {
      switch (vaultFilter) {
        case "active":
          return k.status === "active";
        case "pending-rotation":
          return V.isKeyPendingRotation(k);
        case "legacy":
          return k.status === "legacy" || k.versions?.some((v) => v.status === "legacy");
        case "revoked":
          return k.status === "revoked";
        default:
          return true;
      }
    });
  }

  function expiryCell(k) {
    const date = formatDateShort(k.expiry);
    if (V.isKeyPendingRotation(k)) {
      const days = Math.max(0, Math.ceil((new Date(k.expiry) - new Date()) / 86400000));
      const color = days <= 7 ? "var(--orange)" : "var(--yellow)";
      return `<span style="color:${color}" title="Rotation recommended">${date} (${days}d)</span>`;
    }
    return date;
  }

  function getRotatableKeys(keys) {
    return keys.filter((k) => k.status === "active");
  }

  function updateVaultBulkToolbar() {
    const toolbar = document.getElementById("vault-bulk-toolbar");
    const countEl = document.getElementById("vault-bulk-count");
    const n = vaultSelectedKeys.size;
    if (n > 0) {
      toolbar.style.display = "flex";
      countEl.textContent = `${n} key${n === 1 ? "" : "s"} selected`;
    } else {
      toolbar.style.display = "none";
    }
    const bulkBtn = document.getElementById("vault-bulk-rotate-btn");
    if (bulkBtn) bulkBtn.disabled = n === 0;
  }

  function syncVaultSelectAllCheckbox(keys) {
    const selectAll = document.getElementById("vault-select-all");
    const rotatable = getRotatableKeys(keys);
    if (!selectAll) return;
    if (!rotatable.length) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
      selectAll.disabled = true;
      return;
    }
    selectAll.disabled = false;
    const selectedRotatable = rotatable.filter((k) => vaultSelectedKeys.has(k.id)).length;
    selectAll.checked = selectedRotatable === rotatable.length && rotatable.length > 0;
    selectAll.indeterminate = selectedRotatable > 0 && selectedRotatable < rotatable.length;
  }

  function renderVaultTable() {
    const tbody = document.getElementById("vault-tbody");
    const keys = getFilteredVaultKeys();
    updateVaultPendingBanner();
    if (!keys.length) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--text3);">No keys match this filter.</td></tr>`;
      syncVaultSelectAllCheckbox([]);
      updateVaultBulkToolbar();
      return;
    }
    tbody.innerHTML = keys
      .map((k) => {
        const canRotate = k.status === "active";
        const checked = vaultSelectedKeys.has(k.id) ? "checked" : "";
        const checkbox = canRotate
          ? `<input type="checkbox" class="vault-row-check" data-key-id="${k.id}" ${checked} aria-label="Select ${k.name}" />`
          : "";
        const rotateBtn = canRotate
          ? `<button class="btn btn-secondary btn-sm vault-rotate-btn" data-key-id="${k.id}">Rotate</button>`
          : "";
        return `
      <tr class="${V.isKeyPendingRotation(k) ? "vault-row-pending" : ""}">
        <td class="vault-check-col">${checkbox}</td>
        <td class="mono">${k.id}</td>
        <td>${k.name}</td>
        <td>${k.type}</td>
        <td class="mono">v${V.getCurrentVersionNum(k)}</td>
        <td><span class="status-badge ${statusBadgeClass(k.status)}">${k.status}</span></td>
        <td class="mono" style="font-size:0.7rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;" title="${k.storageLocation}">${k.storageLocation}</td>
        <td class="mono">${formatDateShort(k.created)}</td>
        <td class="mono">${expiryCell(k)}</td>
        <td class="vault-actions-cell"><button class="btn btn-ghost btn-sm open-key-btn" data-key-id="${k.id}">Open</button>${rotateBtn}</td>
      </tr>`;
      })
      .join("");
    tbody.querySelectorAll(".open-key-btn").forEach((btn) => {
      btn.addEventListener("click", () => navigateToKeyDetail(btn.dataset.keyId));
    });
    tbody.querySelectorAll(".vault-rotate-btn").forEach((btn) => {
      btn.addEventListener("click", () => openRotateModal(btn.dataset.keyId, true));
    });
    tbody.querySelectorAll(".vault-row-check").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) vaultSelectedKeys.add(cb.dataset.keyId);
        else vaultSelectedKeys.delete(cb.dataset.keyId);
        syncVaultSelectAllCheckbox(keys);
        updateVaultBulkToolbar();
      });
    });
    syncVaultSelectAllCheckbox(keys);
    updateVaultBulkToolbar();
  }

  document.getElementById("vault-select-all").addEventListener("change", (e) => {
    const keys = getFilteredVaultKeys();
    const rotatable = getRotatableKeys(keys);
    if (e.target.checked) {
      rotatable.forEach((k) => vaultSelectedKeys.add(k.id));
    } else {
      rotatable.forEach((k) => vaultSelectedKeys.delete(k.id));
    }
    renderVaultTable();
  });

  document.getElementById("vault-clear-selection-btn").addEventListener("click", () => {
    vaultSelectedKeys.clear();
    renderVaultTable();
  });

  document.getElementById("vault-bulk-rotate-btn").addEventListener("click", () => {
    const ids = [...vaultSelectedKeys];
    if (!ids.length) return;
    const list = document.getElementById("bulk-rotate-key-list");
    list.innerHTML = ids
      .map((id) => {
        const k = VAULT_KEYS.find((x) => x.id === id);
        if (!k) return "";
        return `<li><strong>${k.name}</strong> <span class="mono">(${k.id})</span> — v${V.getCurrentVersionNum(k)} → v${V.getCurrentVersionNum(k) + 1}</li>`;
      })
      .join("");
    openModal("bulk-rotate-modal");
  });

  document.getElementById("confirm-bulk-rotate-btn").addEventListener("click", () => {
    const ids = [...vaultSelectedKeys];
    const results = V.bulkRotateKeys(ids);
    closeModal("bulk-rotate-modal");
    vaultSelectedKeys.clear();

    document.getElementById("bulk-rotate-success-title").textContent =
      results.length === 1 ? "Key Rotated" : `Bulk Rotation Complete — ${results.length} Keys`;
    document.getElementById("bulk-rotate-results-tbody").innerHTML = results
      .map(
        (r) => `
      <tr>
        <td><strong>${r.key.name}</strong> <span class="mono">${r.key.id}</span></td>
        <td class="mono">v${r.oldVersion} <span class="tag">Legacy</span></td>
        <td class="mono">v${r.newVersion} <span class="status-badge active">Active</span></td>
      </tr>`
      )
      .join("");

    renderVaultTable();
    renderAuditTable();
    refreshDashboard();
    openModal("bulk-rotate-success-modal", true);
  });

  document.getElementById("bulk-rotate-view-audit-btn").addEventListener("click", () => {
    closeModal("bulk-rotate-success-modal");
    navigateTo("audit-logs", "Audit Logs");
  });

  document.getElementById("vault-filters").addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if (!pill) return;
    vaultFilter = pill.dataset.filter;
    document.querySelectorAll("#vault-filters .filter-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    if (vaultFilter === "pending-rotation") {
      V.getPendingRotationKeys().forEach((k) => vaultSelectedKeys.add(k.id));
    } else {
      vaultSelectedKeys.clear();
    }
    renderVaultTable();
  });

  // ─── Key Detail Page ───
  function renderKeyDetailPage(key) {
    const canRotate = key.status === "active";
    const canRevoke = key.status !== "revoked" && key.status !== "destroyed";
    document.getElementById("key-page-rotate-btn").disabled = !canRotate;
    document.getElementById("key-page-revoke-btn").disabled = !canRevoke;

    const lifecycleIdx = V.getLifecycleIndex(key.lifecycleState || "active");
    const steps = ["generated", "active", "rotated", "revoked", "destroyed"];
    const lifecycleHtml = steps
      .map(
        (step, i) =>
          `<div class="lifecycle-step ${i <= lifecycleIdx ? "done" : ""} ${i === lifecycleIdx ? "current" : ""}"><span class="lifecycle-dot"></span><span>${step.charAt(0).toUpperCase() + step.slice(1)}</span></div>`
      )
      .join("");

    const versionsHtml = (key.versions || [])
      .map(
        (v) => `
      <tr>
        <td class="mono">v${v.num}</td>
        <td class="mono">${formatDateShort(v.created)}</td>
        <td><span class="status-badge ${statusBadgeClass(v.status === "retired" ? "revoked" : v.status)}">${versionStatusLabel(v.status)}</span></td>
      </tr>`
      )
      .join("");

    const appsHtml = (key.applications || []).map((a) => `<li>${a}</li>`).join("") || "<li class='text-muted'>None linked</li>";
    const certs = getCertsForKey(key);
    const certsHtml = certs.length
      ? certs.map((c) => `<li><button type="button" class="link-btn open-cert-btn" data-cert-id="${c.id}">${c.name}</button></li>`).join("")
      : "<li class='text-muted'>None</li>";

    document.getElementById("key-detail-content").innerHTML = `
      <div class="screen-header"><h2>${key.name}</h2><p class="mono">${key.id}</p></div>
      <div class="key-detail-grid">
        <div class="panel" style="padding:20px;">
          <h3 class="section-title">Metadata</h3>
          <div class="detail-grid compact">
            <div class="detail-row"><span class="label">Key ID</span><span class="value mono">${key.id}</span></div>
            <div class="detail-row"><span class="label">Type</span><span class="value">${key.type}</span></div>
            <div class="detail-row"><span class="label">Owner</span><span class="value">${key.owner}</span></div>
            <div class="detail-row"><span class="label">Created</span><span class="value mono">${formatTs(key.created)}</span></div>
            <div class="detail-row"><span class="label">Expiry</span><span class="value mono">${formatTs(key.expiry)}</span></div>
            <div class="detail-row"><span class="label">Storage</span><span class="value mono" style="font-size:0.7rem;">${key.storageLocation}</span></div>
          </div>
        </div>
        <div class="panel" style="padding:20px;">
          <h3 class="section-title">Lifecycle Status</h3>
          <div class="lifecycle-track">${lifecycleHtml}</div>
        </div>
      </div>
      <div class="panel" style="padding:20px;margin-top:16px;">
        <h3 class="section-title">Version History</h3>
        <table class="data-table"><thead><tr><th>Version</th><th>Created</th><th>Status</th></tr></thead><tbody>${versionsHtml}</tbody></table>
        <div class="info-callout" style="margin-top:12px;">Old encrypted data still uses legacy versions. New operations use the active version.</div>
      </div>
      <div class="key-detail-grid" style="margin-top:16px;">
        <div class="panel" style="padding:20px;">
          <h3 class="section-title">Applications Using This Key</h3>
          <ul class="app-list">${appsHtml}</ul>
        </div>
        <div class="panel" style="padding:20px;">
          <h3 class="section-title">Associated Certificates</h3>
          <ul class="app-list">${certsHtml}</ul>
        </div>
      </div>`;

    document.querySelectorAll(".open-cert-btn").forEach((btn) => {
      btn.addEventListener("click", () => navigateToCertDetail(btn.dataset.certId));
    });
  }

  document.getElementById("key-page-rotate-btn").addEventListener("click", () => openRotateModal(viewedKeyId, false));
  document.getElementById("key-page-revoke-btn").addEventListener("click", () => openRevokeModal(viewedKeyId));

  function openRotateModal(keyId, fromVault) {
    const key = VAULT_KEYS.find((k) => k.id === keyId);
    if (!key || key.status !== "active") return;
    viewedKeyId = keyId;
    rotateFromVault = !!fromVault;
    const cur = V.getCurrentVersionNum(key);
    document.getElementById("rotate-current-version").textContent = `v${cur}`;
    document.getElementById("rotate-new-version").textContent = `v${cur + 1}`;
    document.getElementById("rotate-key-name-label").textContent = key.name;
    openModal("rotate-key-modal");
  }

  function openRevokeModal(keyId) {
    viewedKeyId = keyId;
    openModal("revoke-key-modal");
  }

  document.getElementById("confirm-rotate-key-btn").addEventListener("click", () => {
    const result = V.rotateKey(viewedKeyId);
    if (!result) return;
    closeModal("rotate-key-modal");
    const { key, oldVersion, newVersion, rotatedAt } = result;
    document.getElementById("rotate-success-old").textContent = `v${oldVersion}`;
    document.getElementById("rotate-success-new").textContent = `v${newVersion}`;
    document.getElementById("rotate-success-date").textContent = V.formatDisplayTime(rotatedAt);
    document.getElementById("rotate-success-key-name").textContent = key.name;
    const mig = key.migration || { migrated: [], pending: [] };
    document.getElementById("rotate-migration-content").innerHTML = `
      <p style="font-size:0.8rem;margin-bottom:8px;"><strong>Migrated:</strong> ${mig.migrated.join(", ") || "—"}</p>
      <p style="font-size:0.8rem;color:var(--yellow);"><strong>Still on old version:</strong> ${mig.pending.join(", ") || "—"}</p>`;
    renderVaultTable();
    renderAuditTable();
    refreshDashboard();
    if (currentScreen === "key-detail") renderKeyDetailPage(key);

    lastRotatedKeyId = key.id;
    const nextPending = V.getPendingRotationKeys().filter((k) => k.id !== key.id);
    const nextBtn = document.getElementById("rotate-next-key-btn");
    if (rotateFromVault && nextPending.length) {
      nextBtn.style.display = "inline-flex";
      nextBtn.textContent = `Rotate next key (${nextPending.length} left) →`;
    } else {
      nextBtn.style.display = "none";
    }

    openModal("rotate-success-modal", true);
  });

  document.getElementById("rotate-next-key-btn").addEventListener("click", () => {
    closeModal("rotate-success-modal");
    const next = V.getPendingRotationKeys().find((k) => k.id !== lastRotatedKeyId);
    if (next) {
      if (currentScreen !== "securekey-vault") navigateTo("securekey-vault", "SecureKey Vault");
      vaultFilter = "pending-rotation";
      document.querySelectorAll("#vault-filters .filter-pill").forEach((p) => {
        p.classList.toggle("active", p.dataset.filter === "pending-rotation");
      });
      renderVaultTable();
      openRotateModal(next.id, true);
    }
  });

  document.getElementById("view-audit-after-rotate-btn").addEventListener("click", () => {
    closeModal("rotate-success-modal");
    navigateTo("audit-logs", "Audit Logs");
  });

  document.getElementById("confirm-revoke-key-btn").addEventListener("click", () => {
    const reason = document.getElementById("revoke-reason").value;
    const result = V.revokeKey(viewedKeyId, reason);
    if (!result) return;
    closeModal("revoke-key-modal");
    const { key } = result;
    const apps = (key.applications || []).map((a) => `<li>${a}</li>`).join("");
    document.getElementById("revoke-success-content").innerHTML = `
      <p style="margin:16px 0;"><strong>Reason:</strong> ${reason}</p>
      <h4 style="font-size:0.85rem;">What happens next</h4>
      <ul class="report-list">
        <li><strong>New encryptions blocked</strong> — applications cannot use this key for new crypto ops</li>
        <li><strong>Existing encrypted data preserved</strong> — ciphertext already written remains decryptable where policy allows</li>
        <li><strong>Replacement key recommended</strong> — provision a new key and migrate applications</li>
      </ul>
      <h4 style="font-size:0.85rem;margin-top:16px;">Affected applications</h4>
      <ul class="report-list">${apps || "<li>None registered</li>"}</ul>
      <div class="info-callout" style="margin-top:12px;"><strong>Recovery:</strong> Generate a new key in SecureKey Vault, update app configs, re-encrypt sensitive data per your migration runbook.</div>`;
    renderVaultTable();
    renderAuditTable();
    refreshDashboard();
    openModal("revoke-success-modal", true);
  });

  document.getElementById("revoke-view-key-btn").addEventListener("click", () => {
    closeModal("revoke-success-modal");
    navigateToKeyDetail(viewedKeyId);
  });

  // ─── Generate Key pipeline ───
  const PIPELINE_STEPS = [
    "Admin request received",
    "Policy validation passed",
    "SecureKey Vault generating key material",
    "Version 1 created and stored",
    "Metadata indexed in vault catalog",
    "Audit event recorded",
  ];

  document.getElementById("generate-key-btn").addEventListener("click", () => {
    const opts = {
      name: document.getElementById("key-name").value.trim() || "new-vault-key",
      type: document.getElementById("key-type").value,
      purpose: document.getElementById("key-purpose").value,
      expiryDays: parseInt(document.getElementById("expiry-days").value, 10) || 365,
    };
    const stepsEl = document.getElementById("generate-pipeline-steps");
    stepsEl.innerHTML = PIPELINE_STEPS.map((s, i) => `<li class="pipeline-step" data-step="${i}">${s}</li>`).join("");
    openModal("generate-pipeline-modal");
    let step = 0;
    const interval = setInterval(() => {
      const items = stepsEl.querySelectorAll(".pipeline-step");
      if (step > 0) items[step - 1].classList.add("done");
      if (step < items.length) {
        items[step].classList.add("active");
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          closeModal("generate-pipeline-modal");
          const key = V.generateKeyInVault(opts);
          document.getElementById("generate-result-content").innerHTML = `
            <div class="detail-grid" style="margin-top:16px;text-align:left;">
              <div class="detail-row"><span class="label">Key ID</span><span class="value mono">${key.id}</span></div>
              <div class="detail-row"><span class="label">Name</span><span class="value">${key.name}</span></div>
              <div class="detail-row"><span class="label">Version</span><span class="value mono">v1 (Active)</span></div>
              <div class="detail-row"><span class="label">Storage</span><span class="value mono" style="font-size:0.7rem;">${key.storageLocation}</span></div>
              <div class="detail-row"><span class="label">Status</span><span class="value"><span class="status-badge active">active</span></span></div>
            </div>`;
          viewedKeyId = key.id;
          renderVaultTable();
          renderAuditTable();
          refreshDashboard();
          openModal("success-modal", true);
        }, 400);
      }
    }, 450);
  });

  document.getElementById("view-in-vault-btn").addEventListener("click", () => {
    closeModal("success-modal");
    if (viewedKeyId) navigateToKeyDetail(viewedKeyId);
    else navigateTo("securekey-vault", "SecureKey Vault");
  });

  // ─── Certificates ───
  function renderCertificatesTable() {
    document.getElementById("certificates-tbody").innerHTML = CERTIFICATES.map(
      (c) => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td class="mono">${formatDateShort(c.expiry)}</td>
        <td><span class="status-badge ${statusBadgeClass(c.status)}">${c.status}</span></td>
        <td class="mono">${c.keyName}</td>
        <td><button class="btn btn-ghost btn-sm open-cert-table-btn" data-cert-id="${c.id}">Open</button></td>
      </tr>`
    ).join("");
    document.querySelectorAll(".open-cert-table-btn").forEach((btn) => {
      btn.addEventListener("click", () => navigateToCertDetail(btn.dataset.certId));
    });
  }

  function renderCertDetailPage(cert) {
    const key = VAULT_KEYS.find((k) => k.id === cert.keyId);
    const ver = key ? V.getCurrentVersionNum(key) : "—";
    document.getElementById("certificate-detail-content").innerHTML = `
      <div class="screen-header"><h2>${cert.name}</h2><p>Certificate → Key → Version chain</p></div>
      <div class="cert-chain panel" style="padding:24px;">
        <div class="chain-item"><span class="chain-label">Certificate</span><strong>${cert.name}</strong><span class="status-badge ${statusBadgeClass(cert.status)}">${cert.status}</span></div>
        <div class="chain-arrow">↓</div>
        <div class="chain-item"><span class="chain-label">Associated Key</span><button type="button" class="link-btn" id="cert-goto-key">${cert.keyName}</button> <span class="mono">${cert.keyId}</span></div>
        <div class="chain-arrow">↓</div>
        <div class="chain-item"><span class="chain-label">Current Key Version</span><span class="mono">v${ver}</span></div>
      </div>
      <div class="detail-grid panel" style="padding:20px;margin-top:16px;">
        <div class="detail-row"><span class="label">Expiry</span><span class="value mono">${formatTs(cert.expiry)}</span></div>
        <div class="detail-row"><span class="label">Issuer</span><span class="value">${cert.issuer}</span></div>
      </div>
      <div style="margin-top:16px;display:flex;gap:12px;">
        <button type="button" class="btn btn-primary btn-sm" id="renew-cert-btn" ${cert.status === "revoked" ? "disabled" : ""}>Renew Certificate</button>
        <button type="button" class="btn btn-danger btn-sm" id="revoke-cert-btn" ${cert.status === "revoked" ? "disabled" : ""}>Revoke Certificate</button>
      </div>`;
    document.getElementById("cert-goto-key").addEventListener("click", () => navigateToKeyDetail(cert.keyId));
    document.getElementById("renew-cert-btn")?.addEventListener("click", () => {
      V.renewCertificate(cert.id);
      renderCertDetailPage(CERTIFICATES.find((c) => c.id === cert.id));
      renderCertificatesTable();
      renderAuditTable();
      showToast(`<span class="toast-title">✓ Certificate renewed</span>${cert.name}`);
    });
    document.getElementById("revoke-cert-btn")?.addEventListener("click", () => {
      V.revokeCertificate(cert.id);
      renderCertDetailPage(CERTIFICATES.find((c) => c.id === cert.id));
      renderCertificatesTable();
      renderAuditTable();
      showToast(`<span class="toast-title">Certificate revoked</span>${cert.name}`);
    });
  }

  // ─── Audit ───
  function renderAuditTable() {
    document.getElementById("audit-tbody").innerHTML = AUDIT_EVENTS.map(
      (ev) => `
      <tr class="${ev.flagged ? "flagged flagged-clickable" : ""}"${ev.flagged ? ' data-flagged="true"' : ""}>
        <td class="mono">${ev.displayTime || formatTs(ev.timestamp)}</td>
        <td>${ev.actorDisplay || ev.actor}</td>
        <td><span class="tag">${ev.action}</span></td>
        <td>${ev.resource || ev.keyName || ev.keyId}</td>
        <td><span class="status-badge ${ev.result === "SUCCESS" ? "active" : "revoked"}">${ev.result}</span></td>
      </tr>`
    ).join("");
    document.querySelectorAll("tr[data-flagged]").forEach((row) => {
      row.addEventListener("click", () => openModal("security-alert-modal"));
    });
  }

  document.getElementById("revoke-key-immediate-btn").addEventListener("click", () => {
    closeModal("security-alert-modal");
    showToast("Key <strong>prod-db-encryption</strong> revocation simulated.");
  });

  // ─── API / AI / Users (preserved) ───
  let currentApiKeyMasked = "sk_live_••••••••8e4f";
  document.getElementById("regenerate-api-key-btn").addEventListener("click", () => {
    const oldKey = currentApiKeyMasked;
    currentApiKeyMasked = `sk_live_••••••••${Math.random().toString(16).slice(2, 6)}`;
    const display = document.getElementById("api-key-display");
    display.textContent = currentApiKeyMasked;
    display.classList.add("api-key-updated");
    setTimeout(() => display.classList.remove("api-key-updated"), 800);
    showToast(`API key regenerated. Previous key <strong>${oldKey}</strong> is no longer valid.`);
  });

  function renderEndpoints() {
    const list = document.getElementById("endpoint-list");
    list.innerHTML = API_ENDPOINTS.map(
      (ep, i) => `
      <div class="endpoint-card" data-endpoint="${i}">
        <div class="endpoint-header" role="button" tabindex="0">
          <span class="method-pill ${ep.method.toLowerCase()}${ep.danger ? " danger" : ""}">${ep.method}</span>
          <span class="endpoint-path">${ep.path}</span>
          <span class="endpoint-desc">${ep.description}</span>
          <span class="endpoint-chevron">▼</span>
        </div>
        <div class="endpoint-body"><div class="code-block">${ep.request}</div><div class="code-block" style="margin-top:12px;">${ep.response}</div></div>
      </div>`
    ).join("");
    list.querySelectorAll(".endpoint-header").forEach((header) => {
      const toggle = () => {
        const card = header.closest(".endpoint-card");
        card.classList.toggle("expanded");
      };
      header.addEventListener("click", toggle);
    });
  }

  function runAiButtonLoading(btn, loadingText, delayMs, onDone) {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = loadingText;
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = original;
      onDone();
    }, delayMs);
  }

  document.getElementById("ai-investigate-btn").addEventListener("click", () => {
    navigateTo("audit-logs", "Audit Logs");
    setTimeout(() => openModal("security-alert-modal"), 400);
  });
  document.getElementById("ai-report-btn").addEventListener("click", function () {
    runAiButtonLoading(this, "Generating…", 1200, () => openModal("compliance-report-modal", true));
  });
  document.getElementById("download-compliance-report-btn").addEventListener("click", () => {
    showToast('<span class="toast-title">✓ Download started</span>Compliance_Report_ACME_Q2_2025.pdf');
  });

  function formatLastActive(iso) {
    if (iso.includes("2025-05-31")) return "Today";
    return formatTs(iso).split(" ")[0];
  }

  function renderUsersTable() {
    document.getElementById("users-tbody").innerHTML = KMS_USERS.map(
      (u) => `
      <tr>
        <td><div class="user-cell"><span class="user-avatar-small">${u.initials}</span><strong>${u.name}</strong></div></td>
        <td>${u.email}</td>
        <td><span class="role-badge role-${u.role}">${u.roleLabel}</span></td>
        <td><span class="status-badge active">active</span></td>
        <td class="mono">${formatLastActive(u.lastActive)}</td>
        <td><button type="button" class="btn btn-ghost btn-sm manage-access-btn" data-user-id="${u.id}">Manage Access</button></td>
      </tr>`
    ).join("");
    document.querySelectorAll(".manage-access-btn").forEach((btn) => {
      btn.addEventListener("click", () => showManageAccess(btn.dataset.userId));
    });
  }

  function showManageAccess(userId) {
    const user = KMS_USERS.find((u) => u.id === userId);
    if (!user) return;
    viewedUserId = userId;
    manageAccessDirty = false;
    document.getElementById("manage-access-title").textContent = `Manage Access — ${user.name}`;
    const sub = document.getElementById("manage-access-subtitle");
    if (sub) {
      sub.textContent =
        user.role === "developer"
          ? `${user.roleLabel}: cryptographic access limited to assigned keys.`
          : user.role === "auditor"
            ? `${user.roleLabel}: read-only governance.`
            : `${user.roleLabel}: full vault control.`;
    }
    const saveBtn = document.getElementById("save-access-btn");
    saveBtn.disabled = true;
    saveBtn.style.opacity = "0.6";
    const tbody = document.getElementById("access-matrix-tbody");
    tbody.innerHTML = VAULT_KEYS.map((key) => {
      const access = getKeyAccessForUser(user, key);
      return `<tr>
        <td><strong>${key.name}</strong></td>
        <td class="mono">${key.id}</td>
        <td><select class="access-select ${access.allowed ? "access-cell-allow" : "access-cell-deny"}" data-user-id="${user.id}" data-key-id="${key.id}">
          <option value="allowed" ${access.allowed ? "selected" : ""}>✓ Allowed</option>
          <option value="denied" ${!access.allowed ? "selected" : ""}>✕ Denied</option>
        </select></td>
        <td class="access-actions" data-actions-user-id="${user.id}" data-actions-key-id="${key.id}" style="font-size:0.75rem;color:var(--text2);">${access.allowed ? access.actions : access.reason}</td>
      </tr>`;
    }).join("");
    tbody.querySelectorAll(".access-select").forEach((sel) => {
      sel.addEventListener("change", () => {
        setAccessOverride(sel.dataset.userId, sel.dataset.keyId, sel.value === "allowed");
        manageAccessDirty = true;
        saveBtn.disabled = false;
        saveBtn.style.opacity = "";
      });
    });
    openModal("manage-access-modal");
  }

  document.getElementById("save-access-btn").addEventListener("click", () => {
    if (!manageAccessDirty) {
      closeModal("manage-access-modal");
      return;
    }
    V.addAudit("POLICY_UPDATE", "RBAC", "—", "Access policy");
    renderAuditTable();
    closeModal("manage-access-modal");
    showToast('<span class="toast-title">✓ Access policy saved</span>Recorded in audit trail.');
    manageAccessDirty = false;
  });

  // ─── Init ───
  refreshDashboard();
  renderVaultTable();
  renderAuditTable();
  renderEndpoints();
  renderUsersTable();
  renderCertificatesTable();
})();
