import { learner } from "../learner.js";

// Guardian gate: a supervisor-only overlay. Whatever called it supplies a brief
// and an action; the action runs only after the instance guardian password
// verifies. Children never reach it — the overlay covers the whole app.
const esc = (s) =>
    String(s).replace(
        /[&<>"']/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

class KalGuardian extends HTMLElement {
    connectedCallback() {
        this.addEventListener("click", async (e) => {
            if (e.target.closest("[data-cancel]")) {
                this.close();
                return;
            }
            if (e.target.closest("[data-confirm]")) await this.confirm();
        });
        this.addEventListener("submit", async (e) => {
            e.preventDefault();
            await this.confirm();
        });
    }

    input() {
        return this.querySelector("[name=guardian]");
    }

    open({ title, brief, action }) {
        this.action = action;
        document.body.classList.add("gate-open");
        this.classList.add("is-open");
        this.innerHTML = `
      <div class="gate-backdrop" data-cancel></div>
      <div class="gate-card gate-guard" role="dialog" aria-modal="true" aria-label="Grown-up check">
        <button class="icon-btn gate-x" data-cancel aria-label="Close">×</button>
        <h2>${esc(title)}</h2>
        <p class="gate-sub">${esc(brief)}</p>
        <form autocomplete="off">
          <label class="on-label">
            <span>Parent or teacher password</span>
            <input class="on-input" type="password" name="guardian" autocomplete="current-password" placeholder="Grown-up password" maxlength="64" />
            <p class="on-guard-err" data-err hidden>That password doesn’t match. Ask your teacher for assistance.</p>
          </label>
          <div class="gate-actions">
            <button class="btn btn-ghost" data-cancel>Cancel</button>
            <button class="btn btn-primary" data-confirm>Confirm</button>
          </div>
        </form>
      </div>`;
        this.querySelector("input").focus();
    }

    async confirm() {
        const ok = await learner.check(this.input().value);
        if (!ok) {
            this.fail();
            return;
        }
        const action = this.action;
        this.close();
        if (action) action();
    }

    fail() {
        const err = this.querySelector("[data-err]");
        if (err) err.hidden = false;
        const input = this.querySelector("input");
        if (input) input.value = "";
        if (input) input.focus();
    }

    close() {
        document.body.classList.remove("gate-open");
        this.classList.remove("is-open");
        this.innerHTML = "";
        this.action = null;
    }
}
customElements.define("kal-guardian", KalGuardian);
