<template>
  <div class="user-tasks-page">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <q-icon name="arrow_back" class="q-mr-xs" />
          Zurück
        </button>

        <button class="logout-btn" @click="logout">
          <q-icon name="logout" class="q-mr-xs" />
          Abmelden
        </button>
      </div>

      <h1>Meine Aufgaben</h1>

      <div class="header-right" v-if="user">
        <div class="user-info">
          <div class="user-details">
            <div class="user-klasse" :class="getBadgeClass()">
              {{ getBadgeText() }}
            </div>
            <div class="user-name-section">
              <q-icon :name="getUserIcon()" class="user-icon" />
              <span class="user-name">{{ user.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="header-right" v-else>
        <q-spinner size="20px" />
      </div>
    </header>

    <main class="content">
      <!-- Schüler Ansicht -->
      <div v-if="user && user.klasse && user.klasse !== 'Admin' && user.klasse !== 'Lehrer'">
        <h2 class="section-title">Meine angemeldeten Aufgaben</h2>
        <div v-if="tasks.length === 0" class="no-tasks">
          Du bist für derzeit keine Aufgaben angemeldet.
        </div>

        <div v-else class="tasks-list">
          <q-card v-for="task in tasks" :key="task.anmeldung_id" class="task-card">
            <div class="task-header">
              <div class="task-title">{{ task.titel }}</div>
              <div class="task-status" :class="getStatusClass(task.status)">
                {{ getStatusText(task.status) }}
              </div>
            </div>
            <div class="task-desc">{{ task.beschreibung }}</div>
            <div class="task-meta">
              <span v-if="task.datum"
                ><q-icon name="event" /> {{ formatDate(task.datum) }}</span
              >
              <span v-if="task.uhrzeit"
                ><q-icon name="schedule" />
                {{ formatTime(task.uhrzeit) }} Uhr</span
              >
              <span v-if="task.lehrer_name"
                ><q-icon name="school" /> {{ task.lehrer_name }}</span
              >
              <span><q-icon name="access_time" /> Angemeldet: {{ formatDateTime(task.angemeldet_am) }}</span>
            </div>
          </q-card>
        </div>
      </div>

      <!-- Lehrer Ansicht -->
      <div v-else-if="user && user.klasse === 'Lehrer'">
        <h2 class="section-title">Meine übernommenen Aufgaben</h2>
        <div v-if="tasks.length === 0" class="no-tasks">
          Du hast derzeit keine Aufgaben übernommen.
        </div>

        <div v-else class="lehrer-tasks">
          <div v-for="task in tasks" :key="task.aufgabeid" class="lehrer-task-section">
            <q-card class="lehrer-task-card">
              <div class="lehrer-task-header">
                <div class="lehrer-task-info">
                  <h3 class="task-title">{{ task.titel }}</h3>
                  <p class="task-desc">{{ task.beschreibung }}</p>
                  <div class="task-meta">
                    <span v-if="task.datum"
                      ><q-icon name="event" /> {{ formatDate(task.datum) }}</span
                    >
                    <span v-if="task.uhrzeit"
                      ><q-icon name="schedule" />
                      {{ formatTime(task.uhrzeit) }} Uhr</span
                    >
                  </div>
                </div>
                <button class="refresh-btn" @click="loadSchuelerForTask(task.aufgabeid)">
                  <q-icon name="refresh" />
                  Aktualisieren
                </button>
              </div>

              <!-- Schüler Liste für diese Aufgabe -->
              <div class="schueler-list-section">
                <h4 class="schueler-list-title">
                  Angemeldete Schüler
                  <span class="schueler-count">({{ getSchuelerForTask(task.aufgabeid).length }})</span>
                </h4>

                <div v-if="getSchuelerForTask(task.aufgabeid).length === 0" class="no-schueler">
                  Noch keine Schüler angemeldet
                </div>

                <div v-else class="schueler-list">
                  <div v-for="schueler in getSchuelerForTask(task.aufgabeid)"
                       :key="schueler.anmeldung_id"
                       class="schueler-item">
                    <div class="schueler-info">
                      <div class="schueler-name">{{ schueler.name }}</div>
                      <div class="schueler-email">{{ schueler.email }}</div>
                      <div class="schueler-klasse">{{ schueler.klasse }}</div>
                      <div class="anmelde-time">
                        Angemeldet: {{ formatDateTime(schueler.angemeldet_am) }}
                      </div>
                    </div>

                    <div class="schueler-actions">
                      <div class="schueler-status" :class="getStatusClass(schueler.status)">
                        {{ getStatusText(schueler.status) }}
                      </div>

                      <div class="action-buttons" v-if="schueler.status === 'angemeldet'">
                        <button class="accept-btn" @click="updateSchuelerStatus(schueler.anmeldung_id, 'bestätigt')">
                          <q-icon name="check" />
                          Annehmen
                        </button>
                        <button class="reject-btn" @click="updateSchuelerStatus(schueler.anmeldung_id, 'abgelehnt')">
                          <q-icon name="close" />
                          Ablehnen
                        </button>
                      </div>

                      <div class="action-buttons" v-else>
                        <button class="reset-btn" @click="updateSchuelerStatus(schueler.anmeldung_id, 'angemeldet')">
                          <q-icon name="replay" />
                          Zurücksetzen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Admin Ansicht (kann leer bleiben oder eigene Logik haben) -->
      <div v-else-if="user && user.klasse === 'Admin'">
        <h2 class="section-title">Admin Übersicht</h2>
        <div class="no-tasks">
          Als Admin hast du keine persönlichen Aufgaben.
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted} from "vue";
import axios from "axios";

const user = ref(null);
const tasks = ref([]);
const schuelerListen = ref({}); // { aufgabeid: [schueler] }

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
    const res = await axios.get("http://localhost:3000/user/aufgaben", {
      withCredentials: true,
    });
    tasks.value = res.data;

    // Für Lehrer: Schüler-Listen für jede Aufgabe laden
    if (user.value.klasse === 'Lehrer') {
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
    const res = await axios.get(`http://localhost:3000/aufgaben/${aufgabeid}/schueler`, {
      withCredentials: true,
    });
    schuelerListen.value[aufgabeid] = res.data;
  } catch (err) {
    console.error('Fehler beim Laden der Schüler:', err);
    schuelerListen.value[aufgabeid] = [];
  }
};

const getSchuelerForTask = (aufgabeid) => {
  return schuelerListen.value[aufgabeid] || [];
};

const updateSchuelerStatus = async (anmeldung_id, status) => {
  try {
    await axios.patch(
      `http://localhost:3000/anmeldungen/${anmeldung_id}/status`,
      { status },
      { withCredentials: true }
    );

    // Schüler-Liste aktualisieren
    for (const aufgabeid in schuelerListen.value) {
      const schueler = schuelerListen.value[aufgabeid].find(s => s.anmeldung_id === anmeldung_id);
      if (schueler) {
        schueler.status = status;
        break;
      }
    }
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Status:', err);
    alert('Fehler beim Aktualisieren des Status');
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
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE");
};

const formatTime = (timeString) => {
  if (!timeString) return "";
  return timeString.substring(0, 5);
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  return date.toLocaleString("de-DE");
};

const getStatusClass = (status) => {
  switch (status) {
    case 'bestätigt': return 'status-confirmed';
    case 'abgelehnt': return 'status-rejected';
    case 'angemeldet':
    default: return 'status-pending';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'bestätigt': return 'Bestätigt ✓';
    case 'abgelehnt': return 'Abgelehnt ✗';
    case 'angemeldet':
    default: return 'Nicht bestätigt';
  }
};

const getBadgeClass = () => {
  if (!user.value) return "";
  if (user.value.klasse === "Admin") return "admin-badge";
  if (user.value.klasse === "Lehrer") return "lehrer-badge";
  return "";
};

const getBadgeText = () => {
  if (!user.value) return "";
  if (user.value.klasse === "Admin") return "Admin Account";
  if (user.value.klasse === "Lehrer") return "Lehrer Account";
  return user.value.klasse;
};

const getUserIcon = () => {
  if (!user.value) return "person";
  if (user.value.klasse === "Admin") return "admin_panel_settings";
  if (user.value.klasse === "Lehrer") return "school";
  return "person";
};

onMounted(async () => {
  await loadUser();
  await loadTasks();
});

const goBack = () => {
  window.location.href = "http://localhost:9000/main";
};
</script>

<style scoped>
.user-tasks-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(211, 47, 47, 0.1);
}

.header h1 {
  font-size: 36px;
  background: linear-gradient(135deg, #d32f2f, #f44336);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logout-btn {
  background: #f44336;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.back-btn {
  background: #fff;
  color: #d32f2f;
  border: 2px solid #d32f2f;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  margin-right: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #d32f2f;
  color: white;
  transform: translateY(-2px);
}

/* Schüler Ansicht */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.08);
  background: #fff;
  border-left: 4px solid #d32f2f;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.task-title {
  font-weight: 700;
  font-size: 18px;
  color: #d32f2f;
  flex: 1;
}

.task-status {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-confirmed {
  background: #d1edff;
  color: #0b5ed7;
  border: 1px solid #9ec5fe;
}

.status-rejected {
  background: #f8d7da;
  color: #842029;
  border: 1px solid #f1aeb5;
}

.task-desc {
  font-size: 14px;
  color: #555;
  margin-bottom: 12px;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #888;
}

.task-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Lehrer Ansicht */
.lehrer-tasks {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.lehrer-task-card {
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.08);
}

.lehrer-task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.lehrer-task-info {
  flex: 1;
}

.refresh-btn {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.refresh-btn:hover {
  background: #b71c1c;
}

.schueler-list-section {
  padding: 20px;
}

.schueler-list-title {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.schueler-count {
  color: #666;
  font-size: 14px;
  font-weight: normal;
}

.no-schueler {
  text-align: center;
  color: #666;
  padding: 40px;
  font-style: italic;
}

.schueler-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schueler-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.schueler-info {
  flex: 1;
}

.schueler-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.schueler-email {
  color: #666;
  font-size: 14px;
  margin-bottom: 2px;
}

.schueler-klasse {
  color: #888;
  font-size: 12px;
  margin-bottom: 4px;
}

.anmelde-time {
  color: #888;
  font-size: 11px;
}

.schueler-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.accept-btn, .reject-btn, .reset-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.accept-btn {
  background: #28a745;
  color: white;
}

.accept-btn:hover {
  background: #218838;
  transform: translateY(-1px);
}

.reject-btn {
  background: #dc3545;
  color: white;
}

.reject-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.section-title {
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
}

.no-tasks {
  text-align: center;
  color: #666;
  padding: 60px 20px;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
}

.admin-badge {
  background: #7b1fa2;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 12px;
}

.lehrer-badge {
  background: #388e3c;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 12px;
}

.user-name-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-icon {
  color: #d32f2f;
}
</style>