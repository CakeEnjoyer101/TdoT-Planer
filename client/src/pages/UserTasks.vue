<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
const tasks = ref([]);

onMounted(async () => {
  try {
    const res = await axios.get("http://localhost:3000/aufgaben", {
      withCredentials: true,
    });
    tasks.value = res.data;
  } catch (err) {
    console.error(err);
  }
});
</script>

<template>
  <h4>Deine Aufgaben</h4>
  <q-list bordered>
    <q-item v-for="t in tasks" :key="t.aufgabeid">
      <q-item-section>
        <div class="text-h6">{{ t.titel }}</div>
        <div>{{ t.beschreibung }}</div>
        <div>{{ t.datum }} {{ t.uhrzeit || "" }}</div>
      </q-item-section>
    </q-item>
  </q-list>
</template>
