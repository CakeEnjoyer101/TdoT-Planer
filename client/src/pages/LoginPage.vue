<script setup>
import { ref } from "vue";
const error = ref(null);

function loginWithGoogle() {
  window.location.href = "http://localhost:3000/auth/google";
}

function loginDev() {
  window.location.href = "http://localhost:3000/auth/devlogin";
}
async function loginAdminDev() {
  (window.location.href = "http://localhost:3000/auth/admin-devlogin"),
    {
      credentials: "include",
    };
}
</script>

<template>
  <div class="q-pa-md">
    <h3>Login</h3>
    <q-btn label="Mit Google einloggen" @click="loginWithGoogle" />
    <q-btn label="Dev Login (Local)" @click="loginDev" class="q-mt-sm" />
    <q-btn label="Dev Login (Admin)" @click="loginAdminDev" class="q-mt-sm" />
    <div v-if="error" class="text-negative q-mt-md">{{ error }}</div>
  </div>
</template>
