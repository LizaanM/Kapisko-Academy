import { store } from "../store.js";
import { learner } from "../learner.js";

// Card box: review the unit's sound variants as flash cards. Answering a card
// appends a Learning Event; the engine derives the Mastery Gate (90% rule) from
// those events. Learner plane only — nothing here is stored in the repo.
class KalCardBox extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", (e) => {
      const item = e.target.closest("[data-item]");
      if (item) {
        this.answer(item.dataset.item, item.dataset.outcome === "1");
        return;
      }
      if (e.target.closest("[data-close]")) this.close();
    });
  }

  open() {
    this.cursor = 0;
    this.cards = (store.get("content") || {}).variants || [];
    document.body.classList.add("gate-open");
    this.classList.add("is-open");
    this.classList.remove("is-done");
    this.show();
  }

  close() {
    document.body.classList.remove("gate-open");
    this.classList.remove("is-open", "is-done");
  }

  show() {
    if (this.cursor >= this.cards.length) {
      this.renderDone();
      return;
    }
    const c = this.cards[this.cursor];
    const profile = store.get("profile");
    const events = learner.events(profile);
    this.innerHTML = `
      <div class="gate-backdrop" data-close></div>
      <div class="gate-card" role="dialog" aria-modal="true" aria-labelledby="gateTitle">
        <button class="icon-btn gate-x" data-close aria-label="Close">×</button>
        <h2 id="gateTitle">Card box · /ee/</h2>
        <p class="gate-sub">Review ${this.cards.length} spellings, then master the gate.</p>
        <div class="gate-progress"><i style="width:${(this.cursor / this.cards.length) * 100}%"></i></div>
        <div class="gate-body">
          <span class="gate-grapheme" data-speak="${c.grapheme}">${c.grapheme}</span>
          <p class="gate-word">${c.word}</p>
          <div class="gate-actions">
            <button class="btn btn-ghost" data-item="${c.id}" data-outcome="0">Not yet</button>
            <button class="btn btn-primary" data-item="${c.id}" data-outcome="1">Knew it</button>
          </div>
        </div>
      </div>`;
  }

  answer(item, outcome) {
    const profile = store.get("profile");
    // A failed attempt still teaches the family — both outcomes are events.
    learner.record(profile, item || "unset", outcome ? 1 : 0);
    this.cursor += 1;
    this.show();
  }

  renderDone() {
    const profile = store.get("profile");
    const events = learner.events(profile);
    // Latest attempt per card governs mastery (90% rule), via the engine's gate.
    const engine = store.get("engine") || {};
    const lastOf = new Map();
    for (const ev of events) lastOf.set(ev.item, ev.outcome);
    let right = 0;
    for (const c of this.cards) if (lastOf.get(c.id)) right += 1;
    const total = this.cards.length;
    const pct = total ? Math.round((right / total) * 100) : 0;
    const threshold = engine.DEFAULT_THRESHOLD || 0.9;
    const passed = total > 0 && pct / 100 >= threshold;
    this.classList.add("is-done");
    this.innerHTML = `
      <div class="card-backdrop" data-close></div>
      <div class="gate-card gate-done" role="dialog" aria-modal="true" aria-labelledby="gateTitle">
        <button class="gate-close" data-close aria-label="Close">×</button>
        <div class="gate-medal ${passed ? "ok" : ""}">${passed ? "★" : "—"}</div>
        <h2 id="gateTitle">${passed ? "Mastery gate met!" : "Keep going"}</h2>
        <p class="gate-sub">${pct}% right — the 90% rule ${passed ? "passed" : "falls short today"}.</p>
        <div class="bar gate-bar"><i style="width:${pct}%"></i></div>
        <button class="btn btn-primary" data-close>Done</button>
      </div>`;
  }
}
customElements.define("kal-card-box", KalCardBox);