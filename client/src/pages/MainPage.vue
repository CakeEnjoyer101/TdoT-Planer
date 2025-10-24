<template>
  <div class="main-page">
    <header class="header">
      <div class="header-left"></div>
      <h1>Tag der offenen Tür</h1>
      <div class="header-right"></div>
    </header>

    <main class="content">
      <section class="top-tabs">
        <ul class="tabs-list" ref="tabsList">
          <li
            v-for="(task, i) in visibleTasks"
            :key="task.aufgabeid || 'placeholder-' + i"
            :class="['tab-item', { active: visibleStart + i === currentIndex }]"
            @click="selectIndex(visibleStart + i)"
          >
            <span class="tab-title">{{ task?.titel || "Content" }}</span>
            <span
              class="underline"
              v-if="visibleStart + i === currentIndex"
            ></span>
          </li>
        </ul>
      </section>

      <section class="stage">
        <button class="stage-arrow left" @click="prev">‹</button>

        <div class="stage-inner">
          <transition name="slide-fade" mode="out-in">
            <div :key="currentIndex" class="image-placeholder">
              <div class="placeholder-content">
                <div class="placeholder-icon">📷</div>
                <p class="placeholder-text">Bildvorschau</p>
              </div>
            </div>
          </transition>
        </div>

        <button class="stage-arrow right" @click="next">›</button>
      </section>

      <section class="info-bar">
        <div class="info-text">
          <h3>
            {{
              activeTask?.titel || "Infos zum/zur entsprechenden/r Raum/Aufgabe"
            }}
          </h3>
          <p class="info-desc">
            {{
              activeTask?.beschreibung ||
              "Weitere Informationen zur Aufgabe erscheinen hier."
            }}
          </p>
          <div class="info-meta">
            <span v-if="activeTask?.datum" class="meta-date">
              <span class="meta-icon">📅</span>
              {{ formatDate(activeTask.datum) }}
            </span>
            <span v-if="activeTask?.uhrzeit" class="meta-time">
              <span class="meta-icon">⏰</span>
              {{ formatTime(activeTask.uhrzeit) }} Uhr
            </span>
          </div>
        </div>

        <div class="info-action">
          <button class="login-btn">Anmelden</button>
          <button class="tasks-btn" @click="loginDev">Zu den Aufgaben</button>
        </div>
      </section>

      <section class="bottom-nav">
        <ul class="dots">
          <li
            v-for="(t, idx) in tasks"
            :key="idx"
            class="dot"
            :class="{ active: idx === currentIndex }"
            @click="selectIndex(idx)"
            :aria-label="'Slide ' + (idx + 1)"
          ></li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "MainPage",
  data() {
    return {
      tasks: [],
      currentIndex: 0,
      visibleStart: 0,
      visibleCount: 5,
    };
  },
  computed: {
    activeTask() {
      return this.tasks[this.currentIndex] || null;
    },
    visibleTasks() {
      if (!this.tasks || this.tasks.length <= this.visibleCount) {
        return this.tasks;
      }
      return this.tasks.slice(
        this.visibleStart,
        this.visibleStart + this.visibleCount
      );
    },
  },
  async mounted() {
    await this.loadTasks();
    this.normalizeVisibleStart();
  },
  methods: {
    async loadTasks() {
      try {
        const response = await axios.get("http://localhost:3000/aufgaben", {
          withCredentials: true,
        });
        this.tasks = Array.isArray(response.data) ? response.data : [];
        if (this.currentIndex >= this.tasks.length) this.currentIndex = 0;
        this.normalizeVisibleStart();
      } catch (error) {
        console.error("Fehler beim Laden der Aufgaben:", error);
        this.tasks = [];
      }
    },

    selectIndex(index) {
      if (!this.tasks.length) return;
      const idx = Math.max(0, Math.min(index, this.tasks.length - 1));
      this.currentIndex = idx;
      this.ensureVisible(idx);
    },
    next() {
      if (!this.tasks.length) return;
      this.currentIndex = (this.currentIndex + 1) % this.tasks.length;
      this.ensureVisible(this.currentIndex);
    },
    prev() {
      if (!this.tasks.length) return;
      this.currentIndex =
        (this.currentIndex - 1 + this.tasks.length) % this.tasks.length;
      this.ensureVisible(this.currentIndex);
    },

    scrollTabsNext() {
      const maxStart = Math.max(0, this.tasks.length - this.visibleCount);
      this.visibleStart = Math.min(
        maxStart,
        this.visibleStart + this.visibleCount
      );
      if (this.currentIndex < this.visibleStart)
        this.currentIndex = this.visibleStart;
      if (this.currentIndex >= this.visibleStart + this.visibleCount)
        this.currentIndex = this.visibleStart;
    },
    scrollTabsPrev() {
      this.visibleStart = Math.max(0, this.visibleStart - this.visibleCount);
      if (this.currentIndex < this.visibleStart)
        this.currentIndex = this.visibleStart;
      if (this.currentIndex >= this.visibleStart + this.visibleCount)
        this.currentIndex = this.visibleStart;
    },

    ensureVisible(idx) {
      if (idx < this.visibleStart) {
        this.visibleStart = idx;
      } else if (idx >= this.visibleStart + this.visibleCount) {
        this.visibleStart = idx - (this.visibleCount - 1);
      }
      this.normalizeVisibleStart();
    },

    normalizeVisibleStart() {
      const max = Math.max(0, this.tasks.length - this.visibleCount);
      if (this.visibleStart > max) this.visibleStart = max;
      if (this.visibleStart < 0) this.visibleStart = 0;
    },

    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },
    formatTime(timeString) {
      if (!timeString) return "";
      return timeString.substring(0, 5);
    },
    loginDev() {
      window.location.href = "http://localhost:3000/auth/devlogin";
    },
  },
};
</script>

<style scoped>
.main-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 20px 60px;
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #333;
  min-height: 100vh;
  box-sizing: border-box;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 10px;
  border-bottom: 3px solid #d32f2f;
  margin-bottom: 18px;
  background: white;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.1);
}
.header h1 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 48px;
  margin: 0;
  font-weight: 600;
  background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-left,
.header-right {
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  padding: 30px 10px 0;
  background: white;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.top-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 30px;
  position: relative;
}

.tabs-list {
  display: flex;
  gap: 40px;
  padding: 0;
  margin: 0;
  list-style: none;
  align-items: center;
  overflow: hidden;
  min-width: 520px;
  justify-content: center;
}

.tab-item {
  position: relative;
  cursor: pointer;
  padding: 12px 8px;
  text-align: center;
  min-width: 80px;
  transition: all 0.3s ease;
  border-radius: 8px 8px 0 0;
}
.tab-item:hover {
  background: #ffebee;
}
.tab-item.active {
  background: #ffebee;
}
.tab-title {
  display: block;
  font-size: 14px;
  color: #666;
  font-weight: 500;
  transition: all 0.3s ease;
}
.tab-item.active .tab-title {
  color: #d32f2f;
  font-weight: 700;
}
.underline {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #d32f2f 0%, #f44336 100%);
  bottom: -1px;
  margin: 0 auto;
  width: 60%;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(211, 47, 47, 0.3);
}

.stage {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0 0;
  position: relative;
  height: 420px;
}
.stage-inner {
  width: 75%;
  max-width: 1000px;
  min-width: 280px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: visible;
}
.image-placeholder {
  width: 100%;
  height: 100%;
  border: 2px dashed #d32f2f;
  box-sizing: border-box;
  background: linear-gradient(135deg, #ffffff 0%, #ffebee 50%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(211, 47, 47, 0.1);
}

.placeholder-content {
  text-align: center;
  color: #d32f2f;
}
.placeholder-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.placeholder-text {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  opacity: 0.8;
}

.stage-arrow {
  position: absolute;
  background: #d32f2f;
  border: none;
  font-size: 36px;
  line-height: 1;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
  border-radius: 50%;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
}
.stage-arrow:hover {
  background: #b71c1c;
  transform: translateY(-50%) scale(1.1);
}
.stage-arrow.left {
  left: 40px;
}
.stage-arrow.right {
  right: 40px;
}

.info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
  color: #fff;
  margin: 0 auto;
  width: 75%;
  max-width: 1000px;
  padding: 24px 28px;
  box-sizing: border-box;
  margin-top: 8px;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 20px rgba(211, 47, 47, 0.2);
}
.info-text {
  max-width: 70%;
}
.info-text h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}
.info-text .info-desc {
  margin: 0 0 8px;
  color: #ffebee;
  line-height: 1.5;
}
.info-meta {
  color: #ffcdd2;
  font-size: 14px;
  margin-top: 12px;
  display: flex;
  gap: 20px;
}
.meta-icon {
  margin-right: 6px;
  opacity: 0.9;
}

.info-action {
  display: flex;
  align-items: center;
  gap: 12px;
}
.login-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  padding: 12px 26px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}
.login-btn:hover {
  background: white;
  color: #d32f2f;
}
.tasks-btn {
  background: white;
  color: #d32f2f;
  border: 2px solid white;
  padding: 12px 26px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}
.tasks-btn:hover {
  background: transparent;
  color: white;
  transform: translateY(-2px);
}

.bottom-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-top: 28px;
}
.dots {
  display: flex;
  gap: 12px;
  padding: 0;
  list-style: none;
  margin: 0 8px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffcdd2;
  cursor: pointer;
  transition: all 0.3s ease;
}
.dot.active {
  background: #d32f2f;
  transform: scale(1.4);
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.4);
}
.dot:hover {
  background: #f44336;
  transform: scale(1.2);
}

.slide-fade-enter-active {
  transition: opacity 360ms ease, transform 360ms cubic-bezier(0.2, 0.9, 0.2, 1);
}
.slide-fade-leave-active {
  transition: opacity 240ms ease, transform 240ms cubic-bezier(0.2, 0.9, 0.2, 1);
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

@media (max-width: 900px) {
  .header h1 {
    font-size: 36px;
  }
  .stage {
    height: 340px;
  }
  .top-tabs {
    gap: 6px;
  }
  .tabs-list {
    min-width: 360px;
    gap: 18px;
  }
  .info-bar {
    width: 90%;
    padding: 20px;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  .info-text {
    max-width: 100%;
  }
  .info-action {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width: 520px) {
  .header h1 {
    font-size: 26px;
  }
  .stage {
    height: 260px;
  }
  .tabs-list {
    min-width: 240px;
    gap: 12px;
  }
  .stage-arrow {
    width: 48px;
    height: 48px;
    font-size: 28px;
  }
  .stage-arrow.left {
    left: 8px;
  }
  .stage-arrow.right {
    right: 8px;
  }
  .info-bar {
    padding: 16px;
  }
  .info-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>