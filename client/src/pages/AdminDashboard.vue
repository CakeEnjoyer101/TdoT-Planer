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
    alert("Aufgabe erstellt");
  } catch (err) {
    alert("Fehler: " + (err.response?.data?.error || err.message));
  }
}
</script>

<template>
  <h4>Aufgabe erstellen (Admin)</h4>
  <q-form @submit.prevent="submit">
    <q-input v-model="titel" label="Titel" required />
    <q-input v-model="beschreibung" label="Beschreibung" type="textarea" />
    <q-input v-model="datum" label="Datum (YYYY-MM-DD)" />
    <q-input v-model="uhrzeit" label="Uhrzeit (HH:MM:SS)" />
    <q-input v-model="tagid" label="Tag ID" />
    <q-input v-model="lehrerid" label="Lehrer ID" />
    <q-input v-model="leiterid" label="Leiter ID" />
    <q-btn label="Erstellen" type="submit" class="q-mt-md" />
  </q-form>
</template>
