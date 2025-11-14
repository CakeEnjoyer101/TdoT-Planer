<script setup>
import { ref, computed } from "vue";
import axios from "axios";

const email = ref("");
const password = ref("");
const name = ref("");
const error = ref(null);
const isLoading = ref(false);
const isRegister = ref(false);

const isEmailValid = computed(() => {
  if (!isRegister.value || !email.value) return true;

  const schuelerEmailRegex = /^[a-z]+\.[a-z][0-9]{2}@htlwienwest\.at$/;
  const lehrerEmailRegex = /^[a-z]+\.[a-z]+@htlwienwest\.at$/;

  return schuelerEmailRegex.test(email.value.toLowerCase()) ||
         lehrerEmailRegex.test(email.value.toLowerCase());
});

const isLehrerEmail = computed(() => {
  if (!isRegister.value || !email.value) return false;

  const lehrerEmailRegex = /^[a-z]+\.[a-z]+@htlwienwest\.at$/;
  return lehrerEmailRegex.test(email.value.toLowerCase());
});

const emailHint = computed(() => {
  if (!isRegister.value) return "";

  if (email.value && !isEmailValid.value) {
    return ;
  }

  if (isLehrerEmail.value) {
    return "Lehrer-Account erkannt";
  }

  return "";
});

async function handleSubmit() {
  error.value = null;

  if (isRegister.value && !isEmailValid.value) {
    return;
  }

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

      window.location.href = "http://localhost:9000/main";
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

          <div class="q-mt-xl">
            <h4 class="text-h4 text-red-7 q-mb-lg">
              {{ isRegister ? "Registrieren" : "Anmelden" }}
            </h4>

            <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
              <q-input
                v-model="email"
                label="Email"
                type="email"
                required
                color="red-7"
                outlined
                :rules="[
                  val => !!val || 'Email ist erforderlich',
                ]"
                :hint="emailHint"
                :error="isRegister && email && !isEmailValid"
                :class="{ 'lehrer-email': isLehrerEmail }"
              />

              <q-input
                v-if="isRegister"
                v-model="name"
                label="Vollständiger Name"
                required
                color="red-7"
                outlined
                :rules="[val => !!val || 'Name ist erforderlich']"
              />

              <q-input
                v-model="password"
                label="Passwort"
                :type="isRegister ? 'text' : 'password'"
                required
                color="red-7"
                outlined
                :placeholder="isRegister ? 'Mindestens 6 Zeichen' : 'Dein Passwort'"
                :rules="[
                  val => !!val || 'Passwort ist erforderlich',
                  val => !isRegister || val.length >= 6 || 'Mindestens 6 Zeichen'
                ]"
              />

              <q-btn
                :label="isRegister ? 'Registrieren' : 'Anmelden'"
                type="submit"
                :loading="isLoading"
                color="red-7"
                class="full-width q-mb-md"
                size="lg"
                :icon="isRegister ? 'person_add' : 'login'"
              />

              <q-btn
                :label="isRegister ? 'Zurück zum Login' : 'Noch keinen Account?'"
                @click="toggleMode"
                color="red-5"
                class="full-width"
                size="md"
                outline
              />
            </q-form>
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

/* Grüne Umrandung für Lehrer-Emails */
:deep(.lehrer-email .q-field__control) {
  border-color: #388e3c !important;
}
</style>