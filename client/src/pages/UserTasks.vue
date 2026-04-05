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

          <div class="student-day-columns">
            <div
              v-for="day in eventDays"
              :key="day.value"
              class="student-day-panel"
            >
              <div class="day-panel-header">
                <div>
                  <h3>{{ day.label }}</h3>
                  <p>{{ day.timeLabel }}</p>
                </div>
                <span class="counter">{{
                  isDayExcused(day.value)
                    ? "E"
                    : getStudentTasksForDay(day.value).length
                }}</span>
              </div>

              <div
                v-if="isDayExcused(day.value)"
                class="day-empty excuse-state"
              >
                <q-icon name="event_busy" />
                <div>
                  <strong>Entschuldigt</strong>
                  <p>Du bist für {{ day.shortLabel }} offiziell entschuldigt.</p>
                </div>
              </div>

              <div
                v-else-if="getStudentTasksForDay(day.value).length === 0"
                class="day-empty"
              >
                Noch keine Aufgabe für {{ day.shortLabel }}.
              </div>

              <div v-else class="day-task-list">
                <div
                  v-for="task in getStudentTasksForDay(day.value)"
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
                    <div class="info-chip">
                      <q-icon name="event" />
                      <span>{{ getTaskDateForDay(task, day.value) }}</span>
                    </div>
                    <div class="info-chip" v-if="getTaskTimeForDay(task, day.value)">
                      <q-icon name="schedule" />
                      <span>{{ getTaskTimeForDay(task, day.value) }} Uhr</span>
                    </div>
                    <div class="info-chip" v-if="getTeacherLabel(task)">
                      <q-icon name="school" />
                      <span>{{ getTeacherLabel(task) }}</span>
                    </div>
                    <div class="info-chip">
                      <q-icon name="access_time" />
                      <span>{{ formatDateTime(task.angemeldet_am) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="
              !isDayExcused(2) &&
              (tasks.length > 0 || studentAvailableTaskOptions.length > 0)
            "
            class="tag2-switch-card"
          >
            <div class="group-header">
              <h4>
                <q-icon name="swap_horiz" />
                Tag 2 auf andere Aufgabe umstellen
              </h4>
            </div>

            <p class="tag2-switch-text">
              Die erste Anmeldung gilt für beide Tage. Hier kannst du später nur
              den Samstag auf eine andere Aufgabe legen.
            </p>

            <div class="tag2-switch-grid">
              <div class="tag2-current">
                <span class="tag2-label">Aktuell eingeteilt</span>
                <strong>{{
                  currentTag2Task ? currentTag2Task.titel : "Noch keine Aufgabe"
                }}</strong>
              </div>

              <q-select
                v-model="selectedTag2TaskId"
                :options="studentAvailableTaskOptions"
                emit-value
                map-options
                outlined
                dark
                options-dark
                color="cyan"
                label="Neue Aufgabe für Tag 2"
                class="tag2-select app-select"
                popup-content-class="app-select-menu"
                options-selected-class="app-select-option--selected"
              />

              <button
                class="cta-button tag2-button"
                :disabled="!canChangeTag2"
                @click="tag2AufgabeAendern"
              >
                <q-icon name="event_repeat" />
                Tag 2 ändern
              </button>
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
                    <span>
                      <q-icon name="event" />
                      Tag 1: {{ getTaskDateForDay(task, 1) }}
                    </span>
                    <span v-if="getTaskTimeForDay(task, 1)">
                      <q-icon name="schedule" />
                      {{ getTaskTimeForDay(task, 1) }} Uhr
                    </span>
                    <span>
                      <q-icon name="event" />
                      Tag 2: {{ getTaskDateForDay(task, 2) }}
                    </span>
                    <span v-if="getTaskTimeForDay(task, 2)">
                      <q-icon name="schedule" />
                      {{ getTaskTimeForDay(task, 2) }} Uhr
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
                <div class="teacher-day-columns">
                  <div
                    v-for="day in eventDays"
                    :key="day.value"
                    class="teacher-day-panel"
                  >
                    <div class="group-header teacher-day-header">
                      <h4>
                        <q-icon name="event" />
                        {{ day.label }}
                        <span class="counter">{{
                          getSchuelerForTaskAndDay(task.aufgabeid, day.value)
                            .length
                        }}</span>
                      </h4>
                      <p>
                        {{ getTaskDateForDay(task, day.value) }}
                        <span v-if="getTaskTimeForDay(task, day.value)">
                          , {{ getTaskTimeForDay(task, day.value) }} Uhr
                        </span>
                      </p>
                    </div>

                    <div
                      v-if="
                        getSchuelerForTaskAndDay(task.aufgabeid, day.value)
                          .length === 0
                      "
                      class="no-data day-no-data"
                    >
                      <q-icon name="group_off" />
                      <p>Noch keine Schüler für {{ day.shortLabel }}</p>
                    </div>

	                    <div v-else class="student-grid">
	                      <div
	                        v-for="schueler in getSchuelerForTaskAndDay(
                          task.aufgabeid,
                          day.value
                        )"
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
	                          <div class="status-stack">
	                            <span class="badge status-confirmed">Angemeldet</span>
	                            <span
	                              class="badge attendance-badge"
	                              :class="getAttendanceBadgeClass(schueler)"
	                            >
	                              {{ getAttendanceText(schueler) }}
	                            </span>
	                          </div>
	                          <span
	                            v-if="schueler.anwesend && schueler.anwesend_am"
	                            class="attendance-meta"
	                          >
	                            Erfasst: {{ formatDateTime(schueler.anwesend_am) }}
	                          </span>
	                          <button
	                            class="control-btn attendance"
	                            :class="{ active: schueler.anwesend }"
	                            :disabled="isAttendanceUpdating(schueler.anmeldung_id)"
	                            @click="
	                              schuelerAnwesenheitSetzen(
	                                schueler.anmeldung_id,
	                                task.aufgabeid,
	                                !schueler.anwesend
	                              )
	                            "
	                          >
	                            <q-icon
	                              :name="schueler.anwesend ? 'undo' : 'how_to_reg'"
	                            />
	                            {{
	                              schueler.anwesend
	                                ? 'Anwesenheit zurücksetzen'
	                                : 'Anwesend markieren'
	                            }}
	                          </button>
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
          </div>
        </section>

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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import { EVENT_DAYS, getTeacherLabel } from "src/utils/eventDays";

const user = ref(null);
const tasks = ref([]);
const schuelerListen = ref({});
const alleAufgaben = ref([]);
const selectedTag2TaskId = ref(null);
const studentExcusedDays = ref([]);
const attendanceUpdatingIds = ref([]);

const eventDays = EVENT_DAYS;

const currentTag2Task = computed(
  () => tasks.value.find((task) => Number(task.event_day) === 2) || null
);

const studentAvailableTaskOptions = computed(() => {
  const klasse = String(user.value?.klasse || "").toLowerCase();
  if (
    !klasse ||
    klasse === "keine klasse" ||
    klasse === "admin" ||
    klasse === "lehrer" ||
    klasse.startsWith("1") ||
    klasse.startsWith("5")
  ) {
    return [];
  }

  return alleAufgaben.value
    .filter((task) => {
      const zielKlassen = Array.isArray(task.ziel_klassen)
        ? task.ziel_klassen
        : [];

      return zielKlassen.some((ziel) =>
        klasse.includes(String(ziel).toLowerCase())
      );
    })
    .map((task) => ({
      label: `${task.titel} (${getTaskDateForDay(task, 2)}${
        getTaskTimeForDay(task, 2) ? `, ${getTaskTimeForDay(task, 2)} Uhr` : ""
      })`,
      value: task.aufgabeid,
    }));
});

const canChangeTag2 = computed(
  () =>
    !studentExcusedDays.value.includes(2) &&
    selectedTag2TaskId.value !== null &&
    selectedTag2TaskId.value !== currentTag2Task.value?.aufgabeid
);

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
    if (user.value.klasse === "Lehrer") {
      const res = await axios.get("http://localhost:3000/user/aufgaben", {
        withCredentials: true,
      });

      tasks.value = Array.isArray(res.data) ? res.data : [];

      for (const task of tasks.value) {
        await loadSchuelerForTask(task.aufgabeid);
      }
    } else if (user.value.klasse === "Admin") {
      tasks.value = [];
      studentExcusedDays.value = [];
    } else {
      await Promise.all([loadStudentSchedule(), loadAlleAufgaben()]);
    }
  } catch (err) {
    console.error(err);
    tasks.value = [];
    studentExcusedDays.value = [];
  }
};

const loadStudentSchedule = async () => {
  try {
    const res = await axios.get("http://localhost:3000/user/schedule", {
      withCredentials: true,
    });

    tasks.value = Array.isArray(res.data?.assignments) ? res.data.assignments : [];
    studentExcusedDays.value = Array.isArray(res.data?.excused_days)
      ? res.data.excused_days.map((day) => Number(day))
      : [];
    syncSelectedTag2Task();
  } catch (err) {
    console.error("Fehler beim Laden des Schülerplans:", err);
    tasks.value = [];
    studentExcusedDays.value = [];
  }
};

const loadAlleAufgaben = async () => {
  try {
    const res = await axios.get("http://localhost:3000/aufgaben", {
      withCredentials: true,
    });
    alleAufgaben.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Fehler beim Laden aller Aufgaben:", err);
    alleAufgaben.value = [];
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
    console.error("Fehler beim Laden der Schüler:", err);
    schuelerListen.value[aufgabeid] = [];
  }
};

const getSchuelerForTask = (aufgabeid) => {
  return schuelerListen.value[aufgabeid] || [];
};

const getSchuelerForTaskAndDay = (aufgabeid, eventDay) => {
  return getSchuelerForTask(aufgabeid).filter(
    (schueler) => Number(schueler.event_day) === eventDay
  );
};

const updateSchuelerInTaskList = (aufgabeid, anmeldungId, updatedFields) => {
  schuelerListen.value[aufgabeid] = getSchuelerForTask(aufgabeid).map(
    (schueler) =>
      schueler.anmeldung_id === anmeldungId
        ? { ...schueler, ...updatedFields }
        : schueler
  );
};

const isAttendanceUpdating = (anmeldungId) =>
  attendanceUpdatingIds.value.includes(anmeldungId);

const getStudentTasksForDay = (eventDay) => {
  return tasks.value.filter((task) => Number(task.event_day) === eventDay);
};

const isDayExcused = (eventDay) =>
  studentExcusedDays.value.includes(Number(eventDay));

const syncSelectedTag2Task = () => {
  const tag2Task = tasks.value.find((task) => Number(task.event_day) === 2);
  selectedTag2TaskId.value = tag2Task ? tag2Task.aufgabeid : null;
};

const tag2AufgabeAendern = async () => {
  if (!selectedTag2TaskId.value) {
    return;
  }

  try {
    await axios.post(
      `http://localhost:3000/aufgaben/${selectedTag2TaskId.value}/anmelden`,
      { event_day: 2 },
      { withCredentials: true }
    );

    await loadStudentSchedule();
  } catch (err) {
    alert(err.response?.data?.error || "Fehler beim Umstellen von Tag 2");
  }
};

const schuelerAnwesenheitSetzen = async (anmeldungId, aufgabeid, anwesend) => {
  if (isAttendanceUpdating(anmeldungId)) {
    return;
  }

  attendanceUpdatingIds.value = [...attendanceUpdatingIds.value, anmeldungId];

  try {
    const res = await axios.patch(
      `http://localhost:3000/anmeldungen/${anmeldungId}/anwesenheit`,
      { anwesend },
      { withCredentials: true }
    );

    updateSchuelerInTaskList(aufgabeid, anmeldungId, {
      anwesend: Boolean(res.data?.anmeldung?.anwesend),
      anwesend_am: res.data?.anmeldung?.anwesend_am || null,
    });
  } catch (err) {
    alert(
      err.response?.data?.error || "Fehler beim Speichern der Anwesenheit"
    );
  } finally {
    attendanceUpdatingIds.value = attendanceUpdatingIds.value.filter(
      (id) => id !== anmeldungId
    );
  }
};

const schuelerAbmelden = async (anmeldungId, aufgabeid) => {
  if (!confirm("Schüler wirklich von dieser Aufgabe abmelden?")) {
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
    console.error("Fehler beim Abmelden des Schülers:", err);
    alert(err.response?.data?.error || "Fehler beim Abmelden des Schülers");
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

const getTaskDateForDay = (task, eventDay) => {
  const dateString = task[`tag${eventDay}_datum`] || task.datum;
  return formatDate(dateString);
};

const getTaskTimeForDay = (task, eventDay) => {
  const timeString = task[`tag${eventDay}_uhrzeit`] || task.uhrzeit;
  return formatTime(timeString);
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

const getAttendanceText = (schueler) =>
  schueler?.anwesend ? "Anwesend" : "Noch offen";

const getAttendanceBadgeClass = (schueler) =>
  schueler?.anwesend ? "status-present" : "status-pending";

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
  background: var(--app-bg-gradient);
  color: var(--text-primary);
  font-family: var(--font-sans);
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
  opacity: 0.12;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, rgba(47, 111, 219, 0.85), rgba(31, 88, 185, 0.72));
  top: -200px;
  left: -200px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, rgba(201, 135, 55, 0.68), rgba(143, 93, 43, 0.58));
  bottom: -150px;
  right: -150px;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, rgba(43, 136, 120, 0.7), rgba(28, 97, 87, 0.62));
  top: 40%;
  right: 10%;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(8, 17, 31, 0.84);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-soft);
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
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.nav-btn.logout {
  background: linear-gradient(145deg, var(--accent-danger), var(--accent-danger-strong));
  border: none;
}

.header-title {
  text-align: center;
}

.header-title h1 {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(145deg, #f8fbff 0%, #c7dbf8 45%, #78a5e8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-title p {
  font-size: 14px;
  color: var(--text-muted);
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
  border: 1px solid var(--border-soft);
  border-radius: 50px;
}

.user-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--accent-primary), var(--accent-primary-strong));
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
  background: linear-gradient(145deg, var(--accent-warm), #aa6f29);
  color: #ffffff;
}

.role-teacher {
  background: linear-gradient(145deg, var(--accent-secondary), #1c6157);
  color: #ffffff;
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
  background: linear-gradient(145deg, var(--accent-primary), var(--accent-primary-strong));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.title-icon.teacher {
  background: linear-gradient(145deg, var(--accent-secondary), #1c6157);
}

.title-icon.admin {
  background: linear-gradient(145deg, var(--accent-warm), #aa6f29);
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
  background: rgba(var(--accent-primary-rgb), 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;
}

.empty-illustration.teacher {
  background: rgba(var(--accent-secondary-rgb), 0.16);
}

.empty-illustration.admin {
  background: rgba(var(--accent-warm-rgb), 0.16);
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
  background: linear-gradient(145deg, var(--accent-primary), var(--accent-primary-strong));
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

.student-day-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.student-day-panel,
.teacher-day-panel,
.tag2-switch-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-soft);
  border-radius: 24px;
  padding: 24px;
}

.day-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.day-panel-header h3 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.day-panel-header p {
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
}

.day-empty {
  padding: 20px;
  border-radius: 12px;
  background: rgba(7, 17, 31, 0.42);
  color: var(--text-muted);
  text-align: center;
}

.day-empty.excuse-state {
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  background: rgba(196, 79, 89, 0.14);
  color: rgba(255, 255, 255, 0.82);
}

.day-empty.excuse-state .q-icon {
  font-size: 28px;
  color: #ffb5bc;
}

.day-empty.excuse-state strong {
  display: block;
  margin-bottom: 4px;
  color: #ffffff;
}

.day-empty.excuse-state p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  line-height: 1.5;
}

.day-task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-soft);
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
  background: rgba(52, 154, 107, 0.18);
  color: #8de0b6;
}

.badge.status-rejected {
  background: rgba(196, 79, 89, 0.18);
  color: #ffb5bc;
}

.badge.status-present {
  background: rgba(52, 154, 107, 0.2);
  color: #a8e7c6;
}

.badge.status-pending {
  background: rgba(var(--accent-warm-rgb), 0.16);
  color: #f2d0a7;
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
  background: rgba(5, 13, 24, 0.32);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px solid var(--border-soft);
}

.teacher-panel {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.teacher-day-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.teacher-day-header {
  margin-bottom: 18px;
}

.teacher-day-header p {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
}

.task-management {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-soft);
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
    145deg,
    rgba(16, 34, 56, 0.92),
    rgba(22, 48, 84, 0.88)
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
  background: linear-gradient(145deg, var(--accent-primary), var(--accent-primary-strong));
  color: #ffffff;
}

.icon-btn.danger {
  background: rgba(196, 79, 89, 0.15);
  color: #ffb5bc;
  border: 1px solid rgba(196, 79, 89, 0.35);
}

.students-management {
  padding: 28px;
}

.tag2-switch-card {
  margin-top: 24px;
}

.tag2-switch-text {
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
  margin-bottom: 20px;
}

.tag2-switch-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr auto;
  gap: 16px;
  align-items: end;
}

.tag2-current {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(7, 17, 31, 0.42);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag2-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.tag2-current strong {
  color: #ffffff;
}

.tag2-select {
  width: 100%;
}

.tag2-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  background: rgba(255, 255, 255, 0.08);
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
  border: 1px solid var(--border-soft);
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
  background: linear-gradient(145deg, var(--accent-primary), var(--accent-primary-strong));
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

.status-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.attendance-meta {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.52);
  text-align: right;
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

.control-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.control-btn.attendance {
  background: linear-gradient(145deg, var(--accent-secondary), #1c6157);
  color: #ffffff;
}

.control-btn.attendance.active {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-soft);
  color: var(--text-primary);
}

.control-btn.decline {
  background: linear-gradient(145deg, var(--accent-danger), var(--accent-danger-strong));
  color: #ffffff;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 70px 20px;
  color: var(--text-muted);
}

.no-data .q-icon {
  font-size: 56px;
  margin-bottom: 14px;
}

:deep(.q-field--outlined .q-field__control) {
  background: rgba(7, 17, 31, 0.64);
  border-color: var(--border-strong);
  color: #ffffff;
}

:deep(.q-field__label),
:deep(.q-field__input),
:deep(.q-field__native),
:deep(.q-field__input span),
:deep(.q-field__marginal),
:deep(.q-select__dropdown-icon) {
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.q-menu) {
  background: rgba(10, 22, 38, 0.98);
  color: #ffffff;
  border: 1px solid var(--border-soft);
}

:deep(.q-menu .q-item),
:deep(.q-menu .q-item__label) {
  color: #ffffff !important;
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

  .student-day-columns,
  .teacher-day-columns,
  .tag2-switch-grid {
    grid-template-columns: 1fr;
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
