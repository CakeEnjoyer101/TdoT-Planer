<template>
  <div class="main-page">
    <!-- Klasse Popup - wird angezeigt wenn keine Klasse gesetzt ist -->
    <div v-if="showKlassePopup && currentUser" class="klasse-popup-overlay">
      <div class="klasse-popup">
        <div class="popup-header">
          <q-icon name="school" size="lg" color="red-7" />
          <h3>Klasseninformation erforderlich</h3>
        </div>

        <div class="popup-content">
          <p>Bitte gib deine Klasse ein, um fortzufahren:</p>
          <p class="popup-subtext">Beispiele: 2AHIT, 3BHITM, 4AFITN, 5AHITN</p>

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

    <!-- Loading State -->
    <div v-if="!currentUser" class="loading-container">
      <q-spinner size="50px" color="red-7" />
      <p>Lade Benutzerdaten...</p>
    </div>

    <!-- Hauptinhalt -->
    <div v-else>
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
                v-if="
                  currentUser.klasse && currentUser.klasse !== 'Keine Klasse'
                "
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
        </div>
      </header>

      <main class="content">
        <!-- Erste Klassen: Freier Tag -->
        <div v-if="isFirstClass" class="free-day-container">
          <div class="free-day-content">
            <q-icon name="celebration" size="120px" color="green-6" />
            <h2 class="free-day-title">Freier Tag!</h2>
            <p class="free-day-message">
              Als Schüler/in der 1. Klasse hast du heute frei und kannst den Tag
              der offenen Tür genießen.
            </p>
            <div class="free-day-actions">
              <button class="tasks-btn" @click="goToUserTasks">
                <q-icon name="list_alt" class="q-mr-xs" />
                Zu deinen Aufgaben
              </button>
            </div>
          </div>
        </div>

        <!-- Fünfte Klassen: Diplomarbeit Pflicht -->
        <div v-else-if="isFifthClass" class="diplom-container">
          <div class="diplom-content">
            <q-icon name="school" size="120px" color="blue-6" />
            <h2 class="diplom-title">Diplomarbeit Präsentation</h2>
            <p class="diplom-message">
              Als Schüler/in der 5. Klasse präsentierst du heute deine
              Diplomarbeit. Diese Präsentation ist verpflichtend und findet den
              ganzen Tag statt.
            </p>
            <div class="diplom-info">
              <h3>Deine Aufgabe:</h3>
              <div v-if="diplomTask" class="diplom-task-simple">
                <div class="placeholder-icon">
                  {{ diplomTask.icon || "🎓" }}
                </div>
                <div class="diplom-task-content">
                  <h4>{{ diplomTask.titel }}</h4>
                  <p>
                    {{ diplomTask.beschreibung }}
                  </p>
                  <div class="diplom-task-meta">
                    <span>
                      <q-icon name="schedule" class="q-mr-xs" />
                      {{ formatTime(diplomTask.uhrzeit) }} Uhr
                    </span>
                    <span>
                      <q-icon name="location_on" class="q-mr-xs" />
                      Zugeteilter Stand
                    </span>
                  </div>
                </div>
              </div>
              <div v-else>
                <p>Lade Diplomarbeit...</p>
              </div>
            </div>
            <div class="diplom-note">
              <q-icon name="info" color="#1976d2" />
              <p>
                Die Präsentation deiner Diplomarbeit ist verpflichtend. Bitte
                halte dich an deinen zugewiesenen Stand.
              </p>
            </div>
          </div>
        </div>

        <!-- Andere Klassen: Normale Ansicht -->
        <template v-else>
          <section class="top-tabs">
            <ul class="tabs-list" ref="tabsList">
              <li
                v-for="(task, i) in visibleTasks"
                :key="task.aufgabeid || 'placeholder-' + i"
                :class="[
                  'tab-item',
                  { active: visibleStart + i === currentIndex },
                ]"
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
                    <div class="placeholder-icon">
                      {{ activeTask?.icon || "📷" }}
                    </div>
                    <p class="placeholder-text">
                      {{ activeTask?.titel || "Bildvorschau" }}
                    </p>
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
                  activeTask?.titel ||
                  "Infos zum/zur entsprechenden/r Raum/Aufgabe"
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
                  currentUser.klasse !== 'Lehrer' &&
                  !currentUser.klasse.toLowerCase().includes('fitn')
                "
                class="anmelde-btn"
                @click="schuelerAnmelden"
                :disabled="!activeTask || isAlreadyRegisteredForTask"
              >
                <q-icon name="how_to_reg" class="q-mr-xs" />
                {{
                  isAlreadyRegisteredForTask ? "Bereits angemeldet" : "Anmelden"
                }}
              </button>

              <button
                v-if="currentUser && currentUser.klasse === 'Lehrer'"
                class="lehrer-anmelde-btn"
                @click="lehrerAnmelden"
                :disabled="!activeTask || activeTask.lehrerid"
              >
                <q-icon name="assignment_ind" class="q-mr-xs" />
                {{
                  activeTask?.lehrerid
                    ? "Aufgabe vergeben"
                    : "Als Lehrkraft anmelden"
                }}
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
                v-for="(t, idx) in filteredTasks"
                :key="idx"
                class="dot"
                :class="{ active: idx === currentIndex }"
                @click="selectIndex(idx)"
                :aria-label="'Slide ' + (idx + 1)"
              ></li>
            </ul>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "MainPage",

  data() {
    return {
      tasks: [],
      userRegisteredTasks: [],
      currentIndex: 0,
      visibleStart: 0,
      visibleCount: 5,
      currentUser: null,
      showKlassePopup: false,
      klasseInput: "",
      tasksLoaded: false,
      diplomTask: null,
      isLoading: true,
    };
  },

  computed: {
    activeTask() {
      return this.filteredTasks[this.currentIndex] || null;
    },

    visibleTasks() {
      if (
        !this.filteredTasks ||
        this.filteredTasks.length <= this.visibleCount
      ) {
        return this.filteredTasks;
      }
      return this.filteredTasks.slice(
        this.visibleStart,
        this.visibleStart + this.visibleCount
      );
    },

    isFirstClass() {
      if (!this.currentUser?.klasse) return false;
      return this.currentUser.klasse.toLowerCase().startsWith("1");
    },

    isFifthClass() {
      if (!this.currentUser?.klasse) return false;
      return this.currentUser.klasse.toLowerCase().startsWith("5");
    },

    isAlreadyRegisteredForTask() {
      if (!this.activeTask || !this.currentUser?.userid) return false;
      return this.userRegisteredTasks.some(
        (t) => t.aufgabeid === this.activeTask.aufgabeid
      );
    },

    /* =====================================================
       ✅ ZENTRALE FILTER-LOGIK (ADMIN + LEHRER = ALLE TASKS)
       ===================================================== */
    filteredTasks() {
      if (!this.currentUser?.klasse) return [];

      // 👑 ADMIN & 👨‍🏫 LEHRER → sehen ALLE Aufgaben
      if (
        this.currentUser.klasse === "Admin" ||
        this.currentUser.klasse === "Lehrer"
      ) {
        return this.tasks;
      }

      // ❌ Sonderfälle Schüler
      if (
        this.currentUser.klasse === "Keine Klasse" ||
        this.isFirstClass ||
        this.isFifthClass
      ) {
        return [];
      }

      const userKlasse = this.currentUser.klasse.toLowerCase();

      // 🎓 Schüler sehen nur passende Aufgaben
      return this.tasks.filter((task) => {
        if (!task.ziel_klassen) return false;

        const zielKlassen = Array.isArray(task.ziel_klassen)
          ? task.ziel_klassen
          : [task.ziel_klassen];

        return zielKlassen.some((ziel) =>
          userKlasse.includes(ziel.toLowerCase())
        );
      });
    },
  },

  async mounted() {
    this.isLoading = true;
    try {
      await this.loadUserProfile();
      await this.loadTasks();

      if (
        this.currentUser &&
        this.currentUser.klasse &&
        this.currentUser.klasse !== "Keine Klasse" &&
        this.currentUser.klasse !== "Admin" &&
        this.currentUser.klasse !== "Lehrer"
      ) {
        await this.loadUserRegisteredTasks();
      }

      if (this.isFifthClass) {
        await this.loadDiplomTask();
      }

      this.normalizeVisibleStart();
    } catch (error) {
      console.error("Init-Fehler:", error);
    } finally {
      this.isLoading = false;
    }
  },

  methods: {
    /* ================= USER ================= */
    async loadUserProfile() {
      try {
        const res = await axios.get("http://localhost:3000/auth/profile", {
          withCredentials: true,
        });
        this.currentUser = res.data.user;

        if (
          (!this.currentUser.klasse ||
            this.currentUser.klasse === "") &&
          !this.isLehrerAccount() &&
          !this.isAdminAccount()
        ) {
          this.showKlassePopup = true;
        }
      } catch (err) {
        if (err.response?.status === 401) {
          window.location.href = "http://localhost:9000/";
        }
      }
    },

    isAdminAccount() {
      return this.currentUser?.klasse === "Admin";
    },

    isLehrerAccount() {
      return this.currentUser?.klasse === "Lehrer";
    },

    /* ================= BADGES ================= */
    getBadgeClass() {
      if (this.isAdminAccount()) return "admin-badge";
      if (this.isLehrerAccount()) return "lehrer-badge";
      return "";
    },

    getBadgeText() {
      if (this.isAdminAccount()) return "Admin Account";
      if (this.isLehrerAccount()) return "Lehrer Account";
      return this.currentUser?.klasse || "";
    },

    getUserIcon() {
      if (this.isAdminAccount()) return "admin_panel_settings";
      if (this.isLehrerAccount()) return "school";
      return "person";
    },

    /* ================= TASKS ================= */
    async loadTasks() {
      try {
        const res = await axios.get("http://localhost:3000/aufgaben", {
          withCredentials: true,
        });
        this.tasks = Array.isArray(res.data) ? res.data : [];
        this.tasksLoaded = true;
      } catch {
        this.tasks = [];
      }

      if (this.currentIndex >= this.filteredTasks.length) {
        this.currentIndex = 0;
      }
      this.normalizeVisibleStart();
    },

    async loadUserRegisteredTasks() {
      try {
        const res = await axios.get("http://localhost:3000/user/aufgaben", {
          withCredentials: true,
        });
        this.userRegisteredTasks = res.data;
      } catch {
        this.userRegisteredTasks = [];
      }
    },

    async loadDiplomTask() {
      const userKlasse = this.currentUser.klasse.toLowerCase();

      this.diplomTask =
        this.tasks.find(
          (t) =>
            t.ziel_klassen?.some((z) =>
              userKlasse.includes(z.toLowerCase())
            ) &&
            (t.kategorie === "diplomarbeit" ||
              t.titel?.toLowerCase().includes("diplom"))
        ) || {
          titel: "Diplomarbeit Präsentation",
          beschreibung: "Präsentation deiner Diplomarbeit den ganzen Tag.",
          icon: "🎓",
          uhrzeit: "08:00",
        };
    },

    /* ================= ACTIONS ================= */
    async schuelerAnmelden() {
      if (!this.activeTask) return;

      await axios.post(
        `http://localhost:3000/aufgaben/${this.activeTask.aufgabeid}/anmelden`,
        {},
        { withCredentials: true }
      );

      await this.loadUserRegisteredTasks();
    },

    async lehrerAnmelden() {
      if (!this.activeTask) return;

      await axios.post(
        `http://localhost:3000/aufgaben/${this.activeTask.aufgabeid}/lehrer-anmelden`,
        {},
        { withCredentials: true }
      );

      await this.loadTasks();
    },

    /* ================= NAVIGATION ================= */
    goToAdminDashboard() {
      window.location.href = "http://localhost:9000/admin";
    },

    goToUserTasks() {
      window.location.href = "http://localhost:9000/user";
    },

    async logout() {
      await axios.post(
        "http://localhost:3000/auth/logout",
        {},
        { withCredentials: true }
      );
      window.location.href = "http://localhost:9000/";
    },

    /* ================= SLIDER ================= */
    selectIndex(idx) {
      if (!this.filteredTasks.length) return;
      this.currentIndex = Math.max(
        0,
        Math.min(idx, this.filteredTasks.length - 1)
      );
      this.ensureVisible(this.currentIndex);
    },

    next() {
      if (!this.filteredTasks.length) return;
      this.currentIndex =
        (this.currentIndex + 1) % this.filteredTasks.length;
      this.ensureVisible(this.currentIndex);
    },

    prev() {
      if (!this.filteredTasks.length) return;
      this.currentIndex =
        (this.currentIndex - 1 + this.filteredTasks.length) %
        this.filteredTasks.length;
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
      const max = Math.max(0, this.filteredTasks.length - this.visibleCount);
      if (this.visibleStart > max) this.visibleStart = max;
      if (this.visibleStart < 0) this.visibleStart = 0;
    },

    formatDate(d) {
      return new Date(d).toLocaleDateString("de-DE");
    },

    formatTime(t) {
      return typeof t === "string" ? t.substring(0, 5) : "";
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

.free-day-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
  border-radius: 12px;
  margin: 20px 0;
  border: 2px dashed #4caf50;
}

.free-day-content {
  text-align: center;
  padding: 40px;
}

.free-day-title {
  font-size: 2.5rem;
  color: #2e7d32;
  margin: 20px 0 10px;
  font-weight: 700;
}

.free-day-message {
  font-size: 1.2rem;
  color: #388e3c;
  margin-bottom: 30px;
  line-height: 1.6;
  max-width: 500px;
}

.free-day-actions {
  margin-top: 20px;
}

.diplom-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 12px;
  margin: 20px 0;
  border: 2px solid #1976d2;
  padding: 20px;
}

.diplom-content {
  text-align: center;
  padding: 40px;
  max-width: 800px;
  width: 100%;
}

.diplom-title {
  font-size: 2.5rem;
  color: #1565c0;
  margin: 20px 0 10px;
  font-weight: 700;
}

.diplom-message {
  font-size: 1.2rem;
  color: #1976d2;
  margin-bottom: 30px;
  line-height: 1.6;
}

.diplom-info {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin: 30px 0;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.diplom-info h3 {
  color: #1565c0;
  margin-bottom: 24px;
}

.diplom-task-simple {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
}

.diplom-task-content {
  text-align: left;
}

.diplom-task-content h4 {
  color: #333;
  margin: 0 0 8px 0;
  font-size: 1.3rem;
}

.diplom-task-content p {
  color: #666;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.diplom-task-meta {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
  color: #757575;
}

.diplom-task-meta span {
  display: flex;
  align-items: center;
}

.diplom-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.diplom-note p {
  margin: 0;
  color: #1976d2;
  font-size: 0.9rem;
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
  font-size: 64px;
  margin-bottom: 16px;
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

.meta-lehrer {
  color: #ffcdd2;
  font-size: 14px;
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
  transition:
    opacity 360ms ease,
    transform 360ms cubic-bezier(0.2, 0.9, 0.2, 1);
}

.slide-fade-leave-active {
  transition:
    opacity 240ms ease,
    transform 240ms cubic-bezier(0.2, 0.9, 0.2, 1);
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

  .diplom-container {
    margin: 10px 0;
    padding: 10px;
  }

  .diplom-content {
    padding: 20px;
  }

  .diplom-title {
    font-size: 2rem;
  }

  .diplom-message {
    font-size: 1rem;
  }

  .diplom-task-simple {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .diplom-task-content {
    text-align: center;
  }

  .diplom-task-meta {
    flex-direction: column;
    gap: 8px;
    align-items: center;
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

  .free-day-container {
    height: 300px;
    margin: 10px 0;
  }

  .free-day-content {
    padding: 20px;
  }

  .free-day-title {
    font-size: 2rem;
  }

  .free-day-message {
    font-size: 1rem;
  }
}

.anmelde-btn:disabled {
  background: #388e3c !important;
  cursor: default !important;
}

.lehrer-anmelde-btn:disabled {
  background: #f57c00 !important;
  cursor: default !important;
}

.diplom-task-simple .placeholder-icon {
  font-size: 60px;
  margin-right: 20px;
}

.diplom-task-simple {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

.loading-container p {
  margin-top: 20px;
  font-size: 1.2rem;
  color: #666;
}
</style>
