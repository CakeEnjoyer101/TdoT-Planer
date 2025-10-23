<script setup>
import { ref } from "vue";
import axios from "axios";

const titel = ref("");
const beschreibung = ref("");
const datum = ref("");
const uhrzeit = ref("");
const tagid = ref(1);
const lehrerid = ref(null);
const leiterid = ref(1);

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
    alert("Fehler: " + (err.response?.data?.error || err.message));
  }
}
</script>

<template>
  <div class="bg-red-7 text-white q-pa-md shadow-3 rounded-borders q-mb-lg">
    <div class="text-h4 text-weight-bold">Aufgabe erstellen</div>
    <div class="text-subtitle1">Administrator Bereich</div>
  </div>

  <div class="row justify-center">
    <div class="col-12 col-md-8 col-lg-6">
      <q-card class="shadow-2">
        <q-card-section class="bg-red-6 text-white">
          <div class="text-h5 text-weight-bold">Neue Aufgabe anlegen</div>
        </q-card-section>

        <q-card-section class="q-pa-lg">
          <q-form @submit.prevent="submit" class="q-gutter-md">
            <q-input
              v-model="titel"
              label="Titel *"
              required
              color="red-7"
              outlined
              placeholder="Titel der Aufgabe eingeben"
            />

            <q-input
              v-model="beschreibung"
              label="Beschreibung"
              type="textarea"
              color="red-7"
              outlined
              placeholder="Beschreibung der Aufgabe (optional)"
              rows="3"
            />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="datum"
                  label="Datum *"
                  required
                  color="red-7"
                  outlined
                  placeholder="YYYY-MM-DD"
                  hint="Format: YYYY-MM-DD"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="uhrzeit"
                  label="Uhrzeit"
                  color="red-7"
                  outlined
                  placeholder="HH:MM:SS"
                  hint="Format: HH:MM:SS"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <q-input
                  v-model.number="tagid"
                  label="Tag ID *"
                  type="number"
                  required
                  color="red-7"
                  outlined
                  hint="1-7 für Wochentage"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model.number="lehrerid"
                  label="Lehrer ID"
                  type="number"
                  color="red-7"
                  outlined
                  hint="Optional"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model.number="leiterid"
                  label="Leiter ID *"
                  type="number"
                  required
                  color="red-7"
                  outlined
                />
              </div>
            </div>

            <div class="q-pt-md">
              <q-btn
                label="Aufgabe erstellen"
                type="submit"
                color="red-7"
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

      <q-card class="q-mt-md shadow-1">
        <q-card-section class="bg-blue-1">
          <div class="text-h6 text-blue-8 q-mb-sm">📋 Schnellinfo</div>
          <div class="text-caption text-grey-8">
            <strong>Tag IDs:</strong> 1=Montag, 2=Dienstag, 3=Mittwoch,
            4=Donnerstag, 5=Freitag, 6=Samstag, 7=Sonntag
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
.rounded-borders {
  border-radius: 10px;
}

.q-input {
  font-size: 1rem;
}

:deep(.q-field--outlined.q-field--focused .q-field__control) {
  border-color: #d32f2f !important;
}
</style>
