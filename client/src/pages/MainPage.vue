<template>
  <div class="main-app">
    <!-- Animated Background -->
    <div class="bg-pattern">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>
    </div>

    <!-- Klasse Popup -->
    <div v-if="showKlassePopup && currentUser" class="popup-overlay">
      <div class="popup-modal">
        <div class="popup-top">
          <div class="popup-icon-circle">
            <q-icon name="school" />
          </div>
          <h3>Klasseninformation erforderlich</h3>
        </div>

        <div class="popup-main">
          <p class="popup-text">Bitte gib deine Klasse ein, um fortzufahren:</p>
          <p class="popup-hint">Beispiele: 2AHIT, 3BHITM, 4AFITN, 5AHITN</p>

          <q-input
            v-model="klasseInput"
            label="Klasse"
            color="primary"
            outlined
            class="popup-input"
            :rules="[(val) => !!val || 'Klasse ist erforderlich']"
            @keyup.enter="saveKlasse"
          >
            <template v-slot:prepend>
              <q-icon name="class" />
            </template>
          </q-input>

          <div class="popup-actions">
            <q-btn
              label="Speichern"
              @click="saveKlasse"
              :disabled="!klasseInput"
              class="popup-save-btn"
              unelevated
              size="lg"
            >
              <template v-slot:default>
                <q-icon name="check_circle" class="q-mr-sm" />
                Speichern
              </template>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="!currentUser" class="loader-screen">
      <div class="loader-content">
        <q-spinner-gears size="100px" color="cyan" />
        <p class="loader-text">Lade Benutzerdaten...</p>
        <div class="loader-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="main-content">
      <!-- Header -->
      <header class="app-header">
        <div class="app-header-container">
          <div class="header-actions-left">
            <button class="header-btn logout" @click="logout">
              <q-icon name="logout" />
              <span>Abmelden</span>
            </button>

            <button
              v-if="currentUser && currentUser.klasse === 'Admin'"
              class="header-btn admin"
              @click="goToAdminDashboard"
            >
              <q-icon name="admin_panel_settings" />
              <span>Admin</span>
            </button>
          </div>

          <div class="header-branding">
            <h1>Tag der offenen Tür</h1>
            <p>HTL WienWest</p>
          </div>

          <div class="header-actions-right">
            <div class="user-profile" v-if="currentUser">
              <div class="profile-wrapper">
                <div
                  class="profile-badge"
                  v-if="
                    currentUser.klasse && currentUser.klasse !== 'Keine Klasse'
                  "
                  :class="getBadgeClass()"
                >
                  {{ getBadgeText() }}
                </div>
                <div class="profile-identity">
                  <div class="profile-avatar">
                    <q-icon :name="getUserIcon()" />
                  </div>
                  <span class="profile-name">{{ currentUser.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="app-main">
        <div class="main-container">
          <div v-if="isFirstClass" class="special-view free-day">
            <div class="special-content">
              <div class="special-icon celebration">
                <q-icon name="celebration" />
              </div>
              <h2>Freier Tag!</h2>
              <p class="special-message">
                Als Schüler/in der 1. Klasse hast du heute frei und kannst den
                Tag der offenen Tür genießen.
              </p>
              <div class="benefits-grid">
                <div class="benefit-item">
                  <q-icon name="explore" />
                  <span>Erkunde die Schule</span>
                </div>
                <div class="benefit-item">
                  <q-icon name="groups" />
                  <span>Triff neue Leute</span>
                </div>
                <div class="benefit-item">
                  <q-icon name="restaurant" />
                  <span>Genieße Snacks</span>
                </div>
              </div>
              <div class="special-cta">
                <button class="cta-primary" @click="goToUserTasks">
                  <q-icon name="list_alt" />
                  <span>Zu deinen Aufgaben</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="isFifthClass" class="special-view diploma">
            <div class="special-content">
              <div class="special-icon diploma-icon">
                <q-icon name="school" />
              </div>
              <h2>Diplomarbeit Präsentation</h2>
              <p class="special-message">
                Als Schüler/in der 5. Klasse präsentierst du heute deine
                Diplomarbeit. Diese Präsentation ist verpflichtend und findet
                den ganzen Tag statt.
              </p>
              <div class="diploma-details">
                <h3>
                  <q-icon name="assignment" class="q-mr-sm" />
                  Deine Aufgabe:
                </h3>
                <div v-if="diplomTask" class="diploma-card">
                  <div class="diploma-emoji">
                    {{ diplomTask.icon || "🎓" }}
                  </div>
                  <div class="diploma-info">
                    <h4>{{ diplomTask.titel }}</h4>
                    <p>{{ diplomTask.beschreibung }}</p>
                    <div class="diploma-meta">
                      <div class="meta-chip">
                        <q-icon name="schedule" />
                        <span>{{ formatTime(diplomTask.uhrzeit) }} Uhr</span>
                      </div>
                      <div class="meta-chip">
                        <q-icon name="location_on" />
                        <span>Zugeteilter Stand</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="diploma-loading">
                  <q-spinner size="md" color="cyan" />
                  <p>Lade Diplomarbeit...</p>
                </div>
              </div>
              <div class="diploma-notice">
                <q-icon name="info" />
                <p>
                  Die Präsentation deiner Diplomarbeit ist verpflichtend. Bitte
                  halte dich an deinen zugewiesenen Stand.
                </p>
              </div>
            </div>
          </div>

          <template v-else>
            <section class="nav-tabs">
              <div class="tabs-wrapper">
                <ul class="tabs-scroll" ref="tabsList">
                  <li
                    v-for="(task, i) in visibleTasks"
                    :key="task.aufgabeid || 'placeholder-' + i"
                    :class="[
                      'tab-card',
                      { 'tab-active': visibleStart + i === currentIndex },
                    ]"
                    @click="selectIndex(visibleStart + i)"
                  >
                    <div class="tab-inner">
                      <span class="tab-emoji">{{ task?.icon || "📋" }}</span>
                      <span class="tab-label">{{
                        task?.titel || "Content"
                      }}</span>
                    </div>
                    <span
                      class="tab-highlight"
                      v-if="visibleStart + i === currentIndex"
                    ></span>
                  </li>
                </ul>
              </div>
            </section>

            <section class="display-stage">
              <button class="nav-arrow prev" @click="prev">
                <q-icon name="chevron_left" size="lg" />
              </button>

              <div class="stage-container">
                <transition name="fade-slide" mode="out-in">
                  <div :key="currentIndex" class="stage-visual">
                    <div class="visual-wrapper">
                      <div class="visual-icon-group">
                        <div class="visual-icon">
                          {{ activeTask?.icon || "📷" }}
                        </div>
                        <div class="visual-glow"></div>
                      </div>
                      <p class="visual-label">
                        {{ activeTask?.titel || "Bildvorschau" }}
                      </p>
                      <div class="visual-decor">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>

              <button class="nav-arrow next" @click="next">
                <q-icon name="chevron_right" size="lg" />
              </button>
            </section>

            <section class="details-panel">
              <div class="panel-info">
                <div class="info-heading">
                  <q-icon name="info" class="heading-icon" />
                  <h3>
                    {{
                      activeTask?.titel ||
                      "Infos zum/zur entsprechenden/r Raum/Aufgabe"
                    }}
                  </h3>
                </div>
                <p class="info-description">
                  {{
                    activeTask?.beschreibung ||
                    "Weitere Informationen zur Aufgabe erscheinen hier."
                  }}
                </p>
                <div class="info-metadata">
                  <div v-if="activeTask?.datum" class="meta-chip">
                    <q-icon name="event" />
                    <span>{{ formatDate(activeTask.datum) }}</span>
                  </div>
                  <div v-if="activeTask?.uhrzeit" class="meta-chip">
                    <q-icon name="access_time" />
                    <span>{{ formatTime(activeTask.uhrzeit) }} Uhr</span>
                  </div>
                  <div v-if="activeTask?.lehrer_name" class="meta-chip">
                    <q-icon name="person" />
                    <span>{{ activeTask.lehrer_name }}</span>
                  </div>
                </div>
              </div>

              <div class="panel-actions">
                <button
                  v-if="
                    currentUser &&
                    currentUser.klasse &&
                    currentUser.klasse !== 'Admin' &&
                    currentUser.klasse !== 'Lehrer' &&
                    !currentUser.klasse.toLowerCase().includes('fitn')
                  "
                  class="panel-btn register"
                  @click="schuelerAnmelden"
                  :disabled="!activeTask || isAlreadyRegisteredForTask"
                >
                  <q-icon
                    :name="
                      isAlreadyRegisteredForTask ? 'check_circle' : 'how_to_reg'
                    "
                  />
                  <span>
                    {{
                      isAlreadyRegisteredForTask
                        ? "Bereits angemeldet"
                        : "Anmelden"
                    }}
                  </span>
                </button>

                <button
                  v-if="currentUser && currentUser.klasse === 'Lehrer'"
                  class="panel-btn teacher"
                  @click="lehrerAnmelden"
                  :disabled="!activeTask || activeTask.lehrerid"
                >
                  <q-icon name="assignment_ind" />
                  <span>
                    {{
                      activeTask?.lehrerid
                        ? "Aufgabe vergeben"
                        : "Als Lehrkraft anmelden"
                    }}
                  </span>
                </button>

                <button class="panel-btn outline" @click="goToUserTasks">
                  <q-icon name="list_alt" />
                  <span>Zu den Aufgaben</span>
                </button>
              </div>
            </section>

            <section class="pagination">
              <ul class="dot-nav">
                <li
                  v-for="(t, idx) in filteredTasks"
                  :key="idx"
                  class="nav-dot"
                  :class="{ 'dot-active': idx === currentIndex }"
                  @click="selectIndex(idx)"
                  :aria-label="'Slide ' + (idx + 1)"
                >
                  <span class="dot-core"></span>
                </li>
              </ul>
            </section>
          </template>
        </div>
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

    filteredTasks() {
      if (!this.currentUser?.klasse) return [];

      if (
        this.currentUser.klasse === "Admin" ||
        this.currentUser.klasse === "Lehrer"
      ) {
        return this.tasks;
      }

      if (
        this.currentUser.klasse === "Keine Klasse" ||
        this.isFirstClass ||
        this.isFifthClass
      ) {
        return [];
      }

      const userKlasse = this.currentUser.klasse.toLowerCase();

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
    async loadUserProfile() {
      try {
        const res = await axios.get("http://localhost:3000/auth/profile", {
          withCredentials: true,
        });
        this.currentUser = res.data.user;

        if (
          (!this.currentUser.klasse || this.currentUser.klasse === "") &&
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

    async saveKlasse() {
      if (!this.klasseInput) return;

      try {
        await axios.post(
          "http://localhost:3000/auth/update-klasse",
          { klasse: this.klasseInput },
          { withCredentials: true }
        );

        this.currentUser.klasse = this.klasseInput;
        this.showKlassePopup = false;
        this.klasseInput = "";

        await this.loadTasks();
      } catch (err) {
        console.error("Fehler beim Speichern der Klasse", err);
      }
    },

    isAdminAccount() {
      return this.currentUser?.klasse === "Admin";
    },

    isLehrerAccount() {
      return this.currentUser?.klasse === "Lehrer";
    },

    getBadgeClass() {
      if (this.isAdminAccount()) return "badge-admin";
      if (this.isLehrerAccount()) return "badge-teacher";
      return "badge-student";
    },

    getBadgeText() {
      if (this.isAdminAccount()) return "Admin";
      if (this.isLehrerAccount()) return "Lehrer";
      return this.currentUser?.klasse || "";
    },

    getUserIcon() {
      if (this.isAdminAccount()) return "admin_panel_settings";
      if (this.isLehrerAccount()) return "school";
      return "person";
    },

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

      this.diplomTask = this.tasks.find(
        (t) =>
          t.ziel_klassen?.some((z) => userKlasse.includes(z.toLowerCase())) &&
          (t.kategorie === "diplomarbeit" ||
            t.titel?.toLowerCase().includes("diplom"))
      ) || {
        titel: "Diplomarbeit Präsentation",
        beschreibung: "Präsentation deiner Diplomarbeit den ganzen Tag.",
        icon: "🎓",
        uhrzeit: "08:00",
      };
    },

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
      this.currentIndex = (this.currentIndex + 1) % this.filteredTasks.length;
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
/* ============================================
   GLOBAL RESET
   ============================================ */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.main-app {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
  color: #ffffff;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* ============================================
   ANIMATED BACKGROUND
   ============================================ */
.bg-pattern {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: orb-float 20s ease-in-out infinite;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  top: -200px;
  left: -200px;
  animation-delay: 0s;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  bottom: -150px;
  right: -150px;
  animation-delay: -7s;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  top: 40%;
  right: 10%;
  animation-delay: -14s;
}

@keyframes orb-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9);
  }
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: overlay-fade 0.3s ease;
}

@keyframes overlay-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.popup-modal {
  background: linear-gradient(135deg, #1a1f3a, #0a0e27);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: popup-slide 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes popup-slide {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popup-top {
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  padding: 40px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.popup-icon-circle {
  width: 90px;
  height: 90px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  font-size: 44px;
  color: #ffffff;
}

.popup-top h3 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
}

.popup-main {
  padding: 44px 36px;
  text-align: center;
}

.popup-text {
  margin: 0 0 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 17px;
  line-height: 1.6;
  font-weight: 500;
}

.popup-hint {
  color: rgba(255, 255, 255, 0.5) !important;
  font-size: 14px !important;
  margin-bottom: 36px !important;
  font-weight: 400 !important;
}

.popup-input {
  margin-bottom: 36px;
}

.popup-save-btn {
  min-width: 200px;
  height: 52px;
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  color: #ffffff;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.popup-save-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 212, 255, 0.4);
}

.loader-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  animation: loader-pulse 2s ease-in-out infinite;
}

@keyframes loader-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.85;
  }
}

.loader-text {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  margin: 0;
}

.loader-dots {
  display: flex;
  gap: 10px;
}

.loader-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00d4ff;
  animation: loader-bounce 1.4s ease-in-out infinite;
}

.loader-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loader-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loader-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-14px);
  }
}

.main-content {
  position: relative;
  z-index: 1;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 14, 39, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.app-header-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px 40px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 32px;
}

.header-actions-left,
.header-actions-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions-right {
  justify-content: flex-end;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.2);
}

.header-btn.logout {
  background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%);
  border: none;
}

.header-btn.logout:hover {
  box-shadow: 0 8px 24px rgba(255, 71, 87, 0.4);
}

.header-btn.admin {
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
  border: none;
}

.header-btn.admin:hover {
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.4);
}

.header-branding {
  text-align: center;
}

.header-branding h1 {
  font-size: 34px;
  margin: 0;
  font-weight: 800;
  background: linear-gradient(135deg, #00d4ff 0%, #00f5a0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.header-branding p {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.user-profile {
  display: flex;
  justify-content: flex-end;
}

.profile-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.profile-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-admin {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.badge-teacher {
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  color: #0a0e27;
  box-shadow: 0 4px 12px rgba(0, 245, 160, 0.3);
}

.badge-student {
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.profile-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 16px 8px 8px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.profile-identity:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(0, 212, 255, 0.3);
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.profile-name {
  font-weight: 600;
  color: #ffffff;
  font-size: 15px;
}

.app-main {
  padding: 48px 40px;
}

.main-container {
  max-width: 1600px;
  margin: 0 auto;
}

.special-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 600px;
  border-radius: 24px;
  padding: 60px;
  position: relative;
  overflow: hidden;
  border: 2px solid;
}

.special-view::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
}

.special-view.free-day {
  background: linear-gradient(
    135deg,
    rgba(0, 245, 160, 0.1),
    rgba(0, 212, 170, 0.05)
  );
  border-color: rgba(0, 245, 160, 0.3);
}

.special-view.free-day::before {
  background: radial-gradient(
    circle,
    rgba(0, 245, 160, 0.15) 0%,
    transparent 70%
  );
}

.special-view.diploma {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.1),
    rgba(0, 153, 255, 0.05)
  );
  border-color: rgba(0, 212, 255, 0.3);
}

.special-view.diploma::before {
  background: radial-gradient(
    circle,
    rgba(0, 212, 255, 0.15) 0%,
    transparent 70%
  );
}

.special-content {
  text-align: center;
  max-width: 900px;
  width: 100%;
  position: relative;
  z-index: 1;
}

.special-icon {
  font-size: 120px;
  margin-bottom: 24px;
  display: inline-block;
}

.special-content h2 {
  font-size: 48px;
  font-weight: 800;
  margin: 0 0 20px;
}

.special-view.free-day h2 {
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.special-view.diploma h2 {
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.special-message {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
  line-height: 1.8;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  max-width: 600px;
  margin: 0 auto 40px;
}

.benefit-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.benefit-item:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(0, 245, 160, 0.3);
  box-shadow: 0 8px 24px rgba(0, 245, 160, 0.15);
}

.benefit-item .q-icon {
  font-size: 32px;
  color: #00f5a0;
}

.benefit-item span {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.special-cta {
  margin-top: 40px;
}

.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 36px;
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  color: #0a0e27;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 24px rgba(0, 245, 160, 0.3);
}

.cta-primary:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 245, 160, 0.5);
}

.diploma-details {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 36px;
  margin: 40px 0;
  text-align: left;
}

.diploma-details h3 {
  color: #00d4ff;
  margin-bottom: 28px;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.diploma-card {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 28px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
}

.diploma-emoji {
  font-size: 72px;
  min-width: 72px;
}

.diploma-info h4 {
  color: #ffffff;
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
}

.diploma-info p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 20px;
  line-height: 1.6;
  font-size: 16px;
}

.diploma-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.meta-chip .q-icon {
  color: #00d4ff;
}

.diploma-loading {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  padding: 40px;
}

.diploma-loading p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

.diploma-notice {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 16px;
  padding: 20px 24px;
  margin-top: 32px;
}

.diploma-notice .q-icon {
  color: #00d4ff;
  font-size: 28px;
  flex-shrink: 0;
}

.diploma-notice p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  line-height: 1.6;
}

.nav-tabs {
  margin-bottom: 40px;
}

.tabs-wrapper {
  overflow: hidden;
}

.tabs-scroll {
  display: flex;
  gap: 16px;
  padding: 0;
  margin: 0;
  list-style: none;
  justify-content: center;
  flex-wrap: wrap;
}

.tab-card {
  position: relative;
  cursor: pointer;
  padding: 0;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.tab-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(0, 212, 255, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.15);
}

.tab-card.tab-active {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.25);
}

.tab-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 28px;
}

.tab-emoji {
  font-size: 32px;
  transition: all 0.3s ease;
}

.tab-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  transition: all 0.3s ease;
  text-align: center;
}

.tab-card.tab-active .tab-label {
  color: #00d4ff;
  font-weight: 700;
}

.tab-highlight {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00d4ff 0%, #00f5a0 100%);
  border-radius: 3px 3px 0 0;
  animation: highlight-slide 0.3s ease;
}

@keyframes highlight-slide {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

.display-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin: 0 0 32px;
  position: relative;
  height: 500px;
}

.stage-container {
  flex: 1;
  max-width: 1000px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.stage-visual {
  width: 100%;
  height: 100%;
  border: 2px dashed rgba(0, 212, 255, 0.3);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.02),
    rgba(0, 212, 255, 0.05)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.visual-wrapper {
  text-align: center;
  position: relative;
  z-index: 1;
}

.visual-icon-group {
  position: relative;
  display: inline-block;
  margin-bottom: 28px;
}

.visual-icon {
  font-size: 108px;
  position: relative;
  z-index: 2;
}

.visual-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  background: radial-gradient(
    circle,
    rgba(0, 212, 255, 0.25) 0%,
    transparent 70%
  );
  border-radius: 50%;
  animation: visual-glow-pulse 2s ease-in-out infinite;
}

@keyframes visual-glow-pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

.visual-label {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 24px;
  color: #00d4ff;
}

.visual-decor {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.visual-decor span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00d4ff;
  animation: decor-bounce 1.4s ease-in-out infinite;
}

.visual-decor span:nth-child(2) {
  animation-delay: 0.2s;
}

.visual-decor span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes decor-bounce {
  0%,
  80%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.4);
    opacity: 1;
  }
}

.nav-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  border: none;
  border-radius: 50%;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
  flex-shrink: 0;
}

.nav-arrow:hover {
  transform: scale(1.15);
  box-shadow: 0 8px 28px rgba(0, 212, 255, 0.5);
}

.nav-arrow:active {
  transform: scale(0.95);
}

.details-panel {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 36px;
  align-items: center;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  color: #ffffff;
  padding: 36px 44px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.3);
  margin-top: 32px;
}

.info-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.heading-icon {
  font-size: 32px;
}

.panel-info h3 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.info-description {
  margin: 0 0 24px;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.8;
  font-size: 16px;
}

.info-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.panel-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.panel-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 32px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 2px solid transparent;
  white-space: nowrap;
  min-width: 220px;
  justify-content: center;
}

.panel-btn.register {
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  color: #0a0e27;
}

.panel-btn.register:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 245, 160, 0.5);
}

.panel-btn.register:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.panel-btn.teacher {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  color: #ffffff;
}

.panel-btn.teacher:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(255, 107, 53, 0.5);
}

.panel-btn.teacher:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.panel-btn.outline {
  background: transparent;
  color: #ffffff;
  border-color: #ffffff;
}

.panel-btn.outline:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
}

/* ============================================
   PAGINATION
   ============================================ */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 48px;
  padding-bottom: 24px;
}

.dot-nav {
  display: flex;
  gap: 14px;
  padding: 18px 28px;
  margin: 0;
  list-style: none;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50px;
  backdrop-filter: blur(10px);
}

.nav-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(0, 212, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-dot:hover {
  background: rgba(0, 212, 255, 0.6);
  transform: scale(1.25);
}

.nav-dot.dot-active {
  background: #00d4ff;
  transform: scale(1.4);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.5);
}

.dot-core {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  opacity: 0;
  transition: all 0.3s ease;
}

.nav-dot.dot-active .dot-core {
  opacity: 1;
}

.fade-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.96);
}

.fade-slide-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.fade-slide-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-40px) scale(0.96);
}

@media (max-width: 1200px) {
  .app-header-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .header-actions-left,
  .header-actions-right {
    justify-content: center;
  }

  .profile-wrapper {
    align-items: center;
  }

  .details-panel {
    grid-template-columns: 1fr;
  }

  .panel-actions {
    align-items: stretch;
  }

  .panel-btn {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .app-main {
    padding: 32px 20px;
  }

  .app-header-container {
    padding: 16px 20px;
  }

  .header-branding h1 {
    font-size: 28px;
  }

  .display-stage {
    height: 360px;
    gap: 12px;
  }

  .nav-arrow {
    width: 52px;
    height: 52px;
  }

  .tabs-scroll {
    gap: 10px;
  }

  .tab-inner {
    padding: 14px 20px;
  }

  .tab-emoji {
    font-size: 28px;
  }

  .tab-label {
    font-size: 13px;
  }

  .details-panel {
    padding: 28px 24px;
  }

  .panel-info h3 {
    font-size: 22px;
  }

  .special-content h2 {
    font-size: 36px;
  }

  .diploma-card {
    flex-direction: column;
    text-align: center;
  }

  .diploma-meta {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .header-branding h1 {
    font-size: 22px;
  }

  .header-btn span {
    display: none;
  }

  .header-btn {
    padding: 12px;
  }

  .display-stage {
    height: 280px;
  }

  .visual-icon {
    font-size: 72px;
  }

  .visual-label {
    font-size: 18px;
  }

  .dot-nav {
    padding: 14px 20px;
    gap: 10px;
  }

  .nav-dot {
    width: 12px;
    height: 12px;
  }

  .special-view {
    padding: 40px 24px;
  }

  .special-content h2 {
    font-size: 28px;
  }
}
</style>
