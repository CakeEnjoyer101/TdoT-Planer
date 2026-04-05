<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import axios from "axios";
import {
  EVENT_DAYS,
  getEventDayConfig,
  getTaskDateForDay,
  getTaskTimeForDay,
} from "../utils/eventDays";

const createTaskForm = ref(null);
const titel = ref("");
const beschreibung = ref("");
const tag1Datum = ref("");
const tag1Uhrzeit = ref("");
const tag2Datum = ref("");
const tag2Uhrzeit = ref("");
const lehrerid = ref(null);
const zielKlassen = ref([]);

const lehrerAccounts = ref([]);
const aufgaben = ref([]);
const zuweisungen = ref({});
const studentOverview = ref({
  students: [],
  missing_registrations: [],
});
const studentSearch = ref("");
const savingStudentIds = ref([]);

const klassenOptions = [
  "1AHIT",
  "1BHIT",
  "1CHIT",
  "1AFITN",
  "1BFITN",
  "2AHIT",
  "2BHIT",
  "2CHIT",
  "2AFITN",
  "2BFITN",
  "3AHIT",
  "3BHIT",
  "3CHIT",
  "3AFITN",
  "3BFITN",
  "4AHITN",
  "4CHITM",
  "4BHITM",
  "4AFITN",
  "4BFITN",
  "5AHITN",
  "5BHITM",
  "5CHITM",
];

const klassenSelectOptions = computed(() =>
  klassenOptions.map((klasse) => ({
    label: klasse,
    value: klasse,
  })),
);

const lehrerOptions = computed(() => [
  { label: "Kein Lehrer zugewiesen", value: null },
  ...lehrerAccounts.value.map((lehrer) => ({
    label: `${lehrer.name} (${lehrer.email})`,
    value: lehrer.lehrerid,
  })),
]);

const aufgabeOptions = computed(() => [
  { label: "Keine Aufgabe", value: null },
  ...aufgaben.value.map((aufgabe) => ({
    label: formatTaskOptionLabel(aufgabe),
    value: aufgabe.aufgabeid,
  })),
]);

const students = computed(() => studentOverview.value.students || []);
const filteredStudents = computed(() => {
  const query = normalizeSearchText(studentSearch.value);

  if (!query) {
    return students.value;
  }

  return students.value.filter((student) =>
    [student.name, student.email, student.klasse].some((value) =>
      normalizeSearchText(value).includes(query),
    ),
  );
});
const missingRegistrations = computed(
  () => studentOverview.value.missing_registrations || [],
);

onMounted(async () => {
  try {
    const response = await axios.get("http://localhost:3000/auth/profile", {
      withCredentials: true,
    });

    if (response.data.user.klasse !== "Admin") {
      alert(
        "Zugriff verweigert: Nur Administratoren dürfen diese Seite aufrufen.",
      );
      window.location.href = "http://localhost:9000/main";
      return;
    }

    await Promise.all([
      loadLehrerAccounts(),
      loadAufgaben(),
      loadStudentOverview(),
    ]);
    syncLehrerZuweisungen();
  } catch (error) {
    console.error("Fehler beim Überprüfen der Admin-Berechtigung:", error);
    alert("Fehler bei der Authentifizierung. Bitte erneut einloggen.");
    window.location.href = "http://localhost:9000/";
  }
});

async function loadLehrerAccounts() {
  const response = await axios.get("http://localhost:3000/admin/lehrer", {
    withCredentials: true,
  });
  lehrerAccounts.value = Array.isArray(response.data) ? response.data : [];
}

async function loadAufgaben() {
  const response = await axios.get("http://localhost:3000/aufgaben", {
    withCredentials: true,
  });
  aufgaben.value = Array.isArray(response.data) ? response.data : [];
}

async function loadStudentOverview() {
  const response = await axios.get(
    "http://localhost:3000/admin/schueler/overview",
    {
      withCredentials: true,
    },
  );
  studentOverview.value = response.data || {
    students: [],
    missing_registrations: [],
  };
}

function syncLehrerZuweisungen() {
  const mapping = {};

  for (const lehrer of lehrerAccounts.value) {
    const ersteAufgabe = aufgaben.value.find((aufgabe) =>
      Array.isArray(aufgabe.lehrer_ids)
        ? aufgabe.lehrer_ids.includes(lehrer.lehrerid)
        : aufgabe.lehrerid === lehrer.lehrerid,
    );

    mapping[lehrer.lehrerid] = ersteAufgabe ? ersteAufgabe.aufgabeid : null;
  }

  zuweisungen.value = mapping;
}

async function refreshDashboardData() {
  await Promise.all([loadAufgaben(), loadStudentOverview()]);
  syncLehrerZuweisungen();
}

async function submit() {
  try {
    const normalizedZielKlassen = Array.from(
      new Set(
        zielKlassen.value
          .map((klasse) => String(klasse || "").trim())
          .filter(Boolean),
      ),
    );

    const payload = {
      titel: titel.value,
      beschreibung: beschreibung.value,
      tag1_datum: tag1Datum.value,
      tag1_uhrzeit: normalizeTimeValue(tag1Uhrzeit.value),
      tag2_datum: tag2Datum.value,
      tag2_uhrzeit: normalizeTimeValue(tag2Uhrzeit.value),
      lehrerid: lehrerid.value,
      ziel_klassen: normalizedZielKlassen,
    };

    await axios.post("http://localhost:3000/aufgaben", payload, {
      withCredentials: true,
    });

    alert("Aufgabe erfolgreich erstellt.");

    titel.value = "";
    beschreibung.value = "";
    tag1Datum.value = "";
    tag1Uhrzeit.value = "";
    tag2Datum.value = "";
    tag2Uhrzeit.value = "";
    lehrerid.value = null;
    zielKlassen.value = [];

    await nextTick();
    createTaskForm.value?.resetValidation();

    await refreshDashboardData();
  } catch (err) {
    if (err.response?.status === 403) {
      alert("Fehler: Keine Admin-Berechtigung für diese Aktion");
      window.location.href = "http://localhost:9000/main";
    } else {
      alert("Fehler: " + (err.response?.data?.error || err.message));
    }
  }
}

async function lehrerAufgabeSpeichern(lehrerId) {
  const zielAufgabeId = zuweisungen.value[lehrerId] ?? null;

  try {
    await axios.put(
      `http://localhost:3000/admin/lehrer/${lehrerId}/aufgabe`,
      { aufgabeid: zielAufgabeId },
      { withCredentials: true },
    );

    await loadAufgaben();
    syncLehrerZuweisungen();
  } catch (err) {
    alert("Fehler: " + (err.response?.data?.error || err.message));
    await loadAufgaben();
    syncLehrerZuweisungen();
  }
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("de-DE");
}

function formatTime(timeString) {
  if (!timeString) return "";
  return String(timeString).substring(0, 5);
}

function normalizeTimeValue(timeString) {
  if (!timeString) return "";

  const normalizedTime = String(timeString).trim();

  if (/^\d{2}:\d{2}:\d{2}$/.test(normalizedTime)) {
    return normalizedTime;
  }

  if (/^\d{2}:\d{2}$/.test(normalizedTime)) {
    return `${normalizedTime}:00`;
  }

  return normalizedTime;
}

function formatTaskOptionLabel(task) {
  const tag1 = `${formatDate(getTaskDateForDay(task, 1))}${
    getTaskTimeForDay(task, 1)
      ? `, ${formatTime(getTaskTimeForDay(task, 1))} Uhr`
      : ""
  }`;
  const tag2 = `${formatDate(getTaskDateForDay(task, 2))}${
    getTaskTimeForDay(task, 2)
      ? `, ${formatTime(getTaskTimeForDay(task, 2))} Uhr`
      : ""
  }`;

  return `${task.titel} (Tag 1: ${tag1} | Tag 2: ${tag2})`;
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLocaleLowerCase("de-AT")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getAssignmentForDay(student, eventDay) {
  return student?.assignments_by_day?.[eventDay] || null;
}

function isDayExcused(student, eventDay) {
  return Array.isArray(student?.excused_days)
    ? student.excused_days.includes(eventDay)
    : false;
}

function isSavingStudent(studentId) {
  return savingStudentIds.value.includes(studentId);
}

async function toggleExcuseDay(student, eventDay) {
  const currentDays = Array.isArray(student.excused_days)
    ? [...student.excused_days]
    : [];
  const daySet = new Set(currentDays);

  if (daySet.has(eventDay)) {
    daySet.delete(eventDay);
  } else {
    daySet.add(eventDay);
  }

  await saveExcusedDays(student.userid, Array.from(daySet).sort());
}

async function saveExcusedDays(studentId, eventDays) {
  savingStudentIds.value = [...savingStudentIds.value, studentId];

  try {
    await axios.put(
      `http://localhost:3000/admin/schueler/${studentId}/entschuldigungen`,
      { eventDays },
      { withCredentials: true },
    );

    await loadStudentOverview();
  } catch (err) {
    alert("Fehler: " + (err.response?.data?.error || err.message));
  } finally {
    savingStudentIds.value = savingStudentIds.value.filter(
      (id) => id !== studentId,
    );
  }
}

function getMissingDaysLabel(student) {
  if (!Array.isArray(student?.missing_days) || student.missing_days.length === 0) {
    return "Alles erledigt";
  }

  return student.missing_days
    .map((eventDay) => getEventDayConfig(eventDay).label)
    .join(", ");
}

function goBack() {
  window.location.href = "http://localhost:9000/main";
}
</script>

<template>
  <div class="admin-page">
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <header class="admin-header">
      <div class="header-content">
        <div class="header-icon">
          <q-icon name="admin_panel_settings" />
        </div>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Aufgabenverwaltung, Lehrer-Zuweisung und Schülerstatus</p>
        </div>
      </div>
    </header>

    <main class="admin-main">
      <div class="admin-container">
        <div class="admin-grid">
          <div class="task-card">
            <div class="card-header">
              <q-icon name="add_task" />
              <h2>Neue Aufgabe erstellen</h2>
            </div>

            <q-form
              ref="createTaskForm"
              @submit.prevent="submit"
              class="task-form"
            >
              <q-input
                v-model="titel"
                label="Titel *"
                outlined
                color="cyan"
                placeholder="Titel der Aufgabe eingeben"
                :rules="[(val) => !!val || 'Titel ist erforderlich']"
                class="form-input"
              />

              <q-input
                v-model="beschreibung"
                label="Beschreibung"
                type="textarea"
                outlined
                color="cyan"
                placeholder="Beschreibung der Aufgabe (optional)"
                rows="3"
                class="form-input"
              />

              <div class="day-block">
                <div class="day-block-header">
                  <span class="day-pill">Tag 1</span>
                  <span class="day-subtitle">Freitag</span>
                </div>
                <div class="form-row">
                  <q-input
                    v-model="tag1Datum"
                    type="date"
                    label="Datum *"
                    outlined
                    stack-label
                    color="cyan"
                    :rules="[(val) => !!val || 'Datum ist erforderlich']"
                    class="form-input picker-native-input"
                  />

                  <q-input
                    v-model="tag1Uhrzeit"
                    type="time"
                    step="60"
                    label="Uhrzeit *"
                    outlined
                    stack-label
                    color="cyan"
                    :rules="[(val) => !!val || 'Uhrzeit ist erforderlich']"
                    class="form-input picker-native-input"
                  />
                </div>
              </div>

              <div class="day-block">
                <div class="day-block-header">
                  <span class="day-pill alt">Tag 2</span>
                  <span class="day-subtitle">Samstag</span>
                </div>
                <div class="form-row">
                  <q-input
                    v-model="tag2Datum"
                    type="date"
                    label="Datum *"
                    outlined
                    stack-label
                    color="cyan"
                    :rules="[(val) => !!val || 'Datum ist erforderlich']"
                    class="form-input picker-native-input"
                  />

                  <q-input
                    v-model="tag2Uhrzeit"
                    type="time"
                    step="60"
                    label="Uhrzeit *"
                    outlined
                    stack-label
                    color="cyan"
                    :rules="[(val) => !!val || 'Uhrzeit ist erforderlich']"
                    class="form-input picker-native-input"
                  />
                </div>
              </div>

              <q-select
                v-model="lehrerid"
                :options="lehrerOptions"
                emit-value
                map-options
                outlined
                dark
                options-dark
                color="cyan"
                label="Lehrer (optional)"
                class="form-input app-select"
                popup-content-class="app-select-menu"
                options-selected-class="app-select-option--selected"
              />

              <q-select
                v-model="zielKlassen"
                :options="klassenSelectOptions"
                outlined
                dark
                options-dark
                color="cyan"
                label="Zielklassen *"
                class="form-input app-select"
                multiple
                use-chips
                emit-value
                map-options
                hint="Wähle eine oder mehrere Klassen"
                popup-content-class="app-select-menu"
                options-selected-class="app-select-option--selected"
                :rules="[
                  (val) =>
                    (Array.isArray(val) && val.length > 0) ||
                    'Mindestens eine Klasse ist erforderlich',
                ]"
              />

              <button
                type="submit"
                class="submit-btn"
                :disabled="
                  !titel ||
                  !tag1Datum ||
                  !tag1Uhrzeit ||
                  !tag2Datum ||
                  !tag2Uhrzeit ||
                  zielKlassen.length === 0
                "
              >
                <q-icon name="add_task" />
                <span>Aufgabe erstellen</span>
              </button>

              <p class="form-note">* Pflichtfelder</p>
            </q-form>
          </div>

          <div class="task-card teacher-card">
            <div class="card-header">
              <q-icon name="school" />
              <h2>Lehrer-Accounts</h2>
            </div>

            <div v-if="lehrerAccounts.length === 0" class="empty-state">
              Keine Lehrer-Accounts gefunden.
            </div>

            <div v-else class="teacher-list">
              <div
                v-for="lehrer in lehrerAccounts"
                :key="lehrer.userid"
                class="teacher-item"
              >
                <div class="teacher-info">
                  <h3>{{ lehrer.name }}</h3>
                  <p>{{ lehrer.email }}</p>
                </div>
                <div class="teacher-actions">
                  <span class="teacher-meta">{{
                    lehrer.fachbereich || "Allgemein"
                  }}</span>
                  <q-select
                    v-model="zuweisungen[lehrer.lehrerid]"
                    :options="aufgabeOptions"
                    emit-value
                    map-options
                    outlined
                    dark
                    options-dark
                    color="cyan"
                    dense
                    label="Aufgabe wählen"
                    class="teacher-task-select app-select"
                    popup-content-class="app-select-menu"
                    options-selected-class="app-select-option--selected"
                    @update:model-value="lehrerAufgabeSpeichern(lehrer.lehrerid)"
                  />
                </div>
              </div>
            </div>

            <p class="teacher-hint">
              Mehrere Lehrer können dieselbe Aufgabe auswählen.
            </p>
          </div>
        </div>

        <div class="overview-grid">
          <div class="task-card student-card">
            <div class="card-header">
              <q-icon name="groups" />
              <h2>Schülerstatus und Entschuldigungen</h2>
            </div>

            <div v-if="students.length === 0" class="empty-state">
              Keine Schüler gefunden.
            </div>

            <template v-else>
              <div class="student-search-bar">
                <q-input
                  v-model="studentSearch"
                  outlined
                  dense
                  clearable
                  debounce="150"
                  color="cyan"
                  label="Schüler suchen"
                  placeholder="Name, E-Mail oder Klasse"
                  class="student-search-input"
                >
                  <template #prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>

                <span class="student-search-meta">
                  {{ filteredStudents.length }} von {{ students.length }} Schülern
                </span>
              </div>

              <div v-if="filteredStudents.length === 0" class="empty-state">
                Keine passenden Schüler gefunden.
              </div>

              <div v-else class="student-list">
                <div
                  v-for="student in filteredStudents"
                  :key="student.userid"
                  class="student-item"
                >
                  <div class="student-top">
                    <div class="student-info">
                      <h3>{{ student.name }}</h3>
                      <p>{{ student.email }}</p>
                      <span class="student-class">{{ student.klasse }}</span>
                    </div>

                    <div class="excuse-actions">
                      <span class="excuse-actions-label">Entschuldigung pro Tag</span>
                      <div class="excuse-button-group">
                        <button
                          v-for="day in EVENT_DAYS"
                          :key="`${student.userid}-${day.value}`"
                          class="day-toggle"
                          :class="{
                            active: isDayExcused(student, day.value),
                            loading: isSavingStudent(student.userid),
                          }"
                          :disabled="isSavingStudent(student.userid)"
                          @click="toggleExcuseDay(student, day.value)"
                        >
                          {{
                            `${day.label} ${
                              isDayExcused(student, day.value)
                                ? 'entschuldigt'
                                : 'entschuldigen'
                            }`
                          }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="student-days">
                    <div
                      v-for="day in EVENT_DAYS"
                      :key="`${student.userid}-day-${day.value}`"
                      class="student-day-card"
                    >
                      <div class="student-day-header">
                        <strong>{{ day.fullLabel }}</strong>
                        <span>{{ day.timeLabel }}</span>
                      </div>

                      <div
                        v-if="isDayExcused(student, day.value)"
                        class="student-day-state excuse"
                      >
                        Entschuldigt
                      </div>

                      <div
                        v-else-if="getAssignmentForDay(student, day.value)"
                        class="student-day-state assigned"
                      >
                        <span class="state-title">
                          {{ getAssignmentForDay(student, day.value).titel }}
                        </span>
                        <span class="state-meta">
                          {{
                            formatDate(
                              getTaskDateForDay(
                                getAssignmentForDay(student, day.value),
                                day.value,
                              ),
                            )
                          }}
                          -
                          {{
                            formatTime(
                              getTaskTimeForDay(
                                getAssignmentForDay(student, day.value),
                                day.value,
                              ),
                            )
                          }}
                          Uhr
                        </span>
                      </div>

                      <div v-else class="student-day-state open">
                        Noch nicht angemeldet
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="task-card missing-card">
            <div class="card-header">
              <q-icon name="warning_amber" />
              <h2>Noch nicht angemeldet</h2>
            </div>

            <div v-if="missingRegistrations.length === 0" class="empty-state">
              Alle relevanten Schüler sind bereits eingeteilt oder entschuldigt.
            </div>

            <div v-else class="missing-list">
              <div
                v-for="student in missingRegistrations"
                :key="`missing-${student.userid}`"
                class="missing-item"
              >
                <div>
                  <h3>{{ student.name }}</h3>
                  <p>{{ student.klasse }}</p>
                </div>

                <div class="missing-meta">
                  <span class="missing-badge">
                    {{ getMissingDaysLabel(student) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button class="back-btn" @click="goBack">
          <q-icon name="arrow_back" />
          <span>Zurück zur Hauptseite</span>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.admin-page {
  min-height: 100vh;
  background: var(--app-bg-gradient);
  color: var(--text-primary);
  font-family: var(--font-sans);
  position: relative;
  overflow-x: hidden;
}

.bg-orbs {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, rgba(201, 135, 55, 0.68), rgba(143, 93, 43, 0.58));
  top: -200px;
  right: -200px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, rgba(47, 111, 219, 0.85), rgba(31, 88, 185, 0.72));
  bottom: -150px;
  left: -150px;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, rgba(43, 136, 120, 0.7), rgba(28, 97, 87, 0.62));
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.admin-header {
  position: relative;
  z-index: 10;
  background: rgba(8, 17, 31, 0.84);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-soft);
  padding: 24px 40px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(145deg, var(--accent-primary), var(--accent-primary-strong));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(31, 88, 185, 0.28);
}

.header-content h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(145deg, #f8fbff 0%, #c7dbf8 45%, #78a5e8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-content p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 4px 0 0;
}

.admin-main {
  position: relative;
  z-index: 1;
  padding: 48px 40px;
}

.admin-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-grid,
.overview-grid {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 24px;
  align-items: start;
}

.overview-grid {
  grid-template-columns: 1.25fr 0.75fr;
}

.task-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-soft);
  border-radius: 24px;
  padding: 32px;
  backdrop-filter: blur(10px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-soft);
}

.card-header .q-icon {
  font-size: 30px;
  color: #8cb8ff;
}

.card-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-input {
  width: 100%;
}

.day-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(7, 17, 31, 0.42);
  border: 1px solid var(--border-soft);
}

.day-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.day-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(47, 111, 219, 0.16);
  color: #b6cdf5;
  font-size: 12px;
  font-weight: 700;
}

.day-pill.alt {
  background: rgba(43, 136, 120, 0.18);
  color: #8de0b6;
}

.day-subtitle {
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 26px;
  background: linear-gradient(145deg, var(--accent-primary), var(--accent-primary-strong));
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(31, 88, 185, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(31, 88, 185, 0.38);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-note {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.empty-state {
  padding: 20px;
  border-radius: 12px;
  background: rgba(7, 17, 31, 0.42);
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
}

.teacher-card,
.student-card,
.missing-card {
  min-height: 100%;
}

.student-search-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.student-search-input {
  flex: 1 1 320px;
}

.student-search-meta {
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.teacher-list,
.student-list,
.missing-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 560px;
  overflow-y: auto;
  padding-right: 4px;
}

.teacher-list::-webkit-scrollbar,
.student-list::-webkit-scrollbar,
.missing-list::-webkit-scrollbar {
  width: 8px;
}

.teacher-list::-webkit-scrollbar-thumb,
.student-list::-webkit-scrollbar-thumb,
.missing-list::-webkit-scrollbar-thumb {
  background: rgba(var(--accent-primary-rgb), 0.45);
  border-radius: 999px;
}

.teacher-list::-webkit-scrollbar-track,
.student-list::-webkit-scrollbar-track,
.missing-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.teacher-item,
.student-item,
.missing-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.teacher-item {
  align-items: center;
}

.teacher-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  width: 320px;
}

.teacher-info h3,
.student-info h3,
.missing-item h3 {
  color: #ffffff !important;
  font-size: 17px;
  margin-bottom: 4px;
  font-weight: 700;
}

.teacher-info p,
.student-info p,
.missing-item p {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 13px;
}

.teacher-meta {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(var(--accent-secondary-rgb), 0.16);
  color: #9be2d6;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.teacher-task-select {
  width: 100%;
}

.teacher-hint {
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
}

.student-item {
  flex-direction: column;
}

.student-top {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.student-class {
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  font-weight: 700;
}

.excuse-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.excuse-actions-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.excuse-button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.day-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
}

.day-toggle.active {
  background: linear-gradient(135deg, var(--accent-warm), #b9772e);
  border-color: transparent;
  color: #ffffff;
}

.day-toggle.loading,
.day-toggle:disabled {
  opacity: 0.65;
  cursor: wait;
}

.student-days {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.student-day-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.student-day-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-day-header strong {
  color: #ffffff;
  font-size: 14px;
}

.student-day-header span {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.student-day-state {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
}

.student-day-state.assigned {
  background: rgba(var(--accent-primary-rgb), 0.14);
  color: #cfe1fb;
}

.student-day-state.excuse {
  background: rgba(var(--accent-warm-rgb), 0.16);
  color: #f2d0a7;
}

.student-day-state.open {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.state-title {
  color: #ffffff;
}

.state-meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.missing-item {
  align-items: center;
}

.missing-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.missing-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(var(--accent-warm-rgb), 0.16);
  color: #f3d7b4;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(var(--accent-primary-rgb), 0.1);
  border-color: rgba(var(--accent-primary-rgb), 0.28);
  transform: translateY(-2px);
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

.picker-native-input :deep(.q-field__native[type="date"]),
.picker-native-input :deep(.q-field__native[type="time"]) {
  color-scheme: dark;
  cursor: pointer;
}

.picker-native-input
  :deep(.q-field__native[type="date"]::-webkit-calendar-picker-indicator),
.picker-native-input
  :deep(.q-field__native[type="time"]::-webkit-calendar-picker-indicator) {
  filter: invert(0.92) brightness(1.1);
  cursor: pointer;
  opacity: 0.88;
}

@media (max-width: 1100px) {
  .admin-grid,
  .overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .form-row,
  .student-days {
    grid-template-columns: 1fr;
  }

  .teacher-actions {
    width: 100%;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .admin-header {
    padding: 20px;
  }

  .admin-main {
    padding: 32px 20px;
  }

  .task-card {
    padding: 20px;
  }

  .header-content,
  .student-top,
  .teacher-item,
  .missing-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-header h2 {
    font-size: 20px;
  }

  .excuse-actions,
  .missing-meta {
    width: 100%;
    align-items: flex-start;
  }

  .excuse-button-group,
  .missing-meta {
    justify-content: flex-start;
  }

  .student-search-meta {
    white-space: normal;
  }
}
</style>
