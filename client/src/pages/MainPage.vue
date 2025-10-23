<template>
  <div class="main-page">
    <!-- Header (Wireframe Look) -->
    <header class="header">
      <div class="header-left">
      </div>
      <h1>Tag der offenen Tür</h1>
      <div class="header-right">
      </div>
    </header>

    <main class="content">
      <!-- Tabs / Top Navigation -->
      <section class="top-tabs">

        <ul class="tabs-list" ref="tabsList">
          <li
            v-for="(task, i) in visibleTasks"
            :key="task.aufgabeid || 'placeholder-' + i"
            :class="['tab-item', { active: visibleStart + i === currentIndex }]"
            @click="selectIndex(visibleStart + i)"
          >
            <span class="tab-title">{{ task?.titel || 'Content' }}</span>
            <span class="underline" v-if="visibleStart + i === currentIndex"></span>
          </li>
        </ul>

      </section>

      <!-- Image / Main Display Area -->
      <section class="stage">
        <!-- Left arrow -->
        <button class="stage-arrow left" @click="prev">
          ‹
        </button>

        <!-- Image placeholder with nice transition -->
        <div class="stage-inner">
          <transition name="slide-fade" mode="out-in">
            <div :key="currentIndex" class="image-placeholder">
              <!-- Crossed lines -- using pseudo + svg-style look -->
              <svg viewBox="0 0 100 60" preserveAspectRatio="none" class="image-svg" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="100" height="60" fill="transparent" stroke="transparent" />
                <line x1="0" y1="0" x2="100" y2="60" stroke="#bfbfbf" stroke-width="0.8"/>
                <line x1="100" y1="0" x2="0" y2="60" stroke="#bfbfbf" stroke-width="0.8"/>
              </svg>
            </div>
          </transition>
        </div>

        <!-- Right arrow -->
        <button class="stage-arrow right" @click="next">
          ›
        </button>
      </section>

      <!-- Info bar under the image (black bar with details + button) -->
      <section class="info-bar">
        <div class="info-text">
          <h3>{{ activeTask?.titel || 'Infos zum/zur entsprechenden/r Raum/Aufgabe' }}</h3>
          <p class="info-desc">
            {{ activeTask?.beschreibung || 'Weitere Informationen zur Aufgabe erscheinen hier.' }}
          </p>
          <div class="info-meta">
            <span v-if="activeTask?.datum" class="meta-date">{{ formatDate(activeTask.datum) }} </span> <span></span>
            <span v-if="activeTask?.uhrzeit" class="meta-time"> {{ formatTime(activeTask.uhrzeit) }} Uhr</span>
          </div>
        </div>

        <div class="info-action">
          <button class="login-btn" disabled>Anmelden</button>
        </div>
      </section>

      <!-- Dots + bottom navigation -->
      <section class="bottom-nav">

        <ul class="dots">
          <li
            v-for="(t, idx) in tasks"
            :key="idx"
            class="dot"
            :class="{ active: idx === currentIndex }"
            @click="selectIndex(idx)"
            :aria-label="'Slide ' + (idx+1)"
          ></li>
        </ul>

      </section>
    </main>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'MainPage',
  data() {
    return {
      tasks: [],
      currentIndex: 0,
      // visibleStart manages which block of up to visibleCount tabs is shown
      visibleStart: 0,
      visibleCount: 5, // maximum number of tabs visible at once
    };
  },
  computed: {
    activeTask() {
      return this.tasks[this.currentIndex] || null;
    },
    // tasks to show in the top tab row
    visibleTasks() {
      // If tasks fewer than visibleCount, show them all
      if (!this.tasks || this.tasks.length <= this.visibleCount) {
        // pad with placeholders to keep consistent size if you prefer (optionally)
        return this.tasks;
      }
      return this.tasks.slice(this.visibleStart, this.visibleStart + this.visibleCount);
    },
  },
  async mounted() {
    await this.loadTasks();
    // Ensure visibleStart & currentIndex consistent
    this.normalizeVisibleStart();
  },
  methods: {
    async loadTasks() {
      try {
        const response = await axios.get('http://localhost:3000/aufgaben', { withCredentials: true });
        // Expect response.data to be an array of tasks with fields aufgabeid, titel, beschreibung, datum, uhrzeit
        this.tasks = Array.isArray(response.data) ? response.data : [];
        // clamp index if necessary
        if (this.currentIndex >= this.tasks.length) this.currentIndex = 0;
        this.normalizeVisibleStart();
      } catch (error) {
        console.error('Fehler beim Laden der Aufgaben:', error);
        // keep tasks empty gracefully
        this.tasks = [];
      }
    },

    // NAVIGATION BEHAVIOR
    selectIndex(index) {
      if (!this.tasks.length) return;
      // clamp index
      const idx = Math.max(0, Math.min(index, this.tasks.length - 1));
      this.currentIndex = idx;
      // ensure visibleStart makes the selected tab visible
      this.ensureVisible(idx);
    },
    next() {
      if (!this.tasks.length) return;
      this.currentIndex = (this.currentIndex + 1) % this.tasks.length;
      this.ensureVisible(this.currentIndex);
    },
    prev() {
      if (!this.tasks.length) return;
      this.currentIndex = (this.currentIndex - 1 + this.tasks.length) % this.tasks.length;
      this.ensureVisible(this.currentIndex);
    },

    // Tab-scrolling helpers
    scrollTabsNext() {
      const maxStart = Math.max(0, this.tasks.length - this.visibleCount);
      this.visibleStart = Math.min(maxStart, this.visibleStart + this.visibleCount);
      // keep currentIndex inside view if desired - don't auto-select
      if (this.currentIndex < this.visibleStart) this.currentIndex = this.visibleStart;
      if (this.currentIndex >= this.visibleStart + this.visibleCount) this.currentIndex = this.visibleStart;
    },
    scrollTabsPrev() {
      this.visibleStart = Math.max(0, this.visibleStart - this.visibleCount);
      if (this.currentIndex < this.visibleStart) this.currentIndex = this.visibleStart;
      if (this.currentIndex >= this.visibleStart + this.visibleCount) this.currentIndex = this.visibleStart;
    },

    ensureVisible(idx) {
      // if idx is left of visibleStart, move visibleStart so idx is at left
      if (idx < this.visibleStart) {
        this.visibleStart = idx;
      } else if (idx >= this.visibleStart + this.visibleCount) {
        // if idx is beyond right, slide so idx becomes rightmost visible (or centered)
        this.visibleStart = idx - (this.visibleCount - 1);
      }
      // clamp
      this.normalizeVisibleStart();
    },

    normalizeVisibleStart() {
      const max = Math.max(0, this.tasks.length - this.visibleCount);
      if (this.visibleStart > max) this.visibleStart = max;
      if (this.visibleStart < 0) this.visibleStart = 0;
    },

    // Formatting helpers (kept from your original)
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },
    formatTime(timeString) {
      if (!timeString) return '';
      return timeString.substring(0, 5);
    },
  }
};
</script>

<style scoped>
/* Basic resets and page container */
.main-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 20px 60px;
  font-family: Arial, sans-serif;
  color: #111;
  min-height: 100vh;
  box-sizing: border-box;
}


.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 10px;
  border-bottom: 1px solid #bbb;
  margin-bottom: 18px;

}
.header h1 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 48px;
  margin: 0;
  font-weight: 400;
}
.header-left, .header-right {
  width: 80px;
  display:flex;
  align-items:center;
  justify-content:center;
}
.hamburger {
  width: 44px;
  height: 30px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
}
.hamburger span {
  display:block;
  height:5px;
  background:#111;
  border-radius:6px;
}
.profile {
  width:40px;
  height:40px;
  border-radius:50%;
  border:6px solid #777;
  box-sizing:border-box;
}

/* content area */
.content {
  padding: 30px 10px 0;
  background: white;
  border-radius: 4px;
}

/* TOP TABS */
.top-tabs {
  display:flex;
  align-items:center;
  justify-content:center;
  gap: 12px;
  margin-bottom: 30px;
  position: relative;
}
.tab-arrow {
  background: none;
  border: none;
  font-size: 36px;
  line-height: 1;
  width:56px;
  height:56px;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor: pointer;
}
.tab-arrow[disabled] {
  opacity: 0.25;
  cursor: default;
}

.tabs-list {
  display:flex;
  gap: 40px;
  padding: 0;
  margin: 0;
  list-style: none;
  align-items:center;
  overflow: hidden; /* we'll control visible via slice */
  min-width: 520px;
  justify-content:center;
}

/* a single tab */
.tab-item {
  position: relative;
  cursor: pointer;
  padding: 8px 2px;
  text-align:center;
  min-width: 80px;
}
.tab-title {
  display:block;
  font-size: 14px;
  color: #222;
}
.tab-item.active .tab-title {
  font-weight: 700;
}
.underline {
  position:absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: #111;
  bottom: -1px;
  margin: 0 auto;
  width: 50%;
  border-radius: 2px;
}

/* STAGE (image placeholder and arrows) */
.stage {
  display:flex;
  align-items:center;
  justify-content:center;
  margin: 10px 0 0;
  position: relative;
  height: 420px; /* visual height similar to wireframe */
}
.stage-inner {
  width: 75%;
  max-width: 1000px;
  min-width: 280px;
  height: 100%;
  display:flex;
  align-items:center;
  justify-content:center;
  position: relative;
  overflow: visible;
}
.image-placeholder {
  width: 100%;
  height: 100%;
  border: 1px solid #bfbfbf;
  box-sizing: border-box;
  background: white;
  display:flex;
  align-items:center;
  justify-content:center;
  position: relative;
}

/* The svg fills container and draws diagonal lines */
.image-svg {
  width: 100%;
  height: 100%;
  display:block;
}

/* Stage arrows (big) */
.stage-arrow {
  position: absolute;
  background: none;
  border: none;
  font-size: 36px;
  line-height: 1;
  width:64px;
  height:64px;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
}
.stage-arrow.left { left: 40px; }
.stage-arrow.right { right: 40px; }

/* Info bar below the image (black) */
.info-bar {
  display:flex;
  align-items:center;
  justify-content:space-between;
  background: #000;
  color: #fff;
  margin: 0 auto;
  width: 75%;
  max-width: 1000px;
  padding: 18px 22px;
  box-sizing:border-box;
  margin-top: -2px;
}
.info-text {
  max-width: 75%;
}
.info-text h3 {
  margin: 0 0 6px;
  font-size: 18px;
}
.info-text .info-desc {
  margin: 0 0 6px;
  color: #ddd;
}
.info-meta {
  color:#ccc;
  font-size: 13px;
  margin-top: 8px;
}
.info-action {
  display:flex;
  align-items:center;
  justify-content:center;
}
.login-btn {
  background: white;
  color: black;
  border: none;
  padding: 12px 26px;
  border-radius: 2px;
  font-size: 14px;
  cursor: default;
}

/* bottom dots + arrows */
.bottom-nav {
  display:flex;
  align-items:center;
  justify-content:center;
  gap: 18px;
  margin-top: 28px;
}
.dot-arrow {
  background: none;
  border: none;
  font-size: 26px;
  width:44px;
  height:44px;
  cursor:pointer;
}
.dots {
  display:flex;
  gap: 12px;
  padding:0;
  list-style:none;
  margin:0 8px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8f8f8f;
  cursor:pointer;
  transition: transform 0.18s ease, background-color 0.18s ease;
}
.dot.active {
  background: #111;
  transform: scale(1.3);
}

/* Transition for image change */
.slide-fade-enter-active {
  transition: opacity 360ms ease, transform 360ms cubic-bezier(.2,.9,.2,1);
}
.slide-fade-leave-active {
  transition: opacity 240ms ease, transform 240ms cubic-bezier(.2,.9,.2,1);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(24px) scale(0.995);
}
.slide-fade-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
}
.slide-fade-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-18px) scale(0.995);
}

/* Misc */
@media (max-width: 900px) {
  .header h1 { font-size: 36px; }
  .stage { height: 340px; }
  .top-tabs { gap: 6px; }
  .tabs-list { min-width: 360px; gap: 18px; }
  .info-bar { width: 90%; padding: 14px; flex-direction: column; gap: 12px; align-items:flex-start; }
  .info-action { width: 100%; display:flex; justify-content:flex-end; }
}
@media (max-width: 520px) {
  .header h1 { font-size: 26px; }
  .stage { height: 260px; }
  .tabs-list { min-width: 240px; gap: 12px; }
  .image-placeholder { border-width: 1px; }
  .stage-arrow.left { left: 8px; }
  .stage-arrow.right { right: 8px; }
}
</style>
