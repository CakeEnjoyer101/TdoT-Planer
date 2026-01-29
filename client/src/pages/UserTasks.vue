<template>
  <div class="tasks-page">
    <!-- Animated Background -->
    <div class="bg-pattern">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>
    </div>

    <!-- Header Navigation -->
    <header class="page-header">
      <div class="header-container">
        <div class="header-actions">
          <button class="nav-btn" @click="goBack">
            <q-icon name="arrow_back" />
            <span>Zurück</span>
          </button>
          <button class="nav-btn logout" @click="logout">
            <q-icon name="logout" />
            <span>Abmelden</span>
          </button>
        </div>

        <div class="header-title">
          <h1>Meine Aufgaben</h1>
          <p>Übersicht deiner angemeldeten Aufgaben</p>
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

    <!-- Main Content Area -->
    <main class="page-main">
      <div class="content-wrapper">
        
        <!-- Student View -->
        <section v-if="user && user.klasse && user.klasse !== 'Admin' && user.klasse !== 'Lehrer'">
          <div class="section-title">
            <div class="title-icon">
              <q-icon name="assignment" />
            </div>
            <h2>Angemeldete Aufgaben</h2>
          </div>

          <!-- Empty State -->
          <div v-if="tasks.length === 0" class="empty-container">
            <div class="empty-content">
              <div class="empty-illustration">
                <q-icon name="inbox" />
              </div>
              <h3>Keine Aufgaben vorhanden</h3>
              <p>Du bist derzeit für keine Aufgaben angemeldet.</p>
              <button class="cta-button" @click="goBack">
                <q-icon name="add" />
                Aufgaben entdecken
              </button>
            </div>
          </div>

          <!-- Tasks List -->
          <div v-else class="tasks-container">
            <div v-for="task in tasks" :key="task.anmeldung_id" class="task-item">
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

        <!-- Teacher View -->
        <section v-else-if="user && user.klasse === 'Lehrer'">
          <div class="section-title">
            <div class="title-icon teacher">
              <q-icon name="school" />
            </div>
            <h2>Übernommene Aufgabe</h2>
          </div>

          <!-- Empty State -->
          <div v-if="tasks.length === 0" class="empty-container">
            <div class="empty-content">
              <div class="empty-illustration teacher">
                <q-icon name="assignment_turned_in" />
              </div>
              <h3>Keine Aufgabe übernommen</h3>
              <p>Sie haben derzeit keine Aufgabe übernommen.</p>
              <button class="cta-button" @click="goBack">
                <q-icon name="arrow_back" />
                Zur Übersicht
              </button>
            </div>
          </div>

          <!-- Teacher Dashboard -->
          <div v-else class="teacher-panel">
            <div v-for="task in tasks" :key="task.aufgabeid" class="task-management">
              
              <!-- Task Info Card -->
              <div class="task-info-card">
                <div class="task-info-content">
                  <h3>{{ task.titel }}</h3>
                  <p>{{ task.beschreibung }}</p>
                  <div class="task-details">
                    <span v-if="task.datum">
                      <q-icon name="event" /> {{ formatDate(task.datum) }}
                    </span>
                    <span v-if="task.uhrzeit">
                      <q-icon name="schedule" /> {{ formatTime(task.uhrzeit) }} Uhr
                    </span>
                  </div>
                </div>
                <div class="task-info-actions">
                  <button class="icon-btn refresh" @click="loadSchuelerForTask(task.aufgabeid)">
                    <q-icon name="refresh" />
                    <span>Aktualisieren</span>
                  </button>
                  <button class="icon-btn danger" @click="lehrerAbmelden">
                    <q-icon name="logout" />
                    <span>Abmelden</span>
                  </button>
                </div>
              </div>

              <!-- Students Management -->
              <div class="students-management">
                
                <!-- Pending Students -->
                <div class="student-group" v-if="getAllSchuelerForTask(task.aufgabeid).length > 0">
                  <div class="group-header">
                    <h4>
                      <q-icon name="people" />
                      Angemeldete Schüler
                      <span class="counter">{{ getAllSchuelerForTask(task.aufgabeid).length }}</span>
                    </h4>
                  </div>

                  <div class="student-grid">
                    <div v-for="schueler in getAllSchuelerForTask(task.aufgabeid)"
                         :key="schueler.anmeldung_id"
                         class="student-box"
                         :class="{'is-rejected': schueler.status === 'abgelehnt', 'is-confirmed': schueler.status === 'bestätigt'}">
                      
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
                        <span class="badge" :class="getStatusClass(schueler.status)">
                          {{ getStatusText(schueler.status) }}
                        </span>

                        <div class="control-btns" v-if="schueler.status === 'angemeldet'">
                          <button class="control-btn approve" @click="updateSchuelerStatus(schueler.anmeldung_id, 'bestätigt')">
                            <q-icon name="check" /> Bestätigen
                          </button>
                          <button class="control-btn decline" @click="updateSchuelerStatus(schueler.anmeldung_id, 'abgelehnt')">
                            <q-icon name="close" /> Ablehnen
                          </button>
                        </div>

                        <div class="control-btns" v-else-if="schueler.status === 'abgelehnt'">
                          <button class="control-btn approve" @click="updateSchuelerStatus(schueler.anmeldung_id, 'bestätigt')">
                            <q-icon name="check" /> Bestätigen
                          </button>
                          <button class="control-btn neutral" @click="updateSchuelerStatus(schueler.anmeldung_id, 'angemeldet')">
                            <q-icon name="replay" /> Zurücksetzen
                          </button>
                        </div>

                        <div class="control-btns" v-else-if="schueler.status === 'bestätigt'">
                          <button class="control-btn neutral" @click="updateSchuelerStatus(schueler.anmeldung_id, 'angemeldet')">
                            <q-icon name="replay" /> Zurücksetzen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Confirmed Students -->
                <div class="student-group confirmed" v-if="getConfirmedSchuelerForTask(task.aufgabeid).length > 0">
                  <div class="group-header">
                    <h4>
                      <q-icon name="verified" />
                      Bestätigte Schüler
                      <span class="counter success">{{ getConfirmedSchuelerForTask(task.aufgabeid).length }}</span>
                    </h4>
                  </div>

                  <div class="confirmed-grid">
                    <div v-for="schueler in getConfirmedSchuelerForTask(task.aufgabeid)"
                         :key="schueler.anmeldung_id"
                         class="confirmed-box">
                      
                      <div class="confirmed-top">
                        <div class="confirmed-avatar">
                          {{ schueler.name.charAt(0).toUpperCase() }}
                        </div>
                        <div class="confirmed-info">
                          <span class="confirmed-name">{{ schueler.name }}</span>
                          <span class="confirmed-class">{{ schueler.klasse }}</span>
                        </div>
                      </div>

                      <div class="time-display" v-if="schueler.zeitInfo">
                        <div class="time-block" v-if="schueler.zeitInfo.startzeit">
                          <span class="time-label">Start</span>
                          <span class="time-val">{{ formatTime(schueler.zeitInfo.startzeit) }}</span>
                        </div>
                        <div class="time-block" v-if="schueler.zeitInfo.endzeit">
                          <span class="time-label">Ende</span>
                          <span class="time-val">{{ formatTime(schueler.zeitInfo.endzeit) }}</span>
                        </div>
                        <div class="time-block highlight" v-if="schueler.zeitInfo.dauer">
                          <span class="time-label">Dauer</span>
                          <span class="time-val">{{ schueler.zeitInfo.dauer }} min</span>
                        </div>
                      </div>

                      <div class="confirmed-controls">
                        <div class="timer-btns">
                          <button v-if="!schueler.zeitInfo || !schueler.zeitInfo.startzeit"
                                  class="timer-action start"
                                  @click="startZeitErfassung(schueler.anmeldung_id)">
                            <q-icon name="play_arrow" /> Start
                          </button>
                          <button v-else-if="schueler.zeitInfo.startzeit && !schueler.zeitInfo.endzeit"
                                  class="timer-action stop"
                                  @click="stopZeitErfassung(schueler.anmeldung_id)">
                            <q-icon name="stop" /> Stop
                          </button>
                          <button v-else
                                  class="timer-action reset"
                                  @click="resetZeitErfassung(schueler.anmeldung_id)">
                            <q-icon name="replay" /> Reset
                          </button>
                        </div>
                        <button class="status-btn" @click="showStatusChangeDialog(schueler)">
                          <q-icon name="swap_horiz" /> Status
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- No Students -->
                <div v-if="getAllSchuelerForTask(task.aufgabeid).length === 0" class="no-data">
                  <q-icon name="group_off" />
                  <p>Noch keine Schüler angemeldet</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Admin View -->
        <section v-else-if="user && user.klasse === 'Admin'">
          <div class="section-title">
            <div class="title-icon admin">
              <q-icon name="admin_panel_settings" />
            </div>
            <h2>Admin Übersicht</h2>
          </div>

          <div class="empty-container">
            <div class="empty-content">
              <div class="empty-illustration admin">
                <q-icon name="admin_panel_settings" />
              </div>
              <h3>Admin Account</h3>
              <p>Als Admin hast du keine persönlichen Aufgaben.</p>
            </div>
          </div>
        </section>

      </div>
    </main>

    <!-- Status Change Modal -->
    <q-dialog v-model="statusChangeDialog" persistent>
      <div class="modal-container">
        <div class="modal-header">
          <h3>Status ändern</h3>
          <p>{{ selectedSchueler?.name }}</p>
        </div>

        <div class="modal-body">
          <button class="modal-option" @click="changeSchuelerStatus('angemeldet')">
            <div class="option-icon pending">
              <q-icon name="schedule" />
            </div>
            <div class="option-content">
              <span class="option-title">Nicht bestätigt</span>
              <span class="option-subtitle">Zurück zu angemeldeten Schülern</span>
            </div>
          </button>

          <button class="modal-option danger" @click="changeSchuelerStatus('abgelehnt')">
            <div class="option-icon danger">
              <q-icon name="close" />
            </div>
            <div class="option-content">
              <span class="option-title">Abmelden</span>
              <span class="option-subtitle">Von Aufgabe abmelden</span>
            </div>
          </button>
        </div>

        <div class="modal-footer">
          <button class="modal-cancel" @click="statusChangeDialog = false">
            Abbrechen
          </button>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
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
    default: return 'Ausstehend';
  }
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

onMounted(async () => {
  await loadUser();
  await loadTasks();
});

const goBack = () => {
  window.location.href = "http://localhost:9000/main";
};
</script>

<style scoped>
/* ============================================
   GLOBAL & RESET
   ============================================ */
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
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
  animation: float 20s ease-in-out infinite;
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

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9);
  }
}

/* ============================================
   HEADER
   ============================================ */
.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 14, 39, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0;
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
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.2);
}

.nav-btn.logout {
  background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%);
  border: none;
}

.nav-btn.logout:hover {
  box-shadow: 0 8px 24px rgba(255, 71, 87, 0.4);
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
  background-clip: text;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.header-title p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
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
  transition: all 0.3s ease;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(0, 212, 255, 0.3);
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
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.user-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.user-role {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
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

/* ============================================
   MAIN CONTENT
   ============================================ */
.page-main {
  position: relative;
  z-index: 1;
  padding: 48px 40px;
  min-height: calc(100vh - 100px);
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
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
}

.title-icon.teacher {
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  box-shadow: 0 8px 24px rgba(0, 245, 160, 0.3);
}

.title-icon.admin {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
}

.section-title h2 {
  font-size: 36px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.5px;
}

/* ============================================
   EMPTY STATE
   ============================================ */
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 40px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  backdrop-filter: blur(10px);
}

.empty-content {
  text-align: center;
  max-width: 500px;
}

.empty-illustration {
  width: 120px;
  height: 120px;
  margin: 0 auto 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 153, 255, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;
  color: rgba(0, 212, 255, 0.6);
}

.empty-illustration.teacher {
  background: linear-gradient(135deg, rgba(0, 245, 160, 0.15), rgba(0, 212, 170, 0.15));
  color: rgba(0, 245, 160, 0.6);
}

.empty-illustration.admin {
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 140, 66, 0.15));
  color: rgba(255, 107, 53, 0.6);
}

.empty-content h3 {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
}

.empty-content p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 32px;
  line-height: 1.6;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
}

.cta-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 212, 255, 0.5);
}

/* ============================================
   TASKS CONTAINER (STUDENT VIEW)
   ============================================ */
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
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #00d4ff, #00f5a0);
}

.task-item:hover {
  transform: translateY(-6px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 212, 255, 0.15);
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
  color: #ffffff;
  flex: 1;
  line-height: 1.3;
}

.badge {
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge.status-pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.badge.status-confirmed {
  background: rgba(0, 245, 160, 0.2);
  color: #00f5a0;
  border: 1px solid rgba(0, 245, 160, 0.3);
}

.badge.status-rejected {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  border: 1px solid rgba(255, 71, 87, 0.3);
}

.task-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.7;
  margin-bottom: 24px;
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
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}

.info-chip:hover {
  background: rgba(0, 0, 0, 0.4);
  color: #ffffff;
}

.info-chip .q-icon {
  color: #00d4ff;
  font-size: 18px;
}

/* ============================================
   TEACHER PANEL
   ============================================ */
.teacher-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.task-management {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.task-info-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 32px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(0, 245, 160, 0.05));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 32px;
}

.task-info-content h3 {
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 10px;
}

.task-info-content p {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 18px;
  line-height: 1.6;
  max-width: 700px;
}

.task-details {
  display: flex;
  gap: 24px;
}

.task-details span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.task-details .q-icon {
  color: #00d4ff;
}

.task-info-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.icon-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-btn:hover {
  transform: translateY(-3px);
}

.icon-btn.refresh {
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  border: none;
}

.icon-btn.refresh:hover {
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);
}

.icon-btn.danger {
  background: rgba(255, 71, 87, 0.1);
  border-color: rgba(255, 71, 87, 0.3);
  color: #ff4757;
}

.icon-btn.danger:hover {
  background: rgba(255, 71, 87, 0.2);
  box-shadow: 0 10px 30px rgba(255, 71, 87, 0.3);
}

/* ============================================
   STUDENTS MANAGEMENT
   ============================================ */
.students-management {
  padding: 0;
}

.student-group {
  padding: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.student-group:last-child {
  border-bottom: none;
}

.group-header {
  margin-bottom: 24px;
}

.group-header h4 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.counter {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.7);
}

.counter.success {
  background: rgba(0, 245, 160, 0.2);
  color: #00f5a0;
}

.student-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.student-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.student-box:hover {
  background: rgba(0, 0, 0, 0.35);
  border-color: rgba(0, 212, 255, 0.3);
}

.student-box.is-rejected {
  border-left: 4px solid #ff4757;
  background: rgba(255, 71, 87, 0.05);
}

.student-box.is-confirmed {
  border-left: 4px solid #00f5a0;
  background: rgba(0, 245, 160, 0.05);
}

.student-profile {
  display: flex;
  align-items: center;
  gap: 18px;
}

.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.profile-data {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.profile-name {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
}

.profile-email {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.profile-class {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.profile-timestamp {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 4px;
}

.student-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
}

.control-btns {
  display: flex;
  gap: 10px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.control-btn.approve {
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  color: #0a0e27;
}

.control-btn.approve:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(0, 245, 160, 0.4);
}

.control-btn.decline {
  background: linear-gradient(135deg, #ff4757, #ff6348);
  color: #ffffff;
}

.control-btn.decline:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(255, 71, 87, 0.4);
}

.control-btn.neutral {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.neutral:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
}

/* ============================================
   CONFIRMED STUDENTS GRID
   ============================================ */
.confirmed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 18px;
}

.confirmed-box {
  background: linear-gradient(135deg, rgba(0, 245, 160, 0.08), rgba(0, 212, 255, 0.05));
  border: 1px solid rgba(0, 245, 160, 0.2);
  border-radius: 18px;
  padding: 24px;
  transition: all 0.3s ease;
}

.confirmed-box:hover {
  border-color: rgba(0, 245, 160, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 245, 160, 0.2);
}

.confirmed-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.confirmed-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  color: #0a0e27;
  box-shadow: 0 4px 12px rgba(0, 245, 160, 0.3);
}

.confirmed-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.confirmed-name {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.confirmed-class {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.time-display {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12px;
}

.time-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-block.highlight {
  margin-left: auto;
  text-align: right;
}

.time-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 700;
}

.time-val {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.confirmed-controls {
  display: flex;
  gap: 10px;
}

.timer-btns {
  display: flex;
  gap: 8px;
}

.timer-action {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.timer-action.start {
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  color: #0a0e27;
}

.timer-action.stop {
  background: linear-gradient(135deg, #ff4757, #ff6348);
  color: #ffffff;
}

.timer-action.reset {
  background: linear-gradient(135deg, #ffc107, #ff9800);
  color: #0a0e27;
}

.timer-action:hover {
  transform: translateY(-3px);
}

.status-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: auto;
}

.status-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
}

/* ============================================
   NO DATA STATE
   ============================================ */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: rgba(255, 255, 255, 0.3);
}

.no-data .q-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.4;
}

.no-data p {
  font-size: 16px;
  font-weight: 500;
}

/* ============================================
   MODAL
   ============================================ */
.modal-container {
  background: linear-gradient(135deg, #1a1f3a, #0a0e27);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  width: 460px;
  max-width: 92vw;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 28px 32px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 245, 160, 0.05));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}

.modal-header p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-option {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
}

.modal-option:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(0, 212, 255, 0.4);
  transform: translateX(6px);
}

.modal-option.danger:hover {
  border-color: rgba(255, 71, 87, 0.4);
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.option-icon.pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.option-icon.danger {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.option-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.option-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.modal-cancel {
  padding: 12px 28px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-cancel:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */
@media (max-width: 1200px) {
  .header-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .header-actions {
    justify-content: center;
  }

  .header-user {
    justify-content: center;
  }

  .tasks-container {
    grid-template-columns: 1fr;
  }

  .task-info-card {
    flex-direction: column;
  }

  .task-info-actions {
    width: 100%;
    justify-content: flex-start;
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

  .nav-btn span {
    display: none;
  }

  .nav-btn {
    padding: 12px;
  }

  .section-title h2 {
    font-size: 28px;
  }

  .student-box {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .student-controls {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }

  .confirmed-grid {
    grid-template-columns: 1fr;
  }

  .confirmed-controls {
    flex-wrap: wrap;
  }
}
</style>