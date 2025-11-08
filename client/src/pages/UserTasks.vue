<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const tasks = ref([]);
const currentUser = ref(null);

onMounted(async () => {
  await loadUserProfile();
  await loadUserTasks();
});

async function loadUserProfile() {
  try {
    const response = await axios.get("http://localhost:3000/auth/profile", {
      withCredentials: true,
    });
    currentUser.value = response.data.user;
  } catch (error) {
    console.error("Fehler beim Laden des Profils:", error);
  }
}

async function loadUserTasks() {
  try {
    const response = await axios.get("http://localhost:3000/user/aufgaben", {
      withCredentials: true,
    });
    tasks.value = response.data;
  } catch (error) {
    console.error("Fehler beim Laden der Aufgaben:", error);
  }
}

const isLehrer = computed(() => currentUser.value?.klasse === 'Lehrer');
const isSchueler = computed(() => currentUser.value?.klasse && currentUser.value.klasse !== 'Admin' && currentUser.value.klasse !== 'Lehrer');

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timeString) => {
  if (!timeString) return "";
  return timeString.substring(0, 5);
};
</script>

<template>
  <div class="user-tasks-page">
    <!-- Header basierend auf Benutzertyp -->
    <div class="text-center q-mb-md">
      <div class="text-h5 text-weight-bold" :class="isLehrer ? 'text-orange-8' : 'text-red-7'">
        {{ isLehrer ? '👨‍🏫 Meine übernommenen Aufgaben' : '📚 Meine angemeldeten Aufgaben' }}
      </div>
      <div class="text-caption text-grey-6">
        {{ isLehrer ? 'Aufgaben, die Sie als Lehrkraft übernommen haben' : 'Aufgaben, für die Sie angemeldet sind' }}
      </div>
    </div>

    <div class="row justify-center">
      <div class="col-12 col-md-8">
        <!-- Lehrer Ansicht -->
        <div v-if="isLehrer">
          <div v-if="tasks.length === 0" class="text-center q-pa-xl">
            <q-icon name="assignment" color="orange-5" size="xl" />
            <div class="text-h6 q-mt-md text-grey-7">Keine übernommenen Aufgaben</div>
            <div class="text-caption text-grey-6">
              Gehen Sie zur Hauptseite und übernehmen Sie Aufgaben als Lehrkraft
            </div>
          </div>

          <div v-else class="q-gutter-y-md">
            <q-card
              v-for="task in tasks"
              :key="task.aufgabeid"
              class="task-card shadow-2 lehrer-card"
            >
              <q-card-section class="q-pa-md">
                <div class="row items-center">
                  <div class="col-3 text-center">
                    <div class="date-badge bg-orange-7 text-white q-pa-sm rounded-borders">
                      <div class="text-caption text-weight-bold">
                        {{ new Date(task.datum).toLocaleDateString("de-DE", { weekday: "short" }) }}
                      </div>
                      <div class="text-h6 text-weight-bold">
                        {{ new Date(task.datum).getDate() }}
                      </div>
                      <div class="text-caption">
                        {{ new Date(task.datum).toLocaleDateString("de-DE", { month: "short" }) }}
                      </div>
                    </div>
                  </div>

                  <div class="col-9">
                    <div class="text-h6 text-orange-8 text-weight-bold q-mb-xs">
                      {{ task.titel }}
                    </div>
                    <div class="text-body2 text-grey-8 q-mb-xs">
                      {{ task.beschreibung }}
                    </div>
                    <div v-if="task.uhrzeit" class="text-caption text-orange-6">
                      <q-icon name="schedule" size="14px" class="q-mr-xs" />
                      {{ formatTime(task.uhrzeit) }} Uhr
                    </div>
                    <div class="text-caption text-grey-6 q-mt-xs">
                      <q-icon name="event" size="14px" class="q-mr-xs" />
                      {{ formatDate(task.datum) }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Schüler Ansicht -->
        <div v-else-if="isSchueler">
          <div v-if="tasks.length === 0" class="text-center q-pa-xl">
            <q-icon name="check_circle" color="green-5" size="xl" />
            <div class="text-h6 q-mt-md text-grey-7">Keine angemeldeten Aufgaben</div>
            <div class="text-caption text-grey-6">
              Gehen Sie zur Hauptseite und melden Sie sich für Aufgaben an
            </div>
          </div>

          <div v-else class="q-gutter-y-md">
            <q-card
              v-for="task in tasks"
              :key="task.aufgabeid"
              class="task-card shadow-2 schueler-card"
            >
              <q-card-section class="q-pa-md">
                <div class="row items-center">
                  <div class="col-3 text-center">
                    <div class="date-badge bg-green-7 text-white q-pa-sm rounded-borders">
                      <div class="text-caption text-weight-bold">
                        {{ new Date(task.datum).toLocaleDateString("de-DE", { weekday: "short" }) }}
                      </div>
                      <div class="text-h6 text-weight-bold">
                        {{ new Date(task.datum).getDate() }}
                      </div>
                      <div class="text-caption">
                        {{ new Date(task.datum).toLocaleDateString("de-DE", { month: "short" }) }}
                      </div>
                    </div>
                  </div>

                  <div class="col-9">
                    <div class="text-h6 text-green-8 text-weight-bold q-mb-xs">
                      {{ task.titel }}
                    </div>
                    <div class="text-body2 text-grey-8 q-mb-xs">
                      {{ task.beschreibung }}
                    </div>
                    <div v-if="task.uhrzeit" class="text-caption text-green-6">
                      <q-icon name="schedule" size="14px" class="q-mr-xs" />
                      {{ formatTime(task.uhrzeit) }} Uhr
                    </div>
                    <div class="text-caption text-grey-6 q-mt-xs">
                      <q-icon name="event" size="14px" class="q-mr-xs" />
                      {{ formatDate(task.datum) }}
                    </div>
                    <div class="text-caption text-grey-6">
                      <q-icon name="how_to_reg" size="14px" class="q-mr-xs" />
                      Angemeldet am: {{ new Date(task.angemeldet_am).toLocaleDateString("de-DE") }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Admin oder kein spezieller Typ -->
        <div v-else class="text-center q-pa-xl">
          <div class="text-h6 text-grey-7">Diese Seite ist für Schüler und Lehrer</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-tasks-page {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e8eaf6 100%);
}

.task-card {
  border-left: 4px solid #d32f2f;
  transition: all 0.3s ease;
}

.lehrer-card {
  border-left: 4px solid #ff9800;
}

.schueler-card {
  border-left: 4px solid #4caf50;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}

.date-badge {
  min-width: 60px;
}
</style>