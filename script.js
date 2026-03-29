const CLIENTS_KEY = "clientflow_clients";

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

const clientForm = document.getElementById("client-form");
const clientNameInput = document.getElementById("client-name");
const clientStatusInput = document.getElementById("client-status");
const clientNotesInput = document.getElementById("client-notes");
const clientsList = document.getElementById("clients-list");

const dmNicheInput = document.getElementById("dm-niche");
const generateDmButton = document.getElementById("generate-dm");
const dmResults = document.getElementById("dm-results");

const invoiceForm = document.getElementById("invoice-form");
const invoicePreview = document.getElementById("invoice-preview");
const invoiceDate = document.getElementById("invoice-date");
const previewClient = document.getElementById("preview-client");
const previewService = document.getElementById("preview-service");
const previewAmount = document.getElementById("preview-amount");
const printInvoiceButton = document.getElementById("print-invoice");

let clients = loadClients();

const dmTemplates = [
    "Hey, I came across your {niche} page and really liked your content. I help {niche} creators grow their audience and get more clients. Would love to connect!",
    "Hi! I specialize in helping {niche} businesses increase engagement and sales. Quick question-are you currently looking to grow your reach?",
    "Hey! I noticed your {niche} profile and had a few ideas that could help you get more leads. Open to a quick chat?",
    "Hi there! I work with {niche} brands to turn followers into paying clients through simple content systems. Would you be open to a quick idea swap?",
    "Hey, your {niche} content stood out to me. I help {niche} businesses attract consistent leads with better messaging and outreach. Interested in a short chat?",
];

function setupTabs() {
    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const target = button.dataset.tab;

            tabButtons.forEach((btn) => {
                const active = btn.dataset.tab === target;
                btn.classList.toggle("bg-sky-500", active);
                btn.classList.toggle("text-slate-950", active);
                btn.classList.toggle("text-slate-300", !active);
            });

            tabContents.forEach((content) => {
                const show = content.id === `tab-${target}`;
                content.classList.toggle("hidden", !show);
                if (show) {
                    content.classList.remove("fade-in");
                    void content.offsetWidth;
                    content.classList.add("fade-in");
                }
            });
        });
    });

    tabButtons[0].click();
}

function loadClients() {
    try {
        const raw = localStorage.getItem(CLIENTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveClients() {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function getStatusStyles(status) {
    if (status === "Closed") {
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    }
    if (status === "Contacted") {
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    }
    return "bg-sky-500/15 text-sky-300 border-sky-500/30";
}

function renderClients() {
    if (!clients.length) {
        clientsList.innerHTML = `
      <div class="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400 fade-in">
        No clients yet. Add your first lead to get started.
      </div>
    `;
        return;
    }

    clientsList.innerHTML = clients
        .map(
            (client) => `
      <article class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft fade-in">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-100">${escapeHtml(client.name)}</h3>
            <span class="mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusStyles(
                client.status
            )}">
              ${escapeHtml(client.status)}
            </span>
          </div>
          <button
            class="delete-client rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-400 hover:text-rose-300"
            data-id="${client.id}"
          >
            Delete
          </button>
        </div>
        <p class="mt-4 text-sm text-slate-300 whitespace-pre-line">${escapeHtml(client.notes || "No notes")}</p>
      </article>
    `
        )
        .join("");

    document.querySelectorAll(".delete-client").forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            clients = clients.filter((client) => client.id !== id);
            saveClients();
            renderClients();
        });
    });
}

function setupClientForm() {
    clientForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = clientNameInput.value.trim();
        const status = clientStatusInput.value;
        const notes = clientNotesInput.value.trim();

        if (!name) {
            return;
        }

        clients.unshift({
            id: Date.now(),
            name,
            status,
            notes,
        });

        saveClients();
        renderClients();
        clientForm.reset();
        clientStatusInput.value = "Lead";
    });
}

function generateMessages() {
    const niche = dmNicheInput.value.trim();

    if (!niche) {
        dmResults.innerHTML = `
      <div class="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-slate-400">
        Enter a niche to generate messages.
      </div>
    `;
        return;
    }

    const messages = dmTemplates.map((template) => template.replaceAll("{niche}", niche));

    dmResults.innerHTML = messages
        .map(
            (message, index) => `
      <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft fade-in">
                <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">DM ${index + 1}</p>
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm leading-relaxed text-slate-200">${escapeHtml(message)}</p>
          <button
            class="copy-dm shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
            data-message-index="${index}"
          >
            Copy
          </button>
        </div>
      </div>
    `
        )
        .join("");

    document.querySelectorAll(".copy-dm").forEach((button) => {
        button.addEventListener("click", async () => {
            const index = Number(button.dataset.messageIndex);
            const text = messages[index];
            const success = await copyText(text);

            const originalLabel = button.textContent;
            button.textContent = success ? "Copied" : "Failed";
            setTimeout(() => {
                button.textContent = originalLabel;
            }, 1200);
        });
    });
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const area = document.createElement("textarea");
        area.value = text;
        document.body.appendChild(area);
        area.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(area);
        return copied;
    }
}

function setupDmGenerator() {
    generateDmButton.addEventListener("click", generateMessages);

    dmNicheInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            generateMessages();
        }
    });
}

function setupInvoiceGenerator() {
    invoiceForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const client = document.getElementById("invoice-client").value.trim();
        const service = document.getElementById("invoice-service").value.trim();
        const amountInput = document.getElementById("invoice-amount").value;
        const amount = Number(amountInput);

        if (!client || !service || Number.isNaN(amount)) {
            return;
        }

        previewClient.textContent = client;
        previewService.textContent = service;
        previewAmount.textContent = amount.toFixed(2);
        invoiceDate.textContent = new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        invoicePreview.classList.remove("hidden");
        invoicePreview.classList.remove("fade-in");
        void invoicePreview.offsetWidth;
        invoicePreview.classList.add("fade-in");
    });

    printInvoiceButton.addEventListener("click", () => {
        window.print();
    });
}

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function init() {
    setupTabs();
    setupClientForm();
    setupDmGenerator();
    setupInvoiceGenerator();
    renderClients();
}

init();
