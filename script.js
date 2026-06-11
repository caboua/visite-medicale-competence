const ALERT_DAYS = 60;
let allAgents = [];
let currentFilter = "";

const FIELD_ALIASES = {
  nom: ["nom", "Nom", "NOM"],
  prenom: ["prenom", "Prénom", "Prenom", "PRENOM"],
  matricule: ["matricule", "Matricule", "MATRICULE"],
  derniereVisite: ["derniere_visite", "Dernière visite", "date_visite", "Date visite"],
  validite: ["date_validite", "prochaine_visite", "Prochaine visite", "validite", "Validité"],
  aptitude: ["aptitude", "Aptitude", "avis_medical", "Avis médical", "statut_aptitude"],
  inaptitude: ["inaptitude", "Inaptitude"],
  restriction: ["restriction", "Restriction", "restrictions", "Restrictions"],
  maj: ["derniere_mise_a_jour", "Dernière mise à jour", "maj"]
};

function valueOf(agent, names) {
  for (const name of names) {
    if (agent[name] !== undefined && agent[name] !== null && String(agent[name]).trim() !== "") {
      return String(agent[name]).trim();
    }
  }
  const normalized = Object.fromEntries(Object.keys(agent).map(k => [normalize(k), k]));
  for (const name of names) {
    const key = normalized[normalize(name)];
    if (key && agent[key] !== undefined && agent[key] !== null && String(agent[key]).trim() !== "") {
      return String(agent[key]).trim();
    }
  }
  return "";
}

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseDateFR(text) {
  if (!text) return null;
  const match = String(text).match(/(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{2,4})/);
  if (!match) return null;
  let [, d, m, y] = match;
  y = Number(y.length === 2 ? "20" + y : y);
  const date = new Date(y, Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatAgent(agent) {
  const nom = valueOf(agent, FIELD_ALIASES.nom).toUpperCase();
  const prenom = valueOf(agent, FIELD_ALIASES.prenom);
  return {
    raw: agent,
    nom,
    prenom,
    fullName: `${nom} ${prenom}`.trim() || "Agent sans nom",
    matricule: valueOf(agent, FIELD_ALIASES.matricule),
    derniereVisite: valueOf(agent, FIELD_ALIASES.derniereVisite),
    validite: valueOf(agent, FIELD_ALIASES.validite),
    aptitude: valueOf(agent, FIELD_ALIASES.aptitude),
    inaptitude: valueOf(agent, FIELD_ALIASES.inaptitude),
    restriction: valueOf(agent, FIELD_ALIASES.restriction),
    maj: valueOf(agent, FIELD_ALIASES.maj)
  };
}

function daysUntil(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / 86400000);
}

function medicalStatus(agent) {
  const validDate = parseDateFR(agent.validite);
  const days = daysUntil(validDate);
  const aptitudeText = normalize([agent.aptitude, agent.inaptitude, agent.restriction].join(" "));

  if (aptitudeText.includes("inapte") || agent.inaptitude) {
    return { label: "Inapte", cls: "danger-badge", priority: 0 };
  }
  if (agent.restriction || aptitudeText.includes("restriction")) {
    return { label: "Restriction", cls: "warn", priority: 1 };
  }
  if (days === null) {
    return { label: "Date à vérifier", cls: "warn", priority: 2 };
  }
  if (days < 0) {
    return { label: "Expirée", cls: "danger-badge", priority: 0 };
  }
  if (days <= ALERT_DAYS) {
    return { label: `À renouveler (${days} j)`, cls: "warn", priority: 1 };
  }
  return { label: "À jour", cls: "ok", priority: 3 };
}

function isAlert(agent) {
  const status = medicalStatus(agent);
  return status.label !== "À jour" && status.label !== "Restriction" && status.label !== "Inapte";
}

function isInaptitudeOrRestriction(agent) {
  const text = normalize([agent.aptitude, agent.inaptitude, agent.restriction].join(" "));
  return Boolean(agent.inaptitude || agent.restriction || text.includes("inapte") || text.includes("restriction"));
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
}

function agentCell(agent) {
  return `<div class="agent-name">${escapeHtml(agent.fullName)}</div>${agent.matricule ? `<div class="small">Mat. ${escapeHtml(agent.matricule)}</div>` : ""}`;
}

function renderRows(tbodyId, rows, type) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = rows.map(agent => {
    const status = medicalStatus(agent);
    if (type === "alerts") {
      return `<tr><td>${agentCell(agent)}</td><td>${escapeHtml(agent.derniereVisite || "—")}</td><td>${escapeHtml(agent.validite || "—")}</td><td><span class="badge ${status.cls}">${escapeHtml(status.label)}</span></td><td>${escapeHtml(agent.aptitude || "—")}</td></tr>`;
    }
    if (type === "inaptitudes") {
      return `<tr><td>${agentCell(agent)}</td><td>${escapeHtml(agent.aptitude || "—")}</td><td>${escapeHtml(agent.inaptitude || "—")}</td><td>${escapeHtml(agent.restriction || "—")}</td><td>${escapeHtml(agent.validite || "—")}</td></tr>`;
    }
    return `<tr><td>${agentCell(agent)}</td><td>${escapeHtml(agent.matricule || "—")}</td><td>${escapeHtml(agent.derniereVisite || "—")}</td><td>${escapeHtml(agent.validite || "—")}</td><td><span class="badge ${status.cls}">${escapeHtml(agent.aptitude || status.label)}</span></td><td>${escapeHtml(agent.restriction || "—")}</td></tr>`;
  }).join("");
}

function toggleEmpty(id, show) {
  document.getElementById(id).style.display = show ? "block" : "none";
}

function applyFilter() {
  const q = normalize(currentFilter);
  const filtered = allAgents.filter(agent => normalize(`${agent.fullName} ${agent.matricule} ${agent.aptitude} ${agent.inaptitude} ${agent.restriction}`).includes(q));

  const alerts = filtered.filter(isAlert).sort((a, b) => medicalStatus(a).priority - medicalStatus(b).priority || (parseDateFR(a.validite) || 0) - (parseDateFR(b.validite) || 0));
  const inaptitudes = filtered.filter(isInaptitudeOrRestriction).sort((a, b) => a.fullName.localeCompare(b.fullName, "fr"));
  const agents = filtered.sort((a, b) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr"));

  renderRows("alertsBody", alerts, "alerts");
  renderRows("inaptitudesBody", inaptitudes, "inaptitudes");
  renderRows("agentsBody", agents, "agents");

  document.getElementById("countAll").textContent = allAgents.length;
  document.getElementById("countAlerts").textContent = allAgents.filter(isAlert).length;
  document.getElementById("countInaptitudes").textContent = allAgents.filter(isInaptitudeOrRestriction).length;

  toggleEmpty("emptyAlerts", alerts.length === 0);
  toggleEmpty("emptyInaptitudes", inaptitudes.length === 0);
  toggleEmpty("emptyAgents", agents.length === 0);
}

async function loadAgents() {
  try {
    const response = await fetch("agents.json?cache=" + Date.now());
    if (!response.ok) throw new Error("agents.json introuvable");
    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.agents || data.data || data.items || []);
    allAgents = list.map(formatAgent);
    const last = allAgents.map(a => a.maj).filter(Boolean).sort().pop();
    document.getElementById("lastUpdate").textContent = last || new Date().toLocaleDateString("fr-FR");
    applyFilter();
  } catch (error) {
    document.getElementById("agentsBody").innerHTML = `<tr><td colspan="6">Impossible de charger agents.json. Vérifie que le fichier est bien à la racine du site.</td></tr>`;
    toggleEmpty("emptyAgents", false);
    console.error(error);
  }
}

document.getElementById("searchInput").addEventListener("input", event => {
  currentFilter = event.target.value;
  applyFilter();
});

document.getElementById("clearSearch").addEventListener("click", () => {
  currentFilter = "";
  document.getElementById("searchInput").value = "";
  applyFilter();
});

loadAgents();
