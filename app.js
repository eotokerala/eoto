/**
 * Each One Teach One (EOTO) - Main Application Controller
 * Handles dynamic data rendering, Google Sheets / Apps Script fetching,
 * WhatsApp link generation, search filtering, and admin actions.
 */

// Deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyl-uzH4DL-0RbP2lEUD9rK18Gk2x3_65n80_oq1Z9FYUUxVSGK2_jTPTRPa7ypjB-vgw/exec"; 

// Fallback WhatsApp Team Contact Number (Format: Country Code + Phone, e.g., 919876543210)
const EOTO_WHATSAPP_NUMBER = "919876543210";

// Global State
let allCases = [];
let activeFilter = "all";
let searchQuery = "";
let isAdminAuthenticated = false;

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  setupEventListeners();
});

/**
 * Initialize Application and Fetch Case Data
 */
async function initApp() {
  showTableLoading();
  
  try {
    let loadedData = null;
    let summaryMetrics = null;
    
    // Attempt to fetch from Google Apps Script Web App if URL provided
    if (APPS_SCRIPT_URL && APPS_SCRIPT_URL.trim() !== "") {
      const response = await fetch(APPS_SCRIPT_URL);
      const json = await response.json();
      if (json.success && Array.isArray(json.cases)) {
        loadedData = json.cases;
        if (json.summary) summaryMetrics = json.summary;
      }
    }

    // Fallback to local sample dataset if API not configured or failed
    if (!loadedData) {
      const localResponse = await fetch("sample-cases.json");
      loadedData = await localResponse.json();
    }

    allCases = loadedData;
    updateStatsCounter(allCases, summaryMetrics);
    renderCasesTable();

  } catch (error) {
    console.error("Error loading case data:", error);
    showTableError();
  }
}

/**
 * Render Case Table Rows based on current filters and search
 */
function renderCasesTable() {
  const tbody = document.getElementById("cases-table-body");
  const noCasesMsg = document.getElementById("no-cases-msg");
  
  if (!tbody) return;

  // Filter cases by active tab and search query
  const filteredCases = allCases.filter(c => {
    const matchesFilter = (activeFilter === "all") || (c.status.toLowerCase() === activeFilter.toLowerCase());
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (c.id && c.id.toLowerCase().includes(query)) ||
      (c.course && c.course.toLowerCase().includes(query)) ||
      (c.institution && c.institution.toLowerCase().includes(query)) ||
      (c.district && c.district.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  if (filteredCases.length === 0) {
    tbody.innerHTML = "";
    if (noCasesMsg) noCasesMsg.style.display = "block";
    return;
  }

  if (noCasesMsg) noCasesMsg.style.display = "none";

  tbody.innerHTML = filteredCases.map(c => {
    const statusClass = getStatusClass(c.status);
    const formattedAmount = formatCurrency(c.amount);
    const waUrl = generateWhatsAppLink(c);

    return `
      <tr>
        <td>
          <span class="case-id-badge">${escapeHtml(cleanCaseId(c.id, c.year))}</span>
        </td>
        <td style="max-width: 480px;">
          <div class="course-title">${escapeHtml(c.course)}</div>
          <div class="institution-subtitle">${escapeHtml(c.institution)}</div>
          ${c.description ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; line-height: 1.5; background: #F8FAFC; padding: 8px 12px; border-left: 3px solid var(--accent-green); border-radius: 4px;">${escapeHtml(c.description)}</div>` : ''}
        </td>
        <td>${escapeHtml(c.district)}</td>
        <td>
          <span class="amount-text">${formattedAmount}</span>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${escapeHtml(c.status)}</span>
        </td>
        <td>
          ${c.status.toLowerCase() === "open" ? `
            <a href="${waUrl}" target="_blank" class="btn btn-whatsapp btn-sm">
              💬 Sponsor via WhatsApp
            </a>
          ` : `
            <a href="${waUrl}" target="_blank" class="btn btn-outline btn-sm">
              Inquire
            </a>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

/**
 * Update Impact Counter Section
 */
function updateStatsCounter(cases) {
  const totalCasesEl = document.getElementById("stat-total-cases");
  const openCasesEl = document.getElementById("stat-open-cases");
  const sponsoredCasesEl = document.getElementById("stat-sponsored-cases");

  const total = cases.length;
  const open = cases.filter(c => c.status.toLowerCase() === "open").length;
  const sponsored = cases.filter(c => c.status.toLowerCase() === "sponsored").length;

  if (totalCasesEl) totalCasesEl.textContent = total;
  if (openCasesEl) openCasesEl.textContent = open;
  if (sponsoredCasesEl) sponsoredCasesEl.textContent = sponsored;
}

/**
 * Generate Pre-filled WhatsApp Chat Link
 */
function generateWhatsAppLink(c) {
  const amountStr = typeof c.amount === "string" ? c.amount : formatCurrency(c.amount);
  const text = `Hi EOTO Team, I am interested in sponsoring Case #${c.id} (${c.course} - ${c.district}, ${amountStr}). Please guide me with the details.`;
  return `https://wa.me/${EOTO_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Helper Utilities
 */
function formatCurrency(num) {
  if (typeof num === "string" && (num.includes("₹") || num.includes("month") || num.includes("year") || num.includes("time"))) {
    return num;
  }
  const val = typeof num === "number" ? num : (parseInt(String(num).replace(/\D/g, ""), 10) || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

function getStatusClass(status) {
  const s = String(status).toLowerCase();
  if (s === "open") return "status-open";
  if (s === "in progress") return "status-progress";
  return "status-sponsored";
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function cleanCaseId(val, year) {
  if (!val) return "Case";
  const str = String(val).trim();
  if (str.includes("GMT") || str.includes("Standard Time") || str.includes("Pacific")) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const yr = year || d.getFullYear();
      return `${day}/${yr}`;
    }
  }
  return str;
}

function showTableLoading() {
  const tbody = document.getElementById("cases-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          ⏳ Fetching live cases from Google Sheets...
        </td>
      </tr>
    `;
  }
}

function showTableError() {
  const tbody = document.getElementById("cases-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: #DC2626;">
          ⚠️ Unable to load live case data. Please try refreshing.
        </td>
      </tr>
    `;
  }
}

/**
 * Setup UI Event Listeners
 */
function setupEventListeners() {
  // Tab Filters
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeFilter = tab.getAttribute("data-filter");
      renderCasesTable();
    });
  });

  // Search Input
  const searchInput = document.getElementById("case-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderCasesTable();
    });
  }

  // Bylaw Modal Listeners
  const bylawModal = document.getElementById("bylaw-modal");
  const btnViewBylaws = document.getElementById("btn-view-bylaws");
  const closeBylawModal = document.getElementById("close-bylaw-modal");
  const closeBylawBtn = document.getElementById("close-bylaw-btn");

  if (btnViewBylaws && bylawModal) {
    btnViewBylaws.addEventListener("click", () => bylawModal.classList.add("active"));
  }
  if (closeBylawModal && bylawModal) {
    closeBylawModal.addEventListener("click", () => bylawModal.classList.remove("active"));
  }
  if (closeBylawBtn && bylawModal) {
    closeBylawBtn.addEventListener("click", () => bylawModal.classList.remove("active"));
  }
}
