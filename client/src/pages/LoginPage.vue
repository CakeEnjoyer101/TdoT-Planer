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
  <div class="row justify-center items-center full-height">
    <div class="col-12 col-md-6 col-lg-4">
      <q-card class="login-card q-pa-lg shadow-10">
        <q-card-section class="text-center">
          <div class="school-logo q-mb-lg">
            <div class="logo-circle bg-red-5 text-white q-mx-auto">
              <q-icon name="school" size="xl" />
            </div>
            <div class="text-h4 text-red-7 q-mt-md text-weight-bold">
              HTL Wien West
            </div>
            <div class="text-h6 text-grey-8">Aufgaben Planer</div>
          </div>

          <div class="q-mt-xl">
            <h4 class="text-h4 text-red-7 q-mb-lg">Anmelden</h4>

            <q-btn
              label="Mit Google einloggen"
              @click="loginWithGoogle"
              color="red-7"
              class="full-width q-mb-md"
              size="lg"
              icon="login"
            />

            <q-btn
              label="Dev Login (User)"
              @click="loginDev"
              color="red-5"
              class="full-width q-mb-md"
              size="lg"
              outline
            />

            <q-btn
              label="Dev Login (Admin)"
              @click="loginAdminDev"
              color="red-8"
              class="full-width"
              size="lg"
              outline
            />
          </div>

          <div
            v-if="error"
            class="text-red-5 q-mt-md q-pa-sm bg-red-1 rounded-borders"
          >
            {{ error }}
          </div>

          <div class="q-mt-xl text-caption text-grey-6">
            HTL Wien West - Organisiere deine Aufgaben effizient
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
}

.login-card {
  border-radius: 20px;
  border: 3px solid #d32f2f;
}

.logo-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid white;
  box-shadow: 0 4px 15px rgba(211, 47, 47, 0.3);
}

.full-height {
  min-height: 100vh;
}
</style>
