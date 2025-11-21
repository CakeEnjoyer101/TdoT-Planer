<template>
  <div class="main-page">
    <div v-if="showKlassePopup" class="klasse-popup-overlay">
      <div class="klasse-popup">
        <div class="popup-header">
          <q-icon name="school" size="lg" color="red-7" />
          <h3>Klasseninformation erforderlich</h3>
        </div>

        <div class="popup-content">
          <p>Bitte gib deine Klasse ein, um fortzufahren:</p>

          <q-input
            v-model="klasseInput"
            label="Klasse"
            color="red-7"
            outlined
            class="klasse-input"
            :rules="[(val) => !!val || 'Klasse ist erforderlich']"
            @keyup.enter="saveKlasse"
          />

          <div class="popup-buttons">
            <q-btn
              label="Speichern"
              @click="saveKlasse"
              color="red-7"
              :disabled="!klasseInput"
              class="save-btn"
            />
          </div>
        </div>
      </div>
    </div>

    <header class="header">
      <div class="header-left">
        <button class="logout-btn" @click="logout">
          <q-icon name="logout" class="q-mr-xs" />
          Abmelden
        </button>

        <button
          v-if="currentUser && currentUser.klasse === 'Admin'"
          class="admin-btn"
          @click="goToAdminDashboard"
        >
          <q-icon name="admin_panel_settings" class="q-mr-xs" />
          Admin
        </button>
      </div>

      <h1>Tag der offenen Tür</h1>

      <div class="header-right">
        <div class="user-info" v-if="currentUser">
          <div class="user-details">
            <div
              class="user-klasse"
              v-if="currentUser.klasse"
              :class="getBadgeClass()"
            >
              {{ getBadgeText() }}
            </div>
            <div class="user-name-section">
              <q-icon :name="getUserIcon()" class="user-icon" />
              <span class="user-name">{{ currentUser.name }}</span>
            </div>
          </div>
        </div>
        <div class="user-info" v-else>
          <q-spinner size="20px" />
        </div>
      </div>
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
            <span v-if="activeTask?.lehrer_name" class="meta-lehrer">
              <span class="meta-icon">👨‍🏫</span>
              {{ activeTask.lehrer_name }}
            </span>
          </div>
        </div>

        <div class="info-action">
          <button
            v-if="
              currentUser &&
              currentUser.klasse &&
              currentUser.klasse !== 'Admin' &&
              currentUser.klasse !== 'Lehrer'
            "
            class="anmelde-btn"
            @click="schuelerAnmelden"
            :disabled="!activeTask"
          >
            <q-icon name="how_to_reg" class="q-mr-xs" />
            Anmelden
          </button>

          <button
            v-if="currentUser && currentUser.klasse === 'Lehrer'"
            class="lehrer-anmelde-btn"
            @click="lehrerAnmelden"
            :disabled="!activeTask"
          >
            <q-icon name="assignment_ind" class="q-mr-xs" />
            Als Lehrkraft anmelden
          </button>

          <button class="tasks-btn" @click="goToUserTasks">
            <q-icon name="list_alt" class="q-mr-xs" />
            Zu den Aufgaben
          </button>
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
      currentUser: null,
      showKlassePopup: false,
      klasseInput: "",
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
    await this.loadUserProfile();
    await this.loadTasks();
    this.normalizeVisibleStart();
  },
  methods: {
    async loadUserProfile() {
      try {
        const response = await axios.get("http://localhost:3000/auth/profile", {
          withCredentials: true,
        });
        this.currentUser = response.data.user;

        // Prüfe ob Klasse bereits gesetzt ist (nur für Schüler, nicht für Lehrer/Admin)
        if (
          !this.currentUser.klasse &&
          !this.isLehrerAccount() &&
          !this.isAdminAccount()
        ) {
          this.showKlassePopup = true;
        }
      } catch (error) {
        console.error("Fehler beim Laden des User-Profils:", error);
        window.location.href = "http://localhost:9000/";
      }
    },

    isAdminAccount() {
      return this.currentUser && this.currentUser.klasse === "Admin";
    },

    isLehrerAccount() {
      return this.currentUser && this.currentUser.klasse === "Lehrer";
    },

    getBadgeClass() {
      if (this.isAdminAccount()) return "admin-badge";
      if (this.isLehrerAccount()) return "lehrer-badge";
      return "";
    },

    getBadgeText() {
      if (this.isAdminAccount()) return "Admin Account";
      if (this.isLehrerAccount()) return "Lehrer Account";
      return this.currentUser.klasse;
    },

    getUserIcon() {
      if (this.isAdminAccount()) return "admin_panel_settings";
      if (this.isLehrerAccount()) return "school";
      return "person";
    },

    async saveKlasse() {
      if (!this.klasseInput.trim()) return;

      try {
        const response = await axios.post(
          "http://localhost:3000/auth/update-klasse",
          { klasse: this.klasseInput },
          { withCredentials: true }
        );

        this.currentUser = response.data.user;
        this.showKlassePopup = false;
      } catch (error) {
        console.error("Fehler beim Speichern der Klasse:", error);
        alert("Fehler beim Speichern der Klasse. Bitte versuche es erneut.");
      }
    },

    async logout() {
      try {
        await axios.post(
          "http://localhost:3000/auth/logout",
          {},
          {
            withCredentials: true,
          }
        );
        window.location.href = "http://localhost:9000/";
      } catch (error) {
        console.error("Fehler beim Logout:", error);
        window.location.href = "http://localhost:9000/";
      }
    },

    async schuelerAnmelden() {
      if (!this.activeTask) return;

      try {
        await axios.post(
          `http://localhost:3000/aufgaben/${this.activeTask.aufgabeid}/anmelden`,
          {},
          { withCredentials: true }
        );
        alert("Erfolgreich für die Aufgabe angemeldet!");
      } catch (error) {
        alert(error.response?.data?.error || "Fehler bei der Anmeldung");
      }
    },

    async lehrerAnmelden() {
      if (!this.activeTask) return;

      try {
        await axios.post(
          `http://localhost:3000/aufgaben/${this.activeTask.aufgabeid}/lehrer-anmelden`,
          {},
          { withCredentials: true }
        );
        alert("Aufgabe erfolgreich übernommen!");
        // Aufgabe neu laden um Lehrer-Namen anzuzeigen
        await this.loadTasks();
      } catch (error) {
        alert(error.response?.data?.error || "Fehler bei der Übernahme");
      }
    },

    goToAdminDashboard() {
      window.location.href = "http://localhost:9000/admin";
    },

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

    goToUserTasks() {
      window.location.href = "http://localhost:9000/user";
    },
  },
};
</script>

<style scoped>
.main-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 20px 60px;
  font-family: "Segoe UI", Arial, sans-serif;
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
  width: 200px;
  display: flex;
  align-items: center;
}

.logout-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.logout-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
}

.admin-btn {
  background: #7b1fa2;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.admin-btn:hover {
  background: #6a1b9a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(123, 31, 162, 0.3);
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.user-klasse {
  background: #d32f2f;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.admin-badge {
  background: #7b1fa2 !important;
  font-weight: 700;
}

.lehrer-badge {
  background: #388e3c !important;
  font-weight: 700;
}

.user-name-section {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  padding: 8px 16px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.user-icon {
  color: #d32f2f;
  margin-right: 8px;
  font-size: 18px;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.klasse-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.klasse-popup {
  background: white;
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 3px solid #d32f2f;
  overflow: hidden;
}

.popup-header {
  background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
  color: white;
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.popup-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.popup-content {
  padding: 32px 24px;
  text-align: center;
}

.popup-content p {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 1.1rem;
  line-height: 1.5;
}

.klasse-input {
  margin-bottom: 24px;
}

.popup-buttons {
  display: flex;
  justify-content: center;
}

.save-btn {
  min-width: 120px;
  font-size: 1rem;
  font-weight: 600;
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
  padding-bottom: 20px;
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

  .header-left,
  .header-right {
    width: 150px;
  }

  .logout-btn,
  .admin-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .user-details {
    align-items: center;
  }

  .user-klasse {
    font-size: 0.7rem;
    padding: 3px 10px;
  }

  .user-name-section {
    padding: 6px 12px;
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
  .header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .header h1 {
    font-size: 26px;
  }

  .header-left,
  .header-right {
    width: 100%;
    justify-content: center;
  }

  .klasse-popup {
    width: 95%;
    margin: 20px;
  }

  .popup-header {
    padding: 20px;
  }

  .popup-content {
    padding: 24px 20px;
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

.anmelde-btn {
  background: #4caf50;
  color: white;
  border: 2px solid white;
  padding: 12px 26px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.anmelde-btn:hover:not(:disabled) {
  background: #388e3c;
  transform: translateY(-2px);
}

.anmelde-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.lehrer-anmelde-btn {
  background: #ff9800;
  color: white;
  border: 2px solid white;
  padding: 12px 26px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lehrer-anmelde-btn:hover:not(:disabled) {
  background: #f57c00;
  transform: translateY(-2px);
}

.lehrer-anmelde-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.meta-lehrer {
  color: #ffcdd2;
  font-size: 14px;
}
</style>
