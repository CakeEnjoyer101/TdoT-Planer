<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const titel = ref("");
const beschreibung = ref("");
const datum = ref("");
const uhrzeit = ref("");
const tagid = ref(1);
const lehrerid = ref(null);
const leiterid = ref(1);

onMounted(async () => {
  try {
    const response = await axios.get("http://localhost:3000/auth/profile", {
      withCredentials: true,
    });
    if (response.data.user.klasse !== "Admin") {
      alert(
        "Zugriff verweigert: Nur Administratoren dürfen diese Seite aufrufen."
      );
      window.location.href = "http://localhost:9000/main";
    }
  } catch (error) {
    console.error("Fehler beim Überprüfen der Admin-Berechtigung:", error);
    alert("Fehler bei der Authentifizierung. Bitte erneut einloggen.");
    window.location.href = "http://localhost:9000/";
  }
});

async function submit() {
  try {
    const payload = {
      titel: titel.value,
      beschreibung: beschreibung.value,
      datum: datum.value,
      uhrzeit: uhrzeit.value,
      tagid: tagid.value,
      lehrerid: lehrerid.value,
      leiterid: leiterid.value,
    };
    await axios.post("http://localhost:3000/aufgaben", payload, {
      withCredentials: true,
    });
    alert("Aufgabe erfolgreich erstellt!");
    titel.value = "";
    beschreibung.value = "";
    datum.value = "";
    uhrzeit.value = "";
    tagid.value = 1;
    lehrerid.value = null;
    leiterid.value = 1;
  } catch (err) {
    if (err.response?.status === 403) {
      alert("Fehler: Keine Admin-Berechtigung für diese Aktion");
      window.location.href = "http://localhost:9000/main";
    } else {
      alert("Fehler: " + (err.response?.data?.error || err.message));
    }
  }
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
          <p>Aufgabenverwaltung & Systemkontrolle</p>
        </div>
      </div>
    </header>

    <main class="admin-main">
      <div class="admin-container">
        <div class="task-card">
          <div class="card-header">
            <q-icon name="add_task" />
            <h2>Neue Aufgabe erstellen</h2>
          </div>

          <q-form @submit.prevent="submit" class="task-form">
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

            <button
              type="submit"
              class="submit-btn"
              :disabled="!titel || !datum"
            >
              <q-icon name="add_task" />
              <span>Aufgabe erstellen</span>
            </button>

            <p class="form-note">* Pflichtfelder</p>
          </q-form>
        </div>

        <div class="info-cards">
          <div class="info-card">
            <div class="info-icon">
              <q-icon name="info" />
            </div>
            <div class="info-content">
              <h3>Tag IDs</h3>
              <p>
                1=Montag, 2=Dienstag, 3=Mittwoch, 4=Donnerstag, 5=Freitag,
                6=Samstag, 7=Sonntag
              </p>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon security">
              <q-icon name="security" />
            </div>
            <div class="info-content">
              <h3>Zugriffsberechtigung</h3>
              <p>
                Nur Administratoren können Aufgaben erstellen und verwalten.
              </p>
            </div>
          </div>
        </div>

        <button
          class="back-btn"
          @click="window.location.href = 'http://localhost:9000/main'"
        >
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
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.task-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 36px;
  backdrop-filter: blur(10px);
}
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.card-header .q-icon {
  font-size: 32px;
  color: #00d4ff;
}
.card-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-input {
  width: 100%;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 32px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
  margin-top: 8px;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 212, 255, 0.5);
}
.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.form-note {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.info-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.info-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  gap: 16px;
}
.info-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #ffffff;
  flex-shrink: 0;
}
.info-icon.security {
  background: linear-gradient(135deg, #00f5a0, #00d4aa);
}
.info-content h3 {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
}
.info-content p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin: 0;
}

.back-btn {
  display: flex;
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
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

:deep(.q-field--outlined .q-field__control) {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}
:deep(.q-field--outlined.q-field--focused .q-field__control) {
  border-color: #00d4ff !important;
  box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.3);
}
:deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.7);
}
:deep(.q-field--focused .q-field__label) {
  color: #00d4ff !important;
}
:deep(.q-field__native) {
  color: #ffffff;
}
:deep(.q-field__bottom) {
  color: rgba(255, 255, 255, 0.5);
}
:deep(.q-placeholder) {
  color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .admin-header {
    padding: 20px;
  }
  .header-icon {
    width: 52px;
    height: 52px;
    font-size: 28px;
  }
  .header-content h1 {
    font-size: 24px;
  }
  .admin-main {
    padding: 32px 20px;
  }
  .task-card {
    padding: 24px;
  }
  .card-header h2 {
    font-size: 20px;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .info-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  .task-card {
    padding: 20px;
  }
  .submit-btn {
    padding: 14px 24px;
    font-size: 15px;
  }
}
</style>
