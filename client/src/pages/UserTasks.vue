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

      <div v-else-if="user && user.klasse === 'Lehrer'">
        <h2 class="section-title">Meine übernommene Aufgabe</h2>

        <div v-if="tasks.length === 0" class="no-tasks">
          <div class="no-task-content">
            <q-icon name="assignment" size="xl" color="#d32f2f" />
            <h3>Keine Aufgabe übernommen</h3>
            <p>Sie haben derzeit keine Aufgabe übernommen.</p>
            <button class="back-to-main-btn" @click="goBack">
              <q-icon name="arrow_back" class="q-mr-xs" />
              Zurück zur Aufgabenübersicht
            </button>
          </div>
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
                <div class="header-actions">
                  <button class="refresh-btn" @click="loadSchuelerForTask(task.aufgabeid)">
                    <q-icon name="refresh" />
                    Aktualisieren
                  </button>
                  <button class="abmelde-btn" @click="lehrerAbmelden">
                    <q-icon name="logout" />
                    Von Aufgabe abmelden
                  </button>
                </div>
              </div>

              <div class="schueler-listen-container">

                <div class="schueler-list-section" v-if="getAllSchuelerForTask(task.aufgabeid).length > 0">
                  <h4 class="schueler-list-title">
                    Angemeldete Schüler
                    <span class="schueler-count">({{ getAllSchuelerForTask(task.aufgabeid).length }})</span>
                  </h4>

                  <div class="schueler-list">
                    <div v-for="schueler in getAllSchuelerForTask(task.aufgabeid)"
                         :key="schueler.anmeldung_id"
                         class="schueler-item"
                         :class="{
                           'rejected-item': schueler.status === 'abgelehnt',
                           'confirmed-item': schueler.status === 'bestätigt'
                         }">
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
                            Bestätigen
                          </button>
                          <button class="reject-btn" @click="updateSchuelerStatus(schueler.anmeldung_id, 'abgelehnt')">
                            <q-icon name="close" />
                            Ablehnen
                          </button>
                        </div>

                        <div class="action-buttons" v-else-if="schueler.status === 'abgelehnt'">
                          <button class="accept-btn" @click="updateSchuelerStatus(schueler.anmeldung_id, 'bestätigt')">
                            <q-icon name="check" />
                            Bestätigen
                          </button>
                          <button class="reset-btn" @click="updateSchuelerStatus(schueler.anmeldung_id, 'angemeldet')">
                            <q-icon name="replay" />
                            Zurücksetzen
                          </button>
                        </div>

                        <div class="action-buttons" v-else-if="schueler.status === 'bestätigt'">
                          <button class="reset-btn" @click="updateSchuelerStatus(schueler.anmeldung_id, 'angemeldet')">
                            <q-icon name="replay" />
                            Zurücksetzen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="schueler-list-section" v-if="getConfirmedSchuelerForTask(task.aufgabeid).length > 0">
                  <h4 class="schueler-list-title confirmed-title">
                    Bestätigte Schüler
                    <span class="schueler-count">({{ getConfirmedSchuelerForTask(task.aufgabeid).length }})</span>
                  </h4>

                  <div class="confirmed-list">
                    <div v-for="schueler in getConfirmedSchuelerForTask(task.aufgabeid)"
                         :key="schueler.anmeldung_id"
                         class="confirmed-item">
                      <div class="confirmed-info">
                        <div class="confirmed-name">{{ schueler.name }}</div>
                        <div class="confirmed-klasse">{{ schueler.klasse }}</div>
                        <div class="time-info" v-if="schueler.zeitInfo">
                          <span v-if="schueler.zeitInfo.startzeit">Start: {{ formatTime(schueler.zeitInfo.startzeit) }}</span>
                          <span v-if="schueler.zeitInfo.endzeit">Ende: {{ formatTime(schueler.zeitInfo.endzeit) }}</span>
                          <span v-if="schueler.zeitInfo.dauer">Dauer: {{ schueler.zeitInfo.dauer }} min</span>
                        </div>
                      </div>
                      <div class="confirmed-actions">
                        <div class="time-buttons">
                          <button v-if="!schueler.zeitInfo || !schueler.zeitInfo.startzeit"
                                  class="start-btn"
                                  @click="startZeitErfassung(schueler.anmeldung_id)">
                            <q-icon name="play_arrow" />
                            Start
                          </button>
                          <button v-else-if="schueler.zeitInfo.startzeit && !schueler.zeitInfo.endzeit"
                                  class="stop-btn"
                                  @click="stopZeitErfassung(schueler.anmeldung_id)">
                            <q-icon name="stop" />
                            Stop
                          </button>
                          <button v-else
                                  class="reset-time-btn"
                                  @click="resetZeitErfassung(schueler.anmeldung_id)">
                            <q-icon name="replay" />
                            Reset
                          </button>
                        </div>
                        <button class="status-change-btn" @click="showStatusChangeDialog(schueler)">
                          <q-icon name="swap_horiz" />
                          Status ändern
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="getAllSchuelerForTask(task.aufgabeid).length === 0" class="no-schueler">
                  Noch keine Schüler angemeldet
                </div>

              </div>
            </q-card>
          </div>
        </div>
      </div>

      <div v-else-if="user && user.klasse === 'Admin'">
        <h2 class="section-title">Admin Übersicht</h2>
        <div class="no-tasks">
          Als Admin hast du keine persönlichen Aufgaben.
        </div>
      </div>
    </main>

    <q-dialog v-model="statusChangeDialog" persistent>
      <q-card class="status-dialog">
        <q-card-section class="dialog-header">
          <div class="dialog-title">Status ändern für {{ selectedSchueler?.name }}</div>
        </q-card-section>

        <q-card-section class="dialog-content">
          <div class="status-options">
            <button class="status-option" @click="changeSchuelerStatus('angemeldet')">
              <q-icon name="schedule" />
              <span>Nicht bestätigt</span>
              <small>Zurück zu angemeldeten Schülern</small>
            </button>
            <button class="status-option" @click="changeSchuelerStatus('abgelehnt')">
              <q-icon name="close" />
              <span>Abmelden</span>
              <small>Von Aufgabe abmelden</small>
            </button>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <button class="cancel-btn" @click="statusChangeDialog = false">Abbrechen</button>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted} from "vue";
import axios from "axios";

const user = ref(null);
const tasks = ref([]);
const schuelerListen = ref({});
const statusChangeDialog = ref(false);
const selectedSchueler = ref(null);
const zeitErfassung = ref({});

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
      user.value.klasse === 'Admin'
        ? 'http://localhost:3000/aufgaben'
        : 'http://localhost:3000/user/aufgaben';

    const res = await axios.get(url, {
      withCredentials: true,
    });

    tasks.value = res.data;

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
    schuelerListen.value[aufgabeid] = res.data.map(schueler => ({
      ...schueler,
      zeitInfo: schueler.zeit_info || null
    }));
  } catch (err) {
    console.error('Fehler beim Laden der Schüler:', err);
    schuelerListen.value[aufgabeid] = [];
  }
};

const getAllSchuelerForTask = (aufgabeid) => {
  return schuelerListen.value[aufgabeid] || [];
};

const getConfirmedSchuelerForTask = (aufgabeid) => {
  return getAllSchuelerForTask(aufgabeid).filter(s => s.status === 'bestätigt');
};

const updateSchuelerStatus = async (anmeldung_id, status) => {
  try {
    await axios.patch(
      `http://localhost:3000/anmeldungen/${anmeldung_id}/status`,
      { status },
      { withCredentials: true }
    );

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

const startZeitErfassung = async (anmeldung_id) => {
  try {
    const startzeit = new Date();
    const res = await axios.post(
      `http://localhost:3000/anmeldungen/${anmeldung_id}/zeit/start`,
      { startzeit },
      { withCredentials: true }
    );

    for (const aufgabeid in schuelerListen.value) {
      const schueler = schuelerListen.value[aufgabeid].find(s => s.anmeldung_id === anmeldung_id);
      if (schueler) {
        schueler.zeitInfo = res.data.zeitInfo;
        break;
      }
    }

    zeitErfassung.value[anmeldung_id] = {
      startzeit,
      timer: setInterval(() => updateLiveDuration(anmeldung_id), 1000)
    };
  } catch (err) {
    console.error('Fehler beim Starten der Zeit:', err);
    alert('Fehler beim Starten der Zeit');
  }
};

const stopZeitErfassung = async (anmeldung_id) => {
  try {
    const endzeit = new Date();
    const res = await axios.post(
      `http://localhost:3000/anmeldungen/${anmeldung_id}/zeit/stop`,
      { endzeit },
      { withCredentials: true }
    );

    if (zeitErfassung.value[anmeldung_id]) {
      clearInterval(zeitErfassung.value[anmeldung_id].timer);
      delete zeitErfassung.value[anmeldung_id];
    }

    for (const aufgabeid in schuelerListen.value) {
      const schueler = schuelerListen.value[aufgabeid].find(s => s.anmeldung_id === anmeldung_id);
      if (schueler) {
        schueler.zeitInfo = res.data.zeitInfo;
        break;
      }
    }
  } catch (err) {
    console.error('Fehler beim Stoppen der Zeit:', err);
    alert('Fehler beim Stoppen der Zeit');
  }
};

const resetZeitErfassung = async (anmeldung_id) => {
  try {
    await axios.delete(
      `http://localhost:3000/anmeldungen/${anmeldung_id}/zeit`,
      { withCredentials: true }
    );

    if (zeitErfassung.value[anmeldung_id]) {
      clearInterval(zeitErfassung.value[anmeldung_id].timer);
      delete zeitErfassung.value[anmeldung_id];
    }

    for (const aufgabeid in schuelerListen.value) {
      const schueler = schuelerListen.value[aufgabeid].find(s => s.anmeldung_id === anmeldung_id);
      if (schueler) {
        schueler.zeitInfo = null;
        break;
      }
    }
  } catch (err) {
    console.error('Fehler beim Zurücksetzen der Zeit:', err);
    alert('Fehler beim Zurücksetzen der Zeit');
  }
};

const updateLiveDuration = (anmeldung_id) => {
  const timerData = zeitErfassung.value[anmeldung_id];
  if (timerData) {
    for (const aufgabeid in schuelerListen.value) {
      const schueler = schuelerListen.value[aufgabeid].find(s => s.anmeldung_id === anmeldung_id);
      if (schueler && schueler.zeitInfo) {
        const currentDuration = Math.round((new Date() - new Date(timerData.startzeit)) / (1000 * 60));
        schueler.zeitInfo.dauer = currentDuration;
        break;
      }
    }
  }
};

const showStatusChangeDialog = (schueler) => {
  selectedSchueler.value = schueler;
  statusChangeDialog.value = true;
};

const changeSchuelerStatus = async (status) => {
  if (!selectedSchueler.value) return;

  try {
    await axios.patch(
      `http://localhost:3000/anmeldungen/${selectedSchueler.value.anmeldung_id}/status`,
      { status },
      { withCredentials: true }
    );

    for (const aufgabeid in schuelerListen.value) {
      const schueler = schuelerListen.value[aufgabeid].find(s => s.anmeldung_id === selectedSchueler.value.anmeldung_id);
      if (schueler) {
        schueler.status = status;
        break;
      }
    }

    statusChangeDialog.value = false;
    selectedSchueler.value = null;
  } catch (err) {
    console.error('Fehler beim Ändern des Status:', err);
    alert('Fehler beim Ändern des Status');
  }
};

const lehrerAbmelden = async () => {
  if (!confirm('Möchten Sie sich wirklich von dieser Aufgabe abmelden? Alle Schüler-Anmeldungen bleiben erhalten.')) {
    return;
  }

  try {
    await axios.post(
      "http://localhost:3000/lehrer/abmelden",
      {},
      { withCredentials: true }
    );

    alert('Erfolgreich von der Aufgabe abgemeldet!');
    await loadTasks();
  } catch (err) {
    console.error('Fehler beim Abmelden:', err);
    alert('Fehler beim Abmelden von der Aufgabe');
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
  if (timeString instanceof Date) {
    return timeString.toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' });
  }
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

.header-actions {
  display: flex;
  gap: 10px;
  align-items: flex-start;
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

.abmelde-btn {
  background: #6c757d;
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

.abmelde-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.schueler-listen-container {
  padding: 0;
}

.schueler-list-section {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.schueler-list-section:last-child {
  border-bottom: none;
}

.schueler-list-title {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.confirmed-title {
  color: #198754;
}

.schueler-count {
  color: #666;
  font-size: 14px;
  font-weight: normal;
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

.rejected-item {
  background: #fef2f2;
  border-left: 4px solid #dc3545;
}

.confirmed-item {
  background: #f0f9ff;
  border-left: 4px solid #198754;
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

.confirmed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confirmed-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #b6d4fe;
  border-radius: 8px;
}

.confirmed-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.confirmed-name {
  font-weight: 600;
  color: #0b5ed7;
  font-size: 14px;
}

.confirmed-klasse {
  color: #666;
  font-size: 12px;
}

.time-info {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #666;
}

.time-info span {
  display: block;
}

.confirmed-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.time-buttons {
  display: flex;
  gap: 6px;
}

.start-btn, .stop-btn, .reset-time-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: all 0.3s ease;
}

.start-btn {
  background: #28a745;
  color: white;
}

.start-btn:hover {
  background: #218838;
  transform: translateY(-1px);
}

.stop-btn {
  background: #dc3545;
  color: white;
}

.stop-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.reset-time-btn {
  background: #fd7e14;
  color: white;
}

.reset-time-btn:hover {
  background: #e8590c;
  transform: translateY(-1px);
}

.status-change-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: all 0.3s ease;
}

.status-change-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.no-schueler {
  text-align: center;
  color: #666;
  padding: 40px;
  font-style: italic;
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

.no-task-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.no-task-content h3 {
  margin: 0;
  color: #333;
}

.no-task-content p {
  margin: 0;
  color: #666;
}

.back-to-main-btn {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-top: 10px;
}

.back-to-main-btn:hover {
  background: #b71c1c;
  transform: translateY(-2px);
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

.status-dialog {
  width: 400px;
  max-width: 90vw;
  border-radius: 12px;
}

.dialog-header {
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.dialog-content {
  padding: 20px;
}

.status-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  background: #f8f9fa;}

</style>