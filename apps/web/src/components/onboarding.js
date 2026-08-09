import { store } from "../store.js";
import { learner } from "../learner.js";
import { svg } from "../icons.js";

const AUDIO_SRC = "./assets/audio/welcome.wav";
// Second, shorter clip: a one-shot spoken nudge that plays automatically once
// the grown-up clicks through to the Add-learner card — never while the welcome
// message itself is still audible, never again, and stopped the moment they go
// back. (It also primes browsers' autoplay gate so later taps are reliable.)
const AUDIO_PART2_SRC = "./assets/audio/welcome_part2.wav";
const YEAR_GROUPS = ["Reception (Grade R)", "Year 1", "Year 2", "Year 3"];
const SWATCHES = ["peach", "sky", "mint", "lilac", "rose"];

// Clean-slate onboarding: a welcome card plays the welcome message as a live
// audio wave; "Get Started" reveals the Add-learner card. The only way a fresh
// instance ever gains its first learner (learner plane, ADR-0002).
class KalOnboarding extends HTMLElement {
    connectedCallback() {
        this.step = 1;
        this.colour = "";
        this.yearGroup = "";
        this.hasAudio = false;
        this.live = false;
        this.raf = 0;
        this.preloaded = false;
        this.part2 = null;
        this.part2Loaded = false;
        this.part2Played = false;
        this.source2 = null;
        this.part2Live = false;
        this.addEventListener("click", (e) => this.onClick(e));
        this.addEventListener("input", (e) => {
            if (e.target.closest("[data-live]")) this.updatePreview();
            if (e.target.closest('[name="guardian"]')) {
                const err = this.querySelector("[data-form-err]");
                if (err) err.classList.remove("is-shown");
            }
        });
        this.addEventListener("change", (e) => {
            const swatch = e.target.closest(".swatch input");
            if (swatch) {
                this.colour = swatch.value;
                this.querySelectorAll(".swatch").forEach((el) => {
                    const on = el.querySelector("input") && el.querySelector("input").checked;
                    el.classList.toggle("is-active", on);
                });
                this.updatePreview();
            }
        });
        this.addEventListener("submit", (e) => {
            e.preventDefault();
            this.addLearner();
        });
        // Close the year group menu when tapping outside it.
        this._closeYearGroup = (e) => {
            const wrap = this.querySelector("[data-year-group]");
            if (wrap && wrap.classList.contains("is-open") && !e.target.closest("[data-year-group]")) {
                this.setYearGroupOpen(false);
            }
        };
        window.addEventListener("pointerdown", this._closeYearGroup);
    }

    setYearGroupOpen(open) {
        const wrap = this.querySelector("[data-year-group]");
        if (!wrap) return;
        wrap.classList.toggle("is-open", open);
        const btn = wrap.querySelector(".on-select-btn");
        if (btn) btn.setAttribute("aria-expanded", String(open));
    }

    show() {
        this.classList.add("is-open");
        document.body.classList.add("onboarding");
        this.render();
        this.loop();
        // Load the welcome clip into memory so the very first speaker tap has
        // zero fetch delay — but never START it. Arming a source here used to
        // mutate into real playback the moment any later gesture (e.g. the
        // Get Started click) re-enabled the AudioContext, so part 2 would start
        // and then the welcome would begin stacking over it.
        this.preloadWelcome();
    }

    dismiss() {
        this.stop();
        this.classList.remove("is-open");
        document.body.classList.remove("onboarding");
    }

    async preloadWelcome() {
        if (this.preloaded) return;
        this.preloaded = true;
        if (!window.AudioContext) return;
        if (!this.ctx) this.ctx = new AudioContext();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.85;
        try {
            const res = await fetch(AUDIO_SRC);
            const buf = await res.arrayBuffer();
            const decoded = await this.ctx.decodeAudioData(buf);
            this.audio = decoded;
            this.hasAudio = true;
        } catch {
            this.hasAudio = false;
        }
    }

    async play() {
        if (this.step !== 1) return;
        if (!window.AudioContext) return;
        if (!this.ctx) await this.preloadWelcome();
        if (!this.hasAudio) return;
        // (Re)start from the beginning.
        if (this.source) {
            try {
                this.source.stop();
            } catch {
                /* already stopped */
            }
        }
        const src = this.ctx.createBufferSource();
        src.buffer = this.audio;
        src.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        src.onended = () => {
            // A stale `onended` from a DELIBERATELY stopped previous source
            // (src.stop() still fires the ended event) must not wipe the state
            // of the source currently audible. Only the live source may clear it.
            if (this.source !== src) return;
            this.live = false;
            this.source = null;
            this.syncToggle();
        };
        this.source = src;
        this.live = true;
        // Autoplay: browser may keep the context suspended until a gesture; the
        // wave keeps moving on a synthesised pulse meanwhile, and the first tap
        // (resume listener in connectedCallback) grants real sound.
        await this.ctx.resume().catch(() => {});
        src.start();
        this.syncToggle();
    }

    // The centred play button is an affordance: it fades out the moment audio
    // is actually audible, revealing the waveform untouched below it.
    syncToggle() {
        const wrap = this.querySelector(".wave-wrap");
        if (!wrap) return;
        const live = this.live && this.ctx && this.ctx.state === "running";
        wrap.classList.toggle("is-live", live);
    }

    stop() {
        this.live = false;
        this.part2Live = false;
        cancelAnimationFrame(this.raf);
        this.raf = 0;
        if (this.source) {
            try {
                this.source.stop();
            } catch {
                /* already stopped */
            }
        }
        if (this.source2) {
            try {
                this.source2.stop();
            } catch {
                /* already stopped */
            }
        }
        this.source = null;
        this.source2 = null;
        this.draw();
    }

    async loadPart2() {
        if (this.part2Loaded) return;
        this.part2Loaded = true;
        try {
            const res = await fetch(AUDIO_PART2_SRC);
            const buf = await res.arrayBuffer();
            this.part2 = await this.ctx.decodeAudioData(buf);
        } catch {
            this.part2 = null;
        }
    }

    // One-shot clip for the Add-learner card. Loaded on demand (not at init, so
    // the welcome message's first fetch stays snappy); never loops — and plays
    // only ONCE per visit, however often the grown-up bounces back and forth.
    async playPart2() {
        if (this.step !== 2) return;
        if (this.part2Played) return;
        if (!window.AudioContext) return;
        if (!this.ctx) this.ctx = new AudioContext();
        await this.loadPart2();
        if (!this.part2) return;
        const src = this.ctx.createBufferSource();
        src.buffer = this.part2;
        src.connect(this.ctx.destination);
        src.onended = () => {
            if (this.source2 !== src) return;
            this.part2Live = false;
            this.source2 = null;
        };
        this.source2 = src;
        this.part2Live = true;
        this.part2Played = true;
        // Get Started IS the user gesture, so resume must be requested while the
        // click's transient activation still applies; buffer decode above is
        // awaited, but resume() is what grants sound — call it right before start.
        const resume = this.ctx.resume();
        src.start();
        if (resume && resume.catch) resume.catch(() => {});
    }

    // Always-running animation loop: the wave never sits still, whether the
    // audio is live (frequency data) or waiting on a gesture (synthesised).
    loop() {
        if (this.raf) return;
        const tick = () => {
            if (!this.classList.contains("is-open")) {
                this.raf = 0;
                return;
            }
            this.draw();
            this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
    }

    draw() {
        this.syncToggle();
        const cv = this.querySelector("canvas");
        if (!cv) return;
        const dpr = window.devicePixelRatio || 1;
        const w = cv.clientWidth;
        const h = cv.clientHeight;
        if (cv.width !== w * dpr || cv.height !== h * dpr) {
            cv.width = w * dpr;
            cv.height = h * dpr;
        }
        const g = cv.getContext("2d");
        g.save();
        g.scale(dpr, dpr);
        g.clearRect(0, 0, w, h);

        const mid = h / 2;
        const live = this.live && this.analyser && this.ctx && this.ctx.state === "running";

        const N = 48;
        const bw = w / N;
        const t = performance.now() / 1000;

        let levels;
        if (live) {
            const freq = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(freq);
            // Loudness = mean energy; it modulates the SAME organic waveform used
            // pre-gesture, so live mode keeps the lively wandering surface the user
            // likes, while still visibly reacting to the sound.
            let sum = 0;
            for (let j = 0; j < freq.length; j++) sum += freq[j];
            const e = sum / freq.length / 255;
            const breath = 0.6 + e * 1.0;
            levels = new Array(N);
            for (let i = 0; i < N; i++) {
                const a = Math.sin(i * 0.55 - t * 3.6);
                const b = Math.sin(i * 1.1 + t * 2.8);
                const ripple = Math.sin(i * 2.3 - t * 6.4) * Math.sin(i * 0.5 + t * 3.1);
                const organic = 0.2 + 0.4 * (0.5 + 0.5 * (0.5 * a + 0.3 * b)) + 0.13 * (0.5 + 0.5 * ripple);
                levels[i] = Math.min(1, organic * breath);
            }
        } else {
            levels = new Array(N);
            for (let i = 0; i < N; i++) {
                // Organic feel pre-gesture too: two travelling waves (opposite
                // directions) plus a finer ripple — a livelier, wandering surface.
                const a = Math.sin(i * 0.55 - t * 3.6);
                const b = Math.sin(i * 1.1 + t * 2.8);
                const ripple = Math.sin(i * 2.3 - t * 6.4) * Math.sin(i * 0.5 + t * 3.1);
                levels[i] =
                    0.2 +
                    0.4 * (0.5 + 0.5 * (0.5 * a + 0.3 * b)) +
                    0.13 * (0.5 + 0.5 * ripple) +
                    0.06 * Math.sin(t * 5.5 + i);
            }
        }

        // Smooth vertical motion so bars glide instead of snapping — but stay
        // quick enough that the travelling waves keep their visible momentum.
        if (!this.smooth) this.smooth = new Float32Array(N).fill(0);
        const k = live ? 0.4 : 0.28;
        for (let i = 0; i < N; i++) this.smooth[i] += (levels[i] - this.smooth[i]) * k;

        // Centred mound: Hann taper (cosine window) — bars rise to a peak in the
        // middle and taper to zero on both edges.
        const grad = g.createLinearGradient(0, mid - h * 0.42, 0, mid + h * 0.42);
        grad.addColorStop(0, "rgba(255, 242, 170, 1)");
        grad.addColorStop(0.5, "rgba(255, 231, 120, 0.75)");
        grad.addColorStop(1, "rgba(255, 242, 170, 1)");
        g.fillStyle = grad;

        for (let i = 0; i < N; i++) {
            const cx = (i + 0.5) / N;
            const taper = 0.5 - 0.5 * Math.cos(cx * Math.PI * 2);
            const v = Math.max(0.03, this.smooth[i] * taper);
            const amp = v * (h * 0.48);
            const x = i * bw + bw * 0.2;
            const br = bw * 0.6;
            const rr = Math.min(5, br / 2);
            const y0 = mid - amp;
            g.beginPath();
            g.moveTo(x, y0 + rr);
            g.arc(x + rr, y0 + rr, rr, Math.PI, 1.5 * Math.PI);
            g.arc(x + br - rr, y0 + rr, rr, 1.5 * Math.PI, 0);
            g.arc(x + br - rr, mid + amp - rr, rr, 0, 0.5 * Math.PI);
            g.arc(x + rr, mid + amp - rr, rr, 0.5 * Math.PI, Math.PI);
            g.moveTo(x, y0 + rr);
            g.fill();
        }
        g.restore();
    }

    updatePreview() {
        const input = this.querySelector('[name="name"]');
        const name = input ? input.value : "";
        const initEl = this.querySelector(".on-preview .avatar");
        if (!initEl) return;
        // Empty name keeps the friendly "?" placeholder (initials appear only
        // once a name is entered), so the preview never looks wiped blank.
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) {
            initEl.textContent = "?";
        } else {
            initEl.textContent =
                parts.length === 1
                    ? parts[0].slice(0, 2).toUpperCase()
                    : parts
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
        }
        initEl.classList.remove("av-peach", "av-sky", "av-mint", "av-lilac", "av-rose");
        initEl.classList.add("av-" + (this.colour || "peach"));
        const btn = this.querySelector(".on-submit");
        if (btn) btn.disabled = !name.trim();
    }

    async onClick(e) {
        const goNext = e.target.closest("[data-next]");
        if (goNext) {
            // A clip is genuinely audible only when the context is running —
            // the armed-but-suspended state after show() counts as silent.
            const stillAudible = this.live && this.ctx && this.ctx.state === "running";
            // Moving to the Add-learner card never PAUSES the welcome message:
            // it keeps playing through the whole navigation. Only the wave frame
            // stops (there's no canvas on the Add card); it resumes on the way
            // back via loop().
            cancelAnimationFrame(this.raf);
            this.raf = 0;
            this.step = 2;
            this.render();
            const input = this.querySelector('[name="name"]');
            if (input) input.focus();
            // The hand-on-now nudge plays only when the welcome message wasn't
            // mid-audio (a still-speaking voice must never stack a second one).
            if (!stillAudible) this.playPart2();
            return;
        }
        const back = e.target.closest("[data-back]");
        if (back) {
            // Back to the welcome card: the welcome message (if it was playing)
            // rides on — navigation must not pause it. Only the one-shot add-on
            // clip belongs on the Add card, so it is cut here.
            if (this.source2) {
                try {
                    this.source2.stop();
                } catch {
                    /* already stopped */
                }
            }
            this.source2 = null;
            this.part2Live = false;
            this.step = 1;
            this.render();
            this.loop();
            return;
        }
        const yearBtn = e.target.closest(".on-select-btn");
        if (yearBtn) {
            const wrap = this.querySelector("[data-year-group]");
            this.setYearGroupOpen(!wrap.classList.contains("is-open"));
            return;
        }
        const yearOpt = e.target.closest("[data-year-group-opt]");
        if (yearOpt) {
            this.yearGroup = yearOpt.dataset.yearGroupOpt;
            const label = this.querySelector("[data-year-group-label]");
            label.textContent = this.yearGroup;
            label.classList.remove("is-placeholder");
            this.querySelector('[name="year-group"]').value = this.yearGroup;
            this.querySelectorAll("[data-year-group-opt]").forEach((li) =>
                li.classList.toggle("is-selected", li === yearOpt),
            );
            const formErr = this.querySelector("[data-form-err]");
            if (formErr) formErr.classList.remove("is-shown");
            this.setYearGroupOpen(false);
            return;
        }
        const playBtn = e.target.closest("[data-play]");
        if (playBtn) {
            this.play();
            return;
        }
        const submit = e.target.closest("[data-submit]");
        if (submit) this.addLearner();
    }

    async addLearner() {
        const form = this.querySelector("form");
        if (!form || !form.checkValidity()) return;
        const name = form.name.value.trim();
        const yearGroup = form["year-group"].value;
        const pwField = form.guardian;
        // One reserved message line below the Start button serves every field
        // error (year group then password), so the card never shifts height.
        const formErr = this.querySelector("[data-form-err]");

        // Year group has no default anymore — the grown-up must pick one.
        const yearGroupWrap = this.querySelector("[data-year-group]");
        if (!yearGroup) {
            if (yearGroupWrap) {
                yearGroupWrap.classList.add("is-invalid");
                setTimeout(() => yearGroupWrap.classList.remove("is-invalid"), 900);
                yearGroupWrap.querySelector(".on-select-btn").focus();
            }
            if (formErr) {
                formErr.textContent = "Please choose a year group to continue.";
                formErr.classList.add("is-shown");
            }
            return;
        }
        if (yearGroupWrap) yearGroupWrap.classList.remove("is-invalid");

        // Guardian gate: one password per instance controls grown-up actions
        // (removing learners, teacher settings). A child types it only when a
        // grown-up is present. First add sets it; later adds must match it.
        const hasGuard = learner.hasGuardian();
        if (!pwField.value) {
            if (formErr) {
                formErr.textContent = "Please choose a password.";
                formErr.classList.add("is-shown");
            }
            pwField.focus();
            return;
        }
        const okGuard = hasGuard
            ? await learner.check(pwField.value)
            : await learner.setGuardian(pwField.value);
        if (!okGuard) {
            if (formErr) {
                formErr.textContent = "That password doesn’t match. Ask a grown-up.";
                formErr.classList.add("is-shown");
            }
            pwField.value = "";
            pwField.focus();
            return;
        }
        if (formErr) formErr.classList.remove("is-shown");
        const profile = learner.addProfile({ name, meta: yearGroup, colour: this.colour });
        store.set("profiles", learner.profiles());
        store.set("profile", profile.id);
        this.dismiss();
        document.dispatchEvent(new CustomEvent("kal:learner-added", { detail: { profile } }));
    }

    render() {
        this.innerHTML = `<div class="on-backdrop">${this.cardHTML()}</div>`;
        this.updatePreview();
    }

    cardHTML() {
        if (this.step === 1) {
            return `
        <div class="on-card on-welcome reveal lift">
          <h1>Welcome to<br />Kapisko Academy</h1>
          <div class="wave-wrap">
            <canvas aria-label="Audio wave"></canvas>
            <button class="wave-toggle" data-play aria-label="Play welcome message">
              ${svg("play")}
            </button>
          </div>
          <button class="btn btn-primary on-cta" data-next>
            Get Started ${svg("arrow")}
          </button>
        </div>`;
        }
        return `
      <div class="on-card on-add reveal lift">
        <button class="on-back" data-back aria-label="Back to welcome">${svg("chev-l")}</button>
        <h1>Add a learner</h1>
        <p class="on-sub">Who are we learning with today?</p>
        <form class="on-form" novalidate>
          <label class="on-label">
            <span>Name</span>
            <input class="on-input" name="name" data-live placeholder="e.g. Mia..." maxlength="40" autocomplete="off" required />
          </label>
          <div class="on-label">
            <span>Year Group</span>
            <div class="on-select" data-year-group>
              <button class="on-input on-select-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
                <span data-year-group-label class="${this.yearGroup ? "" : "is-placeholder"}">${this.yearGroup || "Choose a year group"}</span>
                ${svg("chev-d")}
              </button>
              <ul class="on-select-menu" role="listbox">
                ${YEAR_GROUPS.map((g) => `<li role="option" data-year-group-opt="${g}" class="${g === this.yearGroup ? "is-selected" : ""}">${g}</li>`).join("")}
              </ul>
            </div>
            <input type="hidden" name="year-group" value="${this.yearGroup || ""}" />
          </div>
          <label class="on-label">
            <span>Parent or teacher password</span>
            <input class="on-input" type="password" name="guardian" autocomplete="current-password" maxlength="64" placeholder="Please choose a password..." />
          </label>
          <fieldset class="on-swatches">
            <legend>Pick an avatar colour</legend>
            <div class="swatches">
              ${SWATCHES.map(
                  (c) => `
                <label class="swatch av-${c} ${c === (this.colour || "peach") ? "is-active" : ""}">
                  <input type="radio" name="colour" value="${c}" ${c === (this.colour || "peach") ? "checked" : ""} />
                  <span class="init"></span>
                </label>
              `,
              ).join("")}
            </div>
          </fieldset>
<div class="on-preview">
        <span class="avatar av-peach init" aria-hidden="true">?</span>
        <span class="on-preview-txt">
          <b>Your learner</b>
          <small>Initials appear on their avatar</small>
        </span>
      </div>
          <button class="btn btn-primary on-submit" type="button" data-submit disabled>
            Start learning ${svg("arrow")}
          </button>
          <p class="on-year-group-err" data-form-err>Please choose a year group to continue.</p>
        </form>
      </div>`;
    }
}

customElements.define("kal-onboarding", KalOnboarding);
