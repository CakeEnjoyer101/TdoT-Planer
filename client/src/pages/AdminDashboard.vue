<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import axios from "axios";

const createTaskForm = ref(null);
const titel = ref("");
const beschreibung = ref("");
const datum = ref("");
const uhrzeit = ref("");
const lehrerid = ref(null);
const zielKlassen = ref([]);

const lehrerAccounts = ref([]);
const aufgaben = ref([]);
const zuweisungen = ref({});

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
  }))
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
    label: `${aufgabe.titel} (${formatDate(aufgabe.datum)}${
      aufgabe.uhrzeit ? `, ${formatTime(aufgabe.uhrzeit)} Uhr` : ""
    })`,
    value: aufgabe.aufgabeid,
  })),
]);

onMounted(async () => {
  try {
    const response = await axios.get("http://localhost:3000/auth/profile", {
      withCredentials: true,
    });

    if (response.data.user.klasse !== "Admin") {
      alert(
        "Zugriff verweigert: Nur Administratoren duerfen diese Seite aufrufen."
      );
      window.location.href = "http://localhost:9000/main";
      return;
    }

    await Promise.all([loadLehrerAccounts(), loadAufgaben()]);
    syncLehrerZuweisungen();
  } catch (error) {
    console.error("Fehler beim Ueberpruefen der Admin-Berechtigung:", error);
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

function syncLehrerZuweisungen() {
  const mapping = {};

  for (const lehrer of lehrerAccounts.value) {
    const ersteAufgabe = aufgaben.value.find(
      (aufgabe) => aufgabe.lehrerid === lehrer.lehrerid
    );
    mapping[lehrer.lehrerid] = ersteAufgabe ? ersteAufgabe.aufgabeid : null;
  }

  zuweisungen.value = mapping;
}

async function submit() {
  try {
    const normalizedZielKlassen = Array.from(
      new Set(
        zielKlassen.value
          .map((klasse) => String(klasse || "").trim())
          .filter(Boolean)
      )
    );

    const payload = {
      titel: titel.value,
      beschreibung: beschreibung.value,
      datum: datum.value,
      uhrzeit: uhrzeit.value,
      lehrerid: lehrerid.value,
      ziel_klassen: normalizedZielKlassen,
    };

    await axios.post("http://localhost:3000/aufgaben", payload, {
      withCredentials: true,
    });

    alert("Aufgabe erfolgreich erstellt.");

    titel.value = "";
    beschreibung.value = "";
    datum.value = "";
    uhrzeit.value = "";
    lehrerid.value = null;
    zielKlassen.value = [];

    await nextTick();
    createTaskForm.value?.resetValidation();

    await loadAufgaben();
    syncLehrerZuweisungen();
  } catch (err) {
    if (err.response?.status === 403) {
      alert("Fehler: Keine Admin-Berechtigung fuer diese Aktion");
      window.location.href = "http://localhost:9000/main";
    } else {
      alert("Fehler: " + (err.response?.data?.error || err.message));
    }
  }
}

async function lehrerAufgabeSpeichern(lehrerId) {
  const zielAufgabeId = zuweisungen.value[lehrerId] ?? null;

  try {
    const bisherigeAufgaben = aufgaben.value
      .filter((aufgabe) => aufgabe.lehrerid === lehrerId)
      .map((aufgabe) => aufgabe.aufgabeid);

    for (const aufgabeId of bisherigeAufgaben) {
      if (aufgabeId !== zielAufgabeId) {
        await axios.patch(
          `http://localhost:3000/admin/aufgaben/${aufgabeId}/lehrer`,
          { lehrerid: null },
          { withCredentials: true }
        );
      }
    }

    if (zielAufgabeId !== null) {
      await axios.patch(
        `http://localhost:3000/admin/aufgaben/${zielAufgabeId}/lehrer`,
        { lehrerid: lehrerId },
        { withCredentials: true }
      );
    }

    await loadAufgaben();
    syncLehrerZuweisungen();
  } catch (err) {
    alert("Fehler: " + (err.response?.data?.error || err.message));
    await loadAufgaben();
    syncLehrerZuweisungen();
  }
}

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("de-DE");
};

const formatTime = (timeString) => {
  if (!timeString) return "";
  return String(timeString).substring(0, 5);
};
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
          <p>Aufgabenverwaltung und Lehrer-Zuweisung</p>
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

              <div class="form-row">
                <q-input
                  v-model="datum"
                  label="Datum *"
                  outlined
                  color="cyan"
                  placeholder="YYYY-MM-DD"
                  hint="Format: YYYY-MM-DD"
                  :rules="[(val) => !!val || 'Datum ist erforderlich']"
                  class="form-input"
                />

                <q-input
                  v-model="uhrzeit"
                  label="Uhrzeit"
                  outlined
                  color="cyan"
                  placeholder="HH:MM:SS"
                  hint="Format: HH:MM:SS"
                  class="form-input"
                />
              </div>

              <q-select
                v-model="lehrerid"
                :options="lehrerOptions"
                emit-value
                map-options
                outlined
                color="cyan"
                label="Lehrer (optional)"
                class="form-input"
              />

              <q-select
                v-model="zielKlassen"
                :options="klassenSelectOptions"
                outlined
                color="cyan"
                label="Zielklassen *"
                class="form-input"
                multiple
                use-chips
                emit-value
                map-options
                hint="Wähle eine oder mehrere Klassen"
                :rules="[
                  (val) =>
                    (Array.isArray(val) && val.length > 0) ||
                    'Mindestens eine Klasse ist erforderlich',
                ]"
              />

              <button
                type="submit"
                class="submit-btn"
                :disabled="!titel || !datum || zielKlassen.length === 0"
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
                    color="cyan"
                    dense
                    label="Aufgabe wählen"
                    class="teacher-task-select"
                    @update:model-value="
                      lehrerAufgabeSpeichern(lehrer.lehrerid)
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          class="back-btn"
          @click="window.location.href = 'http://localhost:9000/main'"
        >
          <q-icon name="arrow_back" />
          <span>Zurueck zur Hauptseite</span>
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
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
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
  opacity: 0.15;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  top: -200px;
  right: -200px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  bottom: -150px;
  left: -150px;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.admin-header {
  position: relative;
  z-index: 10;
  background: rgba(10, 14, 39, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
}

.header-content h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-content p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 4px 0 0;
}

.admin-main {
  position: relative;
  z-index: 1;
  padding: 48px 40px;
}

.admin-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-grid {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 24px;
  align-items: start;
}

.task-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.card-header .q-icon {
  font-size: 30px;
  color: #00d4ff;
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

.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 26px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0, 212, 255, 0.45);
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
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
}

.teacher-card {
  min-height: 100%;
}

.teacher-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 4px;
}

.teacher-list::-webkit-scrollbar {
  width: 8px;
}

.teacher-list::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.45);
  border-radius: 999px;
}

.teacher-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.teacher-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.teacher-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  width: 300px;
}

.teacher-info h3 {
  color: #ffffff !important;
  font-size: 17px;
  margin-bottom: 4px;
  font-weight: 700;
}

.teacher-info p {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 13px;
}

.teacher-meta {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(0, 245, 160, 0.2);
  color: #00f5a0;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.teacher-task-select {
  width: 100%;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

:deep(.q-field--outlined .q-field__control) {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.15);
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
  background: #101938;
  color: #ffffff;
}

:deep(.q-menu .q-item),
:deep(.q-menu .q-item__label) {
  color: #ffffff !important;
}

@media (max-width: 960px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
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

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .card-header h2 {
    font-size: 20px;
  }
}
</style>
