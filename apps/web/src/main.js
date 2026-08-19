import { store } from "./store.js";
import { svg } from "./icons.js";
import { loadContent, loadEngine, shape } from "./content.js";
import { learner } from "./learner.js";
import "./components/profiles.js";
import "./components/week-pathway.js";
import "./components/card-box.js";
import "./components/guardian.js";
import "./components/snackbar.js";
import "./components/onboarding.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function snack(msg) {
    const el = $("kal-snackbar");
    if (el) el.show(msg);
}

function syncGreeting() {
    const profiles = store.get("profiles") || [];
    const id = store.get("profile") || (profiles[0] && profiles[0].id);
    const p = profiles.find((x) => x.id === id);
    if (p) {
        const h = new Date().getHours();
        const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
        const el = $("#greeting");
        if (el) el.textContent = `${part}, ${p.name.split(" ")[0]}.`;
    }
}

function speakSound() {
    try {
        const u = new SpeechSynthesisUtterance("ee");
        u.lang = "en-GB";
        u.rate = 0.75;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
        snack("Playing the sound /ee/");
    } catch (e) {
        snack("Sound playback isn't available here.");
    }
}

// Ask the instance server whether our state file still exists. When ./reset has
// deleted it the answer is { exists: false }, which means "this instance was
// told to start fresh": wipe every kap.* localStorage key so the welcome
// onboarding shows again. A missing /api/state (plain static server or server
// down) means "keep whatever the browser has" — the browser stays the authority.
async function resetIfCleared() {
    try {
        const res = await fetch("api/state", { cache: "no-store" });
        if (!res.ok) return;
        const state = await res.json();
        if (!state.exists) {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.indexOf("kap.") === 0) localStorage.removeItem(key);
            }
        }
    } catch {
        /* server unreachable — do not touch the learner plane */
    }
}

async function init() {
    // A deleted instance state file means the grown-up ran ./reset: start the
    // learner plane from a blank slate on first boot after that.
    await resetIfCleared();

    // Bind heart beats before content kickstarts renders (ADR-0007: listener
    // must survive the first `kal:progress` from week-pathway).
    document.addEventListener("kal:progress", (e) => {
        const bar = $("#weekBar");
        const pct = $("#weekPct");
        if (bar) bar.style.width = e.detail.pct + "%";
        if (pct) pct.textContent = e.detail.pct + "%";
    });

    const content = store.get("content");
    if (!content) {
        const [release, engine] = await Promise.all([loadContent(), loadEngine()]);
        store.set("engine", engine);
        store.set("content", shape(release));
        learner.init();
        const profiles = learner.profiles();
        store.set("profiles", profiles);
        store.set("summary", {});
        store.set("profile", (profiles[0] && profiles[0].id) || "");
        // Clean slate: a fresh instance has zero learners, so its first screen is
        // the welcome/onboarding overlay. It is the only way a profile is born.
        if (profiles.length === 0) {
            document.body.classList.add("onboarding");
        }
    }
    const onboarding = $("kal-onboarding");
    if (onboarding && document.body.classList.contains("onboarding")) onboarding.show();
    syncGreeting();

    store.on("profile", () => {
        const w = document.querySelector("kal-week-pathway");
        if (w) {
            w.state();
            w.renderGrid();
            w.updateAllProgress();
        }
        syncGreeting();
    });

    document.querySelectorAll("[data-icon]").forEach((el) => {
        if (el.textContent.trim()) {
            el.insertAdjacentHTML("afterbegin", svg(el.dataset.icon));
        } else {
            el.innerHTML = svg(el.dataset.icon);
        }
    });

    const menuBtn = $("#menuBtn");
    const backdrop = $("#backdrop");
    if (menuBtn) menuBtn.addEventListener("click", () => document.body.classList.add("drawer-open"));
    if (backdrop) backdrop.addEventListener("click", () => document.body.classList.remove("drawer-open"));

    document.addEventListener("kal:topavatar", () => {
        if (window.innerWidth < 1025) document.body.classList.add("drawer-open");
        else {
            const profiles = store.get("profiles");
            const p = profiles.find((x) => x.id === store.get("profile"));
            if (p) snack("You are studying as " + p.name);
        }
    });
    document.addEventListener("kal:addlearner", () => {
        // A grown-up adds a new learner against a live dashboard.
        const ob = $("kal-onboarding");
        if (ob) {
            ob.step = 2;
            ob.colour = "";
            ob.show(true);
            return;
        }
        snack("Ask your teacher to assist you.");
    });

    document.addEventListener("kal:removelearner", (e) => {
        const id = e.detail && e.detail.id;
        const profiles = store.get("profiles") || [];
        const target = profiles.find((p) => p.id === id);
        if (!target) return;
        const gate = $("kal-guardian");
        if (!gate) return;
        gate.open({
            title: `Remove ${target.name}?`,
            brief: "This deletes their progress. Enter the parent or teacher password to confirm.",
            action: () => {
                learner.removeProfile(id);
                const next = learner.profiles();
                store.set("profiles", next);
                const active = store.get("profile");
                if (!next.some((p) => p.id === active)) {
                    store.set("profile", (next[0] && next[0].id) || "");
                }
                snack(`Removed ${target.name}`);
            },
        });
    });

    const teacherBtn = $("#teacherBtn");
    const exitTeacherBtn = $("#exitTeacherBtn");
    const settingsBtn = $("#settingsBtn");
    const reportsBtn = $("#reportsBtn");
    const bellBtn = $("#bellBtn");
    const audioBtn = $("#audioBtn");
    const startBtn = $("#startBtn");
    const variantRow = $("#variantRow");

    if (teacherBtn)
        teacherBtn.addEventListener("click", () => {
            const gate = $("kal-guardian");
            if (gate)
                gate.open({
                    title: "Teacher’s dashboard",
                    brief: "Enter your supervisor password to open teacher tools.",
                    action: () => document.body.classList.add("teacher-mode"),
                });
        });
    if (exitTeacherBtn)
        exitTeacherBtn.addEventListener("click", () => document.body.classList.remove("teacher-mode"));
    if (settingsBtn)
        settingsBtn.addEventListener("click", () => {
            const gate = $("kal-guardian");
            if (gate)
                gate.open({
                    title: "Teacher settings",
                    brief: "Enter your supervisor password to access settings.",
                    action: () => snack("Settings are managed by your teacher"),
                });
        });
    if (reportsBtn)
        reportsBtn.addEventListener("click", () => snack("Progress reports open in the teacher view"));
    if (bellBtn)
        bellBtn.addEventListener("click", () => snack("No new notifications — you're all caught up!"));
    if (audioBtn) audioBtn.addEventListener("click", speakSound);
    if (variantRow) variantRow.addEventListener("click", speakSound);
    if (startBtn)
        startBtn.addEventListener("click", () => {
            const grid = $("kal-week-pathway");
            if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
        });

    const search = $("#search");
    if (search)
        search.addEventListener("input", () => {
            const q = search.value.trim().toLowerCase();
            $$(".day-card[data-day]").forEach((card) => {
                card.classList.toggle("hide", !!q && card.getAttribute("data-search").indexOf(q) === -1);
            });
        });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
