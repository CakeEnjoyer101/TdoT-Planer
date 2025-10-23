<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const tasks = ref([]);

onMounted(async () => {
  try {
    const res = await axios.get("http://localhost:3000/aufgaben", {
      withCredentials: true,
    });

    // Filter tasks: max 2 tasks, 1 per day
    const filteredTasks = filterTasks(res.data);
    tasks.value = filteredTasks;
  } catch (err) {
    console.error(err);
  }
});

// Filter function to get max 2 tasks, 1 per day
const filterTasks = (allTasks) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // Format dates to YYYY-MM-DD for comparison
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Get one task for today and one for tomorrow
  const todayTask = allTasks.find((task) => task.datum === todayStr);
  const tomorrowTask = allTasks.find((task) => task.datum === tomorrowStr);

  const result = [];
  if (todayTask) result.push(todayTask);
  if (tomorrowTask) result.push(tomorrowTask);

  // If no tasks for today/tomorrow, take the next 2 upcoming tasks
  if (result.length < 2) {
    const upcomingTasks = allTasks
      .filter((task) => !result.includes(task) && new Date(task.datum) >= today)
      .sort((a, b) => new Date(a.datum) - new Date(b.datum))
      .slice(0, 2 - result.length);

    result.push(...upcomingTasks);
  }

  return result.slice(0, 2); // Ensure max 2 tasks
};

// const formatDate = (dateString) => {
//   return new Date(dateString).toLocaleDateString("de-DE", {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// };

const formatTime = (timeString) => {
  if (!timeString) return "";
  return timeString.substring(0, 5); // Show only HH:MM
};
</script>

<template>
  <!-- Simple Header -->
  <div class="text-center q-mb-md">
    <div class="text-h5 text-red-7 text-weight-bold">Deine Aufgaben</div>
    <div class="text-caption text-grey-6">Maximal 2 Aufgaben (1 pro Tag)</div>
  </div>

  <!-- Tasks List - Simplified -->
  <div class="row justify-center">
    <div class="col-12 col-md-8">
      <div v-if="tasks.length === 0" class="text-center q-pa-xl">
        <q-icon name="check_circle" color="green-5" size="xl" />
        <div class="text-h6 q-mt-md text-grey-7">
          Keine anstehenden Aufgaben
        </div>
        <div class="text-caption text-grey-6">Alle erledigt! 🎉</div>
      </div>

      <div v-else class="q-gutter-y-md">
        <q-card
          v-for="task in tasks"
          :key="task.aufgabeid"
          class="task-card shadow-2"
          :class="{ 'border-today': isToday(task.datum) }"
        >
          <q-card-section class="q-pa-md">
            <div class="row items-center">
              <!-- Date Badge -->
              <div class="col-3 text-center">
                <div
                  class="date-badge bg-red-7 text-white q-pa-sm rounded-borders"
                >
                  <div class="text-caption text-weight-bold">
                    {{
                      new Date(task.datum).toLocaleDateString("de-DE", {
                        weekday: "short",
                      })
                    }}
                  </div>
                  <div class="text-h6 text-weight-bold">
                    {{ new Date(task.datum).getDate() }}
                  </div>
                  <div class="text-caption">
                    {{
                      new Date(task.datum).toLocaleDateString("de-DE", {
                        month: "short",
                      })
                    }}
                  </div>
                </div>
              </div>

              <!-- Task Content -->
              <div class="col-9">
                <div class="text-h6 text-red-8 text-weight-bold q-mb-xs">
                  {{ task.titel }}
                </div>

                <div class="text-body2 text-grey-8 q-mb-xs">
                  {{ task.beschreibung }}
                </div>

                <div v-if="task.uhrzeit" class="text-caption text-red-6">
                  <q-icon name="schedule" size="14px" class="q-mr-xs" />
                  {{ formatTime(task.uhrzeit) }} Uhr
                </div>

                <div class="text-caption text-grey-6 q-mt-xs">
                  <q-icon name="person" size="14px" class="q-mr-xs" />
                  {{ task.lehrer_name || "Lehrer" }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Info text when less than 2 tasks -->
      <div
        v-if="tasks.length > 0 && tasks.length < 2"
        class="text-center q-mt-md"
      >
        <div class="text-caption text-grey-6">
          Nur {{ tasks.length }} Aufgabe(n) für die nächsten Tage
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  border-left: 4px solid #d32f2f;
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(211, 47, 47, 0.2) !important;
}

.border-today {
  border-left: 4px solid #388e3c; /* Green for today's tasks */
}

.date-badge {
  min-width: 60px;
}

.text-caption {
  font-size: 0.75rem;
}
</style>

<script>
// Helper function to check if a date is today
const isToday = (dateString) => {
  const today = new Date();
  const taskDate = new Date(dateString);
  return today.toDateString() === taskDate.toDateString();
};
</script>
