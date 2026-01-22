<script setup>
import { ref, computed } from "vue";
import axios from "axios";

const email = ref("");
const password = ref("");
const name = ref("");

const error = ref(null);
const success = ref(null);
const isLoading = ref(false);
const isRegister = ref(false);

/* ================= VALIDIERUNG ================= */

const isEmailValid = computed(() => {
  if (!isRegister.value || !email.value) return true;

  const schuelerEmailRegex = /^[a-z]+\.[a-z][0-9]{2}@htlwienwest\.at$/;
  const lehrerEmailRegex = /^[a-z]+\.[a-z]+@htlwienwest\.at$/;

  return (
    schuelerEmailRegex.test(email.value.toLowerCase()) ||
    lehrerEmailRegex.test(email.value.toLowerCase())
  );
});

const isLehrerEmail = computed(() => {
  if (!isRegister.value || !email.value) return false;
  return /^[a-z]+\.[a-z]+@htlwienwest\.at$/.test(email.value.toLowerCase());
});

const emailHint = computed(() => {
  if (!isRegister.value) return "";
  if (email.value && !isEmailValid.value) return "";
  if (isLehrerEmail.value) return "Lehrer-Account erkannt";
  return "";
});

/* ================= SUBMIT ================= */

async function handleSubmit() {
  error.value = null;
  success.value = null;

  if (isRegister.value && !isEmailValid.value) return;

  isLoading.value = true;

  try {
    if (isRegister.value) {
      await axios.post(
        "http://localhost:3000/auth/register",
        {
          email: email.value,
          name: name.value,
          password: password.value,
        },
        { withCredentials: true }
      );

      success.value =
        "Registrierung erfolgreich! Bitte prüfe dein E-Mail-Postfach und bestätige deinen Account.";
      isRegister.value = false;

      password.value = "";
      name.value = "";
    } else {
      await axios.post(
        "http://localhost:3000/auth/login",
        {
          email: email.value,
          password: password.value,
        },
        { withCredentials: true }
      );

      window.location.href = "http://localhost:9000/main";
    }
  } catch (err) {
    error.value = err.response?.data?.error || "Ein Fehler ist aufgetreten";
  } finally {
    isLoading.value = false;
  }
}

function toggleMode() {
  isRegister.value = !isRegister.value;
  error.value = null;
  success.value = null;
  email.value = "";
  password.value = "";
  name.value = "";
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

          <h4 class="text-h4 text-red-7 q-mb-lg">
            {{ isRegister ? "Registrieren" : "Anmelden" }}
          </h4>

          <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
            <q-input
              v-model="email"
              label="Email"
              type="email"
              outlined
              required
              color="red-7"
              :hint="emailHint"
              :error="isRegister && email && !isEmailValid"
              :rules="[(v) => !!v || 'Email ist erforderlich']"
              :class="{ 'lehrer-email': isLehrerEmail }"
            />

            <q-input
              v-if="isRegister"
              v-model="name"
              label="Vollständiger Name"
              outlined
              required
              color="red-7"
              :rules="[(v) => !!v || 'Name ist erforderlich']"
            />

            <q-input
              v-model="password"
              label="Passwort"
              type="password"
              outlined
              required
              color="red-7"
              :placeholder="isRegister ? 'Mindestens 6 Zeichen' : 'Dein Passwort'"
              :rules="[
                (v) => !!v || 'Passwort ist erforderlich',
                (v) => !isRegister || v.length >= 6 || 'Mindestens 6 Zeichen',
              ]"
            />

            <q-btn
              type="submit"
              size="lg"
              color="red-7"
              class="full-width"
              :loading="isLoading"
              :icon="isRegister ? 'person_add' : 'login'"
              :label="isRegister ? 'Registrieren' : 'Anmelden'"
            />

            <q-btn
              flat
              color="red-5"
              class="full-width"
              @click="toggleMode"
              :label="isRegister ? 'Zurück zum Login' : 'Noch keinen Account?'"
            />
          </q-form>

          <div
            v-if="error"
            class="text-red-7 q-mt-md q-pa-sm bg-red-1 rounded-borders"
          >
            {{ error }}
          </div>

          <div
            v-if="success"
            class="text-green-8 q-mt-md q-pa-sm bg-green-1 rounded-borders"
          >
            {{ success }}
          </div>

          <div class="q-mt-xl text-caption text-grey-6">
            HTL Wien West – Organisiere deine Aufgaben effizient
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
.full-height {
  min-height: 100vh;
}

.login-card {
  border-radius: 20px;
  border: 3px solid #d32f2f;
}

.logo-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(211, 47, 47, 0.3);
}

/* Lehrer-Mail grün */
:deep(.lehrer-email .q-field__control) {
  border-color: #388e3c !important;
}
</style>
