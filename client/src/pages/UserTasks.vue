<template>
  <div class="tasks-page">
    <div class="bg-pattern">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>
    </div>

    <header class="page-header">
      <div class="header-container">
        <div class="header-actions">
          <button class="nav-btn" @click="goBack">
            <q-icon name="arrow_back" />
            <span>Zurueck</span>
          </button>
          <button class="nav-btn logout" @click="logout">
            <q-icon name="logout" />
            <span>Abmelden</span>
          </button>
        </div>

        <div class="header-title">
          <h1>Meine Aufgaben</h1>
          <p>Uebersicht deiner angemeldeten Aufgaben</p>
        </div>

        <div class="header-user" v-if="user">
          <div class="user-info">
            <div class="user-icon">
              <q-icon :name="getUserIcon()" />
            </div>
            <div class="user-text">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-role" :class="getBadgeClass()">
                {{ getBadgeText() }}
              </span>
            </div>
          </div>
        </div>

        <div class="header-user" v-else>
          <q-spinner size="28px" color="white" />
        </div>
      </div>
    </header>

    <main class="page-main">
      <div class="content-wrapper">
        <section
          v-if="
            user &&
            user.klasse &&
            user.klasse !== 'Admin' &&
            user.klasse !== 'Lehrer'
          "
        >
          <div class="section-title">
            <div class="title-icon">
              <q-icon name="assignment" />
            </div>
            <h2>Angemeldete Aufgaben</h2>
          </div>

          <div v-if="tasks.length === 0" class="empty-container">
            <div class="empty-content">
              <div class="empty-illustration">
                <q-icon name="inbox" />
              </div>
              <h3>Keine Aufgaben vorhanden</h3>
              <p>Du bist derzeit fuer keine Aufgaben angemeldet.</p>
              <button class="cta-button" @click="goBack">
                <q-icon name="add" />
                Aufgaben entdecken
              </button>
            </div>
          </div>

          <div v-else class="tasks-container">
            <div
              v-for="task in tasks"
              :key="task.anmeldung_id"
              class="task-item"
            >
              <div class="task-header">
                <h3>{{ task.titel }}</h3>
                <span class="badge" :class="getStatusClass(task.status)">
                  {{ getStatusText(task.status) }}
                </span>
              </div>

              <p class="task-desc">{{ task.beschreibung }}</p>

              <div class="task-info">
                <div class="info-chip" v-if="task.datum">
                  <q-icon name="event" />
                  <span>{{ formatDate(task.datum) }}</span>
                </div>
                <div class="info-chip" v-if="task.uhrzeit">
                  <q-icon name="schedule" />
                  <span>{{ formatTime(task.uhrzeit) }} Uhr</span>
                </div>
                <div class="info-chip" v-if="task.lehrer_name">
                  <q-icon name="school" />
                  <span>{{ task.lehrer_name }}</span>
                </div>
                <div class="info-chip">
                  <q-icon name="access_time" />
                  <span>{{ formatDateTime(task.angemeldet_am) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="user && user.klasse === 'Lehrer'">
          <div class="section-title">
            <div class="title-icon teacher">
              <q-icon name="school" />
            </div>
            <h2>Betreute Aufgaben</h2>
          </div>

          <div v-if="tasks.length === 0" class="empty-container">
            <div class="empty-content">
              <div class="empty-illustration teacher">
                <q-icon name="assignment_turned_in" />
              </div>
              <h3>Keine Aufgabe zugewiesen</h3>
              <p>Sie haben derzeit keine Aufgabe zugewiesen.</p>
            </div>
          </div>

          <div v-else class="teacher-panel">
            <div
              v-for="task in tasks"
              :key="task.aufgabeid"
              class="task-management"
            >
              <div class="task-info-card">
                <div class="task-info-content">
                  <h3>{{ task.titel }}</h3>
                  <p>{{ task.beschreibung }}</p>
                  <div class="task-details">
                    <span v-if="task.datum">
                      <q-icon name="event" /> {{ formatDate(task.datum) }}
                    </span>
                    <span v-if="task.uhrzeit">
                      <q-icon name="schedule" />
                      {{ formatTime(task.uhrzeit) }} Uhr
                    </span>
                  </div>
                </div>
                <div class="task-info-actions">
                  <button
                    class="icon-btn refresh"
                    @click="loadSchuelerForTask(task.aufgabeid)"
                  >
                    <q-icon name="refresh" />
                    <span>Aktualisieren</span>
                  </button>
                </div>
              </div>

              <div class="students-management">
                <div
                  v-if="getSchuelerForTask(task.aufgabeid).length === 0"
                  class="no-data"
                >
                  <q-icon name="group_off" />
                  <p>Noch keine Schueler angemeldet</p>
                </div>

                <div v-else class="student-group">
                  <div class="group-header">
                    <h4>
                      <q-icon name="people" />
                      Angemeldete Schueler
                      <span class="counter">{{
                        getSchuelerForTask(task.aufgabeid).length
                      }}</span>
                    </h4>
                  </div>

                  <div class="student-grid">
                    <div
                      v-for="schueler in getSchuelerForTask(task.aufgabeid)"
                      :key="schueler.anmeldung_id"
                      class="student-box"
                    >
                      <div class="student-profile">
                        <div class="profile-avatar">
                          {{ schueler.name.charAt(0).toUpperCase() }}
                        </div>
                        <div class="profile-data">
                          <span class="profile-name">{{ schueler.name }}</span>
                          <span class="profile-email">{{ schueler.email }}</span>
                          <span class="profile-class">{{ schueler.klasse }}</span>
                          <span class="profile-timestamp">
                            <q-icon name="access_time" size="xs" />
                            {{ formatDateTime(schueler.angemeldet_am) }}
                          </span>
                        </div>
                      </div>

                      <div class="student-controls">
                        <span class="badge status-confirmed">Angemeldet</span>
                        <button
                          class="control-btn decline"
                          @click="
                            schuelerAbmelden(
                              schueler.anmeldung_id,
                              task.aufgabeid
                            )
                          "
                        >
                          <q-icon name="person_remove" /> Abmelden
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="user && user.klasse === 'Admin'">
          <div class="section-title">
            <div class="title-icon admin">
              <q-icon name="admin_panel_settings" />
            </div>
            <h2>Admin Uebersicht</h2>
          </div>

          <div class="empty-container">
            <div class="empty-content">
              <div class="empty-illustration admin">
                <q-icon name="admin_panel_settings" />
              </div>
              <h3>Admin Account</h3>
              <p>Als Admin hast du keine persoenlichen Aufgaben.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const user = ref(null);
const tasks = ref([]);
const schuelerListen = ref({});

const loadUser = async () => {
  try {
    const res = await axios.get("http://localhost:3000/auth/profile", {
      withCredentials: true,
    });
    user.value = res.data.user;
  } catch (err) {
    console.error(err);
    window.location.href = "http://localhost:9000/";
  }
};

const loadTasks = async () => {
  try {
    const url =
      user.value.klasse === "Admin"
        ? "http://localhost:3000/aufgaben"
        : "http://localhost:3000/user/aufgaben";

    const res = await axios.get(url, {
      withCredentials: true,
    });

    tasks.value = Array.isArray(res.data) ? res.data : [];

    if (user.value.klasse === "Lehrer") {
      for (const task of tasks.value) {
        await loadSchuelerForTask(task.aufgabeid);
      }
    }
  } catch (err) {
    console.error(err);
    tasks.value = [];
  }
};

const loadSchuelerForTask = async (aufgabeid) => {
  try {
    const res = await axios.get(
      `http://localhost:3000/aufgaben/${aufgabeid}/schueler`,
      {
        withCredentials: true,
      }
    );
    schuelerListen.value[aufgabeid] = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Fehler beim Laden der Schueler:", err);
    schuelerListen.value[aufgabeid] = [];
  }
};

const getSchuelerForTask = (aufgabeid) => {
  return schuelerListen.value[aufgabeid] || [];
};

const schuelerAbmelden = async (anmeldungId, aufgabeid) => {
  if (!confirm("Schueler wirklich von dieser Aufgabe abmelden?")) {
    return;
  }

  try {
    await axios.delete(`http://localhost:3000/anmeldungen/${anmeldungId}`, {
      withCredentials: true,
    });

    schuelerListen.value[aufgabeid] = getSchuelerForTask(aufgabeid).filter(
      (schueler) => schueler.anmeldung_id !== anmeldungId
    );
  } catch (err) {
    console.error("Fehler beim Abmelden des Schuelers:", err);
    alert(err.response?.data?.error || "Fehler beim Abmelden des Schuelers");
  }
};

const logout = async () => {
  try {
    await axios.post(
      "http://localhost:3000/auth/logout",
      {},
      { withCredentials: true }
    );
    window.location.href = "http://localhost:9000/";
  } catch (err) {
    console.error(err);
    window.location.href = "http://localhost:9000/";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("de-DE");
};

const formatTime = (timeString) => {
  if (!timeString) return "";
  return String(timeString).substring(0, 5);
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  return new Date(dateTimeString).toLocaleString("de-DE");
};

const getStatusClass = (status) => {
  if (status === "abgelehnt") return "status-rejected";
  return "status-confirmed";
};

const getStatusText = (status) => {
  if (status === "abgelehnt") return "Abgemeldet";
  return "Angemeldet";
};

const getBadgeClass = () => {
  if (!user.value) return "";
  if (user.value.klasse === "Admin") return "role-admin";
  if (user.value.klasse === "Lehrer") return "role-teacher";
  return "role-student";
};

const getBadgeText = () => {
  if (!user.value) return "";
  if (user.value.klasse === "Admin") return "Admin";
  if (user.value.klasse === "Lehrer") return "Lehrer";
  return user.value.klasse;
};

const getUserIcon = () => {
  if (!user.value) return "person";
  if (user.value.klasse === "Admin") return "admin_panel_settings";
  if (user.value.klasse === "Lehrer") return "school";
  return "person";
};

const goBack = () => {
  window.location.href = "http://localhost:9000/main";
};

onMounted(async () => {
  await loadUser();
  await loadTasks();
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.tasks-page {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
  color: #ffffff;
  position: relative;
  overflow-x: hidden;
}

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
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  top: -200px;
  left: -200px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  bottom: -150px;
  right: -150px;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  top: 40%;
  right: 10%;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 14, 39, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px 40px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 32px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.nav-btn {
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
}

.nav-btn.logout {
  background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%);
  border: none;
}

.header-title {
  text-align: center;
}

.header-title h1 {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #00d4ff 0%, #00f5a0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-title p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
}

.header-user {
  display: flex;
  justify-content: flex-end;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px 8px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
}

.user-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #ffffff;
}

.user-text {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 15px;
  font-weight: 700;
}

.user-role {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 6px;
  width: fit-content;
}

.role-admin {
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: #ffffff;
}

.role-teacher {
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  color: #0a0e27;
}

.role-student {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
}

.page-main {
  position: relative;
  z-index: 1;
  padding: 48px 40px;
}

.content-wrapper {
  max-width: 1600px;
  margin: 0 auto;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.title-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.title-icon.teacher {
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
}

.title-icon.admin {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
}

.section-title h2 {
  font-size: 34px;
  font-weight: 800;
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 90px 40px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
}

.empty-content {
  text-align: center;
  max-width: 520px;
}

.empty-illustration {
  width: 120px;
  height: 120px;
  margin: 0 auto 28px;
  border-radius: 50%;
  background: rgba(0, 212, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;
}

.empty-illustration.teacher {
  background: rgba(0, 245, 160, 0.15);
}

.empty-illustration.admin {
  background: rgba(255, 107, 53, 0.15);
}

.empty-content h3 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
}

.empty-content p {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 30px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.tasks-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 24px;
}

.task-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 28px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.task-header h3 {
  font-size: 22px;
  font-weight: 700;
}

.badge {
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.badge.status-confirmed {
  background: rgba(0, 245, 160, 0.2);
  color: #00f5a0;
}

.badge.status-rejected {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
}

.task-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
  margin-bottom: 20px;
}

.task-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.info-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}

.teacher-panel {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.task-management {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  overflow: hidden;
}

.task-info-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 28px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.08),
    rgba(0, 245, 160, 0.05)
  );
}

.task-info-content h3 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.task-info-content p {
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 14px;
}

.task-details {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.task-details span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.task-info-actions {
  display: flex;
  gap: 10px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.icon-btn.refresh {
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  color: #ffffff;
}

.icon-btn.danger {
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
  border: 1px solid rgba(255, 71, 87, 0.35);
}

.students-management {
  padding: 28px;
}

.student-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-header h4 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
}

.counter {
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

.student-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.student-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.student-profile {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
}

.profile-data {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-name {
  font-size: 16px;
  font-weight: 700;
}

.profile-email {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.profile-class {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.profile-timestamp {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.student-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.control-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.control-btn.decline {
  background: linear-gradient(135deg, #ff4757, #ff6348);
  color: #ffffff;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 70px 20px;
  color: rgba(255, 255, 255, 0.4);
}

.no-data .q-icon {
  font-size: 56px;
  margin-bottom: 14px;
}

@media (max-width: 1200px) {
  .header-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .header-actions,
  .header-user {
    justify-content: center;
  }

  .task-info-card {
    flex-direction: column;
  }

  .task-info-actions {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-main {
    padding: 32px 20px;
  }

  .header-container {
    padding: 16px 20px;
  }

  .header-title h1 {
    font-size: 26px;
  }

  .tasks-container {
    grid-template-columns: 1fr;
  }

  .student-box {
    flex-direction: column;
    align-items: flex-start;
  }

  .student-controls {
    align-items: flex-start;
  }
}
</style>
