import { store } from "../store.js";
import { svg, KIND_ICON, ACCENT } from "../icons.js";
import { learner } from "../learner.js";

function snack(msg) {
  const el = document.querySelector("kal-snackbar");
  if (el) el.show(msg);
}

class KalWeekPathway extends HTMLElement {
  connectedCallback() {
    this.offset = 0;
    this.state();
    this.renderShell();
    this.renderGrid();
    this.wire();
    store.on("content", () => {
      this.state();
      this.renderGrid();
      this.updateAllProgress();
    });
  }

  mondayOf() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + this.offset * 7);
    return d;
  }

  fmtDay(d) {
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }

  sameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
    );
  }

  renderShell() {
    this.classList.add("week", "reveal");
    this.innerHTML = `
      <div class="week-head">
        <div><h2>Weekly lesson pathway</h2><p data-week-range></p></div>
        <div class="week-nav">
          <button class="icon-btn" data-nav="-1" aria-label="Previous week">${svg("chev-l")}</button>
          <span data-week-label>This week</span>
          <button class="icon-btn" data-nav="1" aria-label="Next week">${svg("chev-r")}</button>
        </div>
      </div>
      <div class="grid"></div>`;
  }

  renderGrid() {
    const content = store.get("content") || {};
    const grid = this.querySelector(".grid");
    const days = content.days || [];
    grid.innerHTML =
      days
        .map((day, i) => {
          const acc = ACCENT[day.accent] || ["#eee", "#bbb"];
          const spellChip = day.variant
            ? `<span class="chip variant">${day.spell}</span><span class="focus-tag">variant</span>`
            : `<span class="chip">${day.spell}</span>`;
          const steps = day.steps
            .map((st) => {
              const state = this.stepState(st.id);
              const icon = svg(KIND_ICON[st.k]);
              const done = state === "done";
              return `<li class="step ${state}" data-step="${st.id}" data-kind="${st.k}">
                <button class="step-hit" aria-pressed="${done}" aria-label="${st.t}: ${st.n}">
                  <span class="node">${done ? svg("check") : icon}</span>
                  <span class="step-txt"><b>${st.t}</b><em>${st.n}</em></span>
                  ${state === "today" ? '<span class="now-chip">Now</span>' : ""}
                </button>
              </li>`;
            })
            .join("");
          const searchKey = [day.name, day.focus, day.spell, ...day.steps.map((s) => s.t + " " + s.n)]
            .join(" ")
            .toLowerCase();
          return `
          <article class="day-card reveal lift" data-day="${day.name}" data-search="${searchKey}"
            style="--accent:${acc[0]};--accent-deep:${acc[1]};--d:${0.08 + i * 0.05}s">
            <header class="day-head">
              <span class="day-pill">${day.name.slice(0, 3)}</span>
              <div class="day-id"><h3>${day.name}</h3><span class="day-date"></span></div>
              <span class="day-tag" hidden>Today</span>
            </header>
            <div class="day-focus"><span class="focus-sound">/ee/</span><span class="focus-as">${day.focus}</span>${spellChip}</div>
            <ol class="steps">${steps}</ol>
            <footer class="day-foot"><div class="bar"><i></i></div><span class="day-count"></span></footer>
          </article>`;
        })
        .join("") +
      `<article class="day-card finish reveal lift" style="--d:.3s">
        <span class="deco d1">${svg("star")}</span>
        <span class="deco d2">${svg("sparkle")}</span>
        <span class="deco d3"></span><span class="deco d4"></span>
        <h3>Finish the week</h3>
        <p>Friday's review turns practice into celebration.</p>
        <button class="btn btn-ghost" data-go-friday>Go to Friday</button>
        <button class="btn btn-primary" data-review-card box>Review card box</button>
      </article>`;
  }

  stepState(id) {
    const state = store.get("state") || {};
    return state[id] || "todo";
  }

  state() {
    const content = store.get("content") || {};
    const profile = store.get("profile");
    const engine = store.get("engine");
    const steps = (content.days || []).flatMap((d) => d.steps);
    if (!engine || !steps.length) return;
    const summary = learner.summarize(profile, steps, engine);
    const next = {};
    let current = true;
    for (const s of steps) {
      const sd = summary.done.find((d) => d.id === s.id) || { done: false };
      if (sd.done) {
        next[s.id] = "done";
      } else if (current) {
        next[s.id] = "today";
        current = false;
      } else {
        next[s.id] = "todo";
      }
    }
    store.set("state", next);
    this.publishProgress(summary);
  }

  publishProgress(summary) {
    const content = store.get("content") || {};
    const total = (content.days || []).reduce((n, d) => n + d.steps.length, 0);
    const done = (content.days || []).flatMap((d) => d.steps).filter((s) => summary.done.find((x) => x.id === s.id)?.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.dispatchEvent(new CustomEvent("kal:progress", { detail: { pct } }));
    const summaries = store.get("summary") || {};
    summaries[store.get("profile")] = { pct };
    store.set("summary", summaries);
  }

  renderWeek() {
    const mon = this.mondayOf();
    this.querySelectorAll(".day-card[data-day]").forEach((card, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      card.querySelector(".day-date").textContent = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      const today = this.sameDay(d, new Date());
      card.querySelector(".day-tag").hidden = !today;
    });
    const fri = new Date(mon);
    fri.setDate(mon.getDate() + 4);
    this.querySelector("[data-week-range]").textContent =
      this.fmtDay(mon) + " – " + this.fmtDay(fri) + ", " + fri.getFullYear();
    const label = this.offset === 0 ? "This week" : this.offset === -1 ? "Last week"
      : this.offset === 1 ? "Next week" : "Week " + (12 + this.offset);
    this.querySelector("[data-week-label]").textContent = label;
  }

  updateAllProgress() {
    const content = store.get("content") || {};
    const state = store.get("state") || {};
    this.querySelectorAll(".day-card[data-day]").forEach((card) => {
      const day = (content.days || []).find((d) => d.name === card.getAttribute("data-day"));
      if (!day) return;
      const done = day.steps.filter((s) => state[s.id] === "done").length;
      card.querySelector(".bar i").style.width = (done / day.steps.length) * 100 + "%";
      card.querySelector(".day-count").textContent =
        done + " of " + day.steps.length + " steps · ≈ " + day.mins + " min";
    });
  }

  wire() {
    this.addEventListener("click", (e) => {
      const step = e.target.closest(".step[data-step]");
      if (step) {
        const id = step.dataset.step;
        learner.record(store.get("profile"), id, 1); // Learning Event (append-only)
        snack("Nice work — step complete!");
        this.state();
        this.renderGrid();
        this.updateAllProgress();
        return;
      }
      const goFriday = e.target.closest("[data-go-friday]");
      if (goFriday) {
        const friday = this.querySelector('.day-card[data-day="Friday"]');
        if (friday) {
          friday.scrollIntoView({ behavior: "smooth", block: "center" });
          snack("Heading to Friday's review");
        }
        return;
      }
      const box = e.target.closest("[data-review-card]");
      if (box) {
        const el = document.querySelector("kal-card-box");
        if (el) el.open();
        return;
      }
      const nav = e.target.closest("[data-nav]");
      if (nav) {
        this.offset += Number(nav.dataset.nav);
        this.renderWeek();
        return;
      }
      const card = e.target.closest(".day-card[data-day]");
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  render() {
    this.renderShell();
    this.renderGrid();
    this.renderWeek();
    this.updateAllProgress();
  }
}

customElements.define("kal-week-pathway", KalWeekPathway);