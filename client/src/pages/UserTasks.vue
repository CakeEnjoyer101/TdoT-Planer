<template>
  <div class="user-tasks-page">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <q-icon name="arrow_back" class="q-mr-xs" />
          Zurück
        </button>

        <button class="logout-btn" @click="logout">
          <q-icon name="logout" class="q-mr-xs" />
          Abmelden
        </button>
      </div>

      <h1>Meine Aufgaben</h1>

      <div class="header-right" v-if="user">
        <div class="user-info">
          <div class="user-details">
            <div class="user-klasse" :class="getBadgeClass()">
              {{ getBadgeText() }}
            </div>
            <div class="user-name-section">
              <q-icon :name="getUserIcon()" class="user-icon" />
              <span class="user-name">{{ user.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="header-right" v-else>
        <q-spinner size="20px" />
      </div>
    </header>

    <main class="content">
      <div v-if="tasks.length === 0" class="no-tasks">
        Du bist für derzeit keine Aufgaben angemeldet.
      </div>

      <div v-else class="tasks-list">
        <q-card v-for="task in tasks" :key="task.aufgabeid" class="task-card">
          <div class="task-title">{{ task.titel }}</div>
          <div class="task-desc">{{ task.beschreibung }}</div>
          <div class="task-meta">
            <span v-if="task.datum"
              ><q-icon name="event" /> {{ formatDate(task.datum) }}</span
            >
            <span v-if="task.uhrzeit"
              ><q-icon name="schedule" />
              {{ formatTime(task.uhrzeit) }} Uhr</span
            >
            <span v-if="task.lehrer_name"
              ><q-icon name="school" /> {{ task.lehrer_name }}</span
            >
          </div>
        </q-card>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const user = ref(null);
const tasks = ref([]);

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
    const res = await axios.get("http://localhost:3000/user/aufgaben", {
      withCredentials: true,
    });
    tasks.value = res.data;
  } catch (err) {
    console.error(err);
    tasks.value = [];
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
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE");
};

const formatTime = (timeString) => {
  if (!timeString) return "";
  return timeString.substring(0, 5);
};

const getBadgeClass = () => {
  if (!user.value) return "";
  if (user.value.klasse === "Admin") return "admin-badge";
  if (user.value.klasse === "Lehrer") return "lehrer-badge";
  return "";
};

const getBadgeText = () => {
  if (!user.value) return "";
  if (user.value.klasse === "Admin") return "Admin Account";
  if (user.value.klasse === "Lehrer") return "Lehrer Account";
  return user.value.klasse;
};

const getUserIcon = () => {
  if (!user.value) return "person";
  if (user.value.klasse === "Admin") return "admin_panel_settings";
  if (user.value.klasse === "Lehrer") return "school";
  return "person";
};

onMounted(async () => {
  await loadUser();
  await loadTasks();
});

const goBack = () => {
  window.location.href = "http://localhost:9000/main";
};
</script>

<style scoped>
.user-tasks-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(211, 47, 47, 0.1);
}

.header h1 {
  font-size: 36px;
  background: linear-gradient(135deg, #d32f2f, #f44336);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logout-btn {
  background: #f44336;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.08);
  background: #fff;
}

.task-title {
  font-weight: 700;
  font-size: 18px;
  color: #d32f2f;
  margin-bottom: 8px;
}

.task-desc {
  font-size: 14px;
  color: #555;
  margin-bottom: 12px;
}

.task-meta span {
  margin-right: 12px;
  font-size: 12px;
  color: #888;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.admin-badge {
  background: #7b1fa2;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 700;
}

.lehrer-badge {
  background: #388e3c;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 700;
}

.user-name-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-icon {
  color: #d32f2f;
}

.back-btn {
  background: #fff;
  color: #d32f2f;
  border: 2px solid #d32f2f;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  margin-right: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #d32f2f;
  color: white;
  transform: translateY(-2px);
}
</style>
