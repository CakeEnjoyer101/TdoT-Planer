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

// Überprüfe ob Admin (über Klasse) beim Laden der Seite
onMounted(async () => {
  try {
    const response = await axios.get("http://localhost:3000/auth/profile", {
      withCredentials: true,
    });

    if (response.data.user.klasse !== 'Admin') {
      // Nicht-Admin zur Main Page weiterleiten
      alert("Zugriff verweigert: Nur Administratoren dürfen diese Seite aufrufen.");
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

    // Formular zurücksetzen
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
  <div class="admin-dashboard">
    <!-- Header mit Admin Info -->
    <div class="bg-purple-7 text-white q-pa-md shadow-3 rounded-borders q-mb-lg">
      <div class="text-h4 text-weight-bold">🏢 Admin Dashboard</div>
      <div class="text-subtitle1">Administrator Bereich - Aufgabenverwaltung</div>
      <div class="text-caption q-mt-sm opacity-80">
        Vollzugriff auf alle Systemfunktionen
      </div>
    </div>

    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card class="shadow-2">
          <q-card-section class="bg-purple-6 text-white">
            <div class="text-h5 text-weight-bold">➕ Neue Aufgabe anlegen</div>
          </q-card-section>

          <q-card-section class="q-pa-lg">
            <q-form @submit.prevent="submit" class="q-gutter-md">
              <!-- Titel -->
              <q-input
                v-model="titel"
                label="Titel *"
                required
                color="purple-7"
                outlined
                placeholder="Titel der Aufgabe eingeben"
                :rules="[val => !!val || 'Titel ist erforderlich']"
              />

              <!-- Beschreibung -->
              <q-input
                v-model="beschreibung"
                label="Beschreibung"
                type="textarea"
                color="purple-7"
                outlined
                placeholder="Beschreibung der Aufgabe (optional)"
                rows="3"
              />

              <!-- Datum & Uhrzeit -->
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="datum"
                    label="Datum *"
                    required
                    color="purple-7"
                    outlined
                    placeholder="YYYY-MM-DD"
                    hint="Format: YYYY-MM-DD"
                    :rules="[val => !!val || 'Datum ist erforderlich']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="uhrzeit"
                    label="Uhrzeit"
                    color="purple-7"
                    outlined
                    placeholder="HH:MM:SS"
                    hint="Format: HH:MM:SS"
                  />
                </div>
              </div>


              <!-- Submit Button -->
              <div class="q-pt-md">
                <q-btn
                  label="Aufgabe erstellen"
                  type="submit"
                  color="purple-7"
                  class="full-width"
                  size="lg"
                  icon="add_task"
                  :disabled="!titel || !datum"
                />
              </div>

              <div class="text-center q-pt-sm">
                <div class="text-caption text-grey-6">* Pflichtfelder</div>
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <!-- Schnellinfo Karte -->
        <q-card class="q-mt-md shadow-1">
          <q-card-section class="bg-blue-1">
            <div class="text-h6 text-blue-8 q-mb-sm">📋 Schnellinfo & Hilfe</div>
            <div class="text-caption text-grey-8 q-mb-sm">
              <strong>Tag IDs:</strong> 1=Montag, 2=Dienstag, 3=Mittwoch,
              4=Donnerstag, 5=Freitag, 6=Samstag, 7=Sonntag
            </div>
            <div class="text-caption text-grey-8">
              <strong>Hinweis:</strong> Nur Administratoren können Aufgaben erstellen und verwalten.
            </div>
          </q-card-section>
        </q-card>

        <!-- Zurück Button -->
        <q-card class="q-mt-md shadow-1">
          <q-card-section class="text-center">
            <q-btn
              label="Zurück zur Hauptseite"
              color="grey-6"
              outline
              @click="window.location.href = 'http://localhost:9000/main'"
              icon="arrow_back"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e8eaf6 100%);
  padding: 20px;
}

.rounded-borders {
  border-radius: 12px;
}

.q-input {
  font-size: 1rem;
}

:deep(.q-field--outlined.q-field--focused .q-field__control) {
  border-color: #7b1fa2 !important;
}

:deep(.q-field__label) {
  color: #7b1fa2 !important;
}

:deep(.q-btn--purple-7) {
  background: #7b1fa2 !important;
}

:deep(.q-btn--purple-7:hover) {
  background: #6a1b9a !important;
}
</style>