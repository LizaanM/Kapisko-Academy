class KalSnackbar extends HTMLElement {
  connectedCallback() {
    this.timer = null;
  }
  show(msg) {
    this.textContent = msg;
    this.classList.add("show");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.classList.remove("show"), 2600);
  }
}

customElements.define("kal-snackbar", KalSnackbar);