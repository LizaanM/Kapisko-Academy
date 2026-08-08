import { store } from "../store.js";
import { svg, ringSVG } from "../icons.js";

// Profiles come from the learner plane (localStorage), never from content.
class KalProfileList extends HTMLElement {
  connectedCallback() {
    this.render = this.render.bind(this);
    store.on("profiles", this.render);
    store.on("profile", this.render);
    store.on("summary", this.render);
    this.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (btn) store.set("profile", btn.dataset.id);
      else if (e.target.closest("[data-add]")) window.dispatchEvent(new CustomEvent("kal:addlearner"));
    });
    this.render();
  }
  render() {
    const profiles = store.get("profiles") || [];
    const summary = store.get("summary") || {};
    const active = store.get("profile") || (profiles[0] && profiles[0].id);
    this.innerHTML = `<div class="side-label">Learner(s)</div>
      <nav class="profiles" aria-label="Switch learner">${profiles
      .map(
        (p) => `
        <button class="profile lift ${p.id === active ? "is-active" : ""}" data-id="${p.id}"
          aria-pressed="${p.id === active}" aria-label="Switch to ${p.name}">
          <span class="avatar av-${p.colour}">${p.init}</span>
          <span class="p-meta"><b>${p.name}</b><small>${p.meta}</small></span>
          <span class="p-ring">${ringSVG((summary[p.id] && summary[p.id].pct) || 0)}</span>
          <span class="p-check">${svg("check")}</span>
        </button>`,
      )
      .join("")}
      <button class="profile profile-add" data-add aria-label="Add a learner" hidden>
        <span class="avatar">${svg("plus")}</span>
        <span class="p-meta"><b>Add a learner</b><small>New profile</small></span>
      </button></nav>`;
  }
}
customElements.define("kal-profile-list", KalProfileList);

class KalStrip extends HTMLElement {
  connectedCallback() {
    this.render = this.render.bind(this);
    store.on("profiles", this.render);
    store.on("profile", this.render);
    store.on("summary", this.render);
    this.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (btn) store.set("profile", btn.dataset.id);
    });
    this.render();
  }
  render() {
    const profiles = store.get("profiles") || [];
    const summary = store.get("summary") || {};
    const active = store.get("profile") || (profiles[0] && profiles[0].id);
    this.innerHTML = profiles
      .map(
        (p) => `
        <button class="strip-item ${p.id === active ? "is-active" : ""}" data-id="${p.id}"
          aria-pressed="${p.id === active}" aria-label="Switch to ${p.name}">
          <span class="avatar av-${p.colour} sm">${p.init}</span>
          <span class="s-name">${p.name.split(" ")[0]}</span>
          <span class="s-ring">${ringSVG((summary[p.id] && summary[p.id].pct) || 0)}</span>
        </button>`,
      )
      .join("");
  }
}
customElements.define("kal-strip", KalStrip);

class KalTopAvatar extends HTMLElement {
  connectedCallback() {
    this.render = this.render.bind(this);
    store.on("profile", this.render);
    store.on("profiles", this.render);
    this.render();
    this.addEventListener("click", () => window.dispatchEvent(new CustomEvent("kal:topavatar")));
  }
  render() {
    const profiles = store.get("profiles") || [];
    const id = store.get("profile") || (profiles[0] && profiles[0].id);
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    this.classList.remove("av-peach", "av-sky", "av-mint", "av-lilac", "av-rose");
    this.classList.add("av-" + p.colour);
    this.textContent = p.init;
  }
}

customElements.define("kal-top-avatar", KalTopAvatar);