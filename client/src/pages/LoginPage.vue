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
  <div class="login-container">
    <div class="background-pattern">
      <div class="grid-pattern"></div>
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <div class="content-wrapper">
      <div class="branding-section">
        <div class="branding-content">
          <div class="logo-wrapper">
            <div class="logo-outer-ring">
              <div class="logo-inner-ring">
                <q-icon name="school" class="logo-icon" />
              </div>
            </div>
          </div>

          <h1 class="school-title">HTL Wien West</h1>
          <p class="school-subtitle">Aufgaben Planner</p>

          <div class="feature-list">
            <div
              class="feature-item"
              v-for="(feature, i) in features"
              :key="i"
              :style="{ animationDelay: `${i * 0.1}s` }"
            >
              <q-icon :name="feature.icon" class="feature-icon" />
              <span class="feature-text">{{ feature.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <q-card class="login-card">
          <q-card-section class="card-content">
            <div class="form-header">
              <h2 class="form-title">
                {{ isRegister ? "Account erstellen" : "Willkommen zurück" }}
              </h2>
              <p class="form-subtitle">
                {{
                  isRegister
                    ? "Registriere dich mit deiner Schul-Email"
                    : "Melde dich an, um fortzufahren"
                }}
              </p>
            </div>

            <q-form @submit.prevent="handleSubmit" class="auth-form">
              <div class="input-group">
                <label class="input-label">Email-Adresse</label>
                <q-input
                  v-model="email"
                  type="email"
                  outlined
                  required
                  color="red-7"
                  placeholder="dein.name@htlwienwest.at"
                  :hint="emailHint"
                  :error="isRegister && email && !isEmailValid"
                  :rules="[(v) => !!v || 'Email ist erforderlich']"
                  :class="{ 'lehrer-email': isLehrerEmail }"
                  class="custom-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="mail" class="input-icon" />
                  </template>
                </q-input>
              </div>

              <div v-if="isRegister" class="input-group">
                <label class="input-label">Vollständiger Name</label>
                <q-input
                  v-model="name"
                  outlined
                  required
                  color="red-7"
                  placeholder="Max Mustermann"
                  :rules="[(v) => !!v || 'Name ist erforderlich']"
                  class="custom-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="person" class="input-icon" />
                  </template>
                </q-input>
              </div>

              <div class="input-group">
                <label class="input-label">Passwort</label>
                <q-input
                  v-model="password"
                  type="password"
                  outlined
                  required
                  color="red-7"
                  :placeholder="
                    isRegister ? 'Mindestens 6 Zeichen' : '••••••••'
                  "
                  :rules="[
                    (v) => !!v || 'Passwort ist erforderlich',
                    (v) =>
                      !isRegister || v.length >= 6 || 'Mindestens 6 Zeichen',
                  ]"
                  class="custom-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="lock" class="input-icon" />
                  </template>
                </q-input>
              </div>

              <q-btn
                type="submit"
                unelevated
                size="lg"
                color="red-7"
                class="submit-btn"
                :loading="isLoading"
                :disable="isLoading"
              >
                <span class="btn-content">
                  <q-icon
                    :name="isRegister ? 'person_add' : 'login'"
                    size="20px"
                  />
                  <span>{{
                    isRegister ? "Jetzt registrieren" : "Anmelden"
                  }}</span>
                </span>
              </q-btn>

              <div class="divider">
                <span class="divider-text">oder</span>
              </div>

              <q-btn flat color="grey-7" class="toggle-btn" @click="toggleMode">
                {{
                  isRegister
                    ? "Bereits registriert? Anmelden"
                    : "Noch kein Account? Registrieren"
                }}
              </q-btn>
            </q-form>

            <transition name="message-fade">
              <div v-if="error" class="message-box error-box">
                <q-icon name="error" size="20px" />
                <span>{{ error }}</span>
              </div>
            </transition>

            <transition name="message-fade">
              <div v-if="success" class="message-box success-box">
                <q-icon name="check_circle" size="20px" />
                <span>{{ success }}</span>
              </div>
            </transition>
          </q-card-section>
        </q-card>

        <p class="footer-text">
          HTL Wien West © 2025 – Organisiere deine Aufgaben effizient
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      features: [
        { icon: "task_alt", text: "Aufgaben organisieren" },
        { icon: "event", text: "Termine verwalten" },
        { icon: "groups", text: "Mit Lehrern zusammenarbeiten" },
        { icon: "analytics", text: "Fortschritt tracken" },
      ],
    };
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap");

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
  font-family: "Outfit", sans-serif;
}

.background-pattern {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.4;
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
      rgba(211, 47, 47, 0.03) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(211, 47, 47, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 8s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #d32f2f 0%, transparent 70%);
  top: -10%;
  left: -5%;
  animation-delay: 0s;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #c62828 0%, transparent 70%);
  bottom: -15%;
  right: -10%;
  animation-delay: 2s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, #b71c1c 0%, transparent 70%);
  top: 50%;
  left: 50%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9);
  }
}

.content-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
  gap: 60px;
  align-items: center;
}

.branding-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeInLeft 0.8s ease-out;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.branding-content {
  text-align: center;
  color: white;
}

.logo-wrapper {
  margin-bottom: 40px;
  display: inline-block;
  animation: logoAppear 1s ease-out;
}

@keyframes logoAppear {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-180deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.logo-outer-ring {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 40px rgba(211, 47, 47, 0.4),
    0 0 0 20px rgba(211, 47, 47, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.1);
  animation: ringPulse 3s ease-in-out infinite;
}

@keyframes ringPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 10px 40px rgba(211, 47, 47, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 15px 50px rgba(211, 47, 47, 0.6);
  }
}

.logo-inner-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(211, 47, 47, 0.3);
}

.logo-icon {
  font-size: 80px !important;
  color: #d32f2f;
  filter: drop-shadow(0 0 20px rgba(211, 47, 47, 0.6));
}

.school-title {
  font-size: 56px;
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 0%, #d32f2f 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  letter-spacing: -1px;
  animation: titleGlow 2s ease-in-out infinite alternate;
}

@keyframes titleGlow {
  from {
    filter: drop-shadow(0 0 10px rgba(211, 47, 47, 0.3));
  }
  to {
    filter: drop-shadow(0 0 20px rgba(211, 47, 47, 0.6));
  }
}

.school-subtitle {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
  margin-bottom: 50px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
  max-width: 400px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(211, 47, 47, 0.2);
  width: 100%;
  transition: all 0.3s ease;
  animation: featureSlideIn 0.6s ease-out backwards;
}

@keyframes featureSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.feature-item:hover {
  background: rgba(211, 47, 47, 0.1);
  border-color: rgba(211, 47, 47, 0.4);
  transform: translateX(8px);
}

.feature-icon {
  color: #d32f2f;
  font-size: 24px !important;
}

.feature-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  font-weight: 500;
}

.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeInRight 0.8s ease-out;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
  overflow: hidden;
  border: 1px solid rgba(211, 47, 47, 0.1);
}

.card-content {
  padding: 48px !important;
}

.form-header {
  margin-bottom: 36px;
  text-align: center;
}

.form-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.form-subtitle {
  font-size: 15px;
  color: #666;
  font-weight: 400;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  padding-left: 4px;
}

.custom-input {
  transition: all 0.3s ease;
}

.custom-input :deep(.q-field__control) {
  height: 56px;
  border-radius: 12px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.custom-input :deep(.q-field__control):hover {
  border-color: #d32f2f;
  background: #ffffff;
}

.custom-input :deep(.q-field--focused .q-field__control) {
  border-color: #d32f2f !important;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(211, 47, 47, 0.1);
}

.custom-input :deep(.q-field__native) {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
}

.custom-input :deep(.q-field__native::placeholder) {
  color: #999;
}

.input-icon {
  color: #d32f2f;
  font-size: 22px !important;
}

.lehrer-email :deep(.q-field__control) {
  border-color: #388e3c !important;
  background: #f1f8f4;
}

.lehrer-email :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 4px rgba(56, 142, 60, 0.1) !important;
}

.lehrer-email .input-icon {
  color: #388e3c;
}

.submit-btn {
  height: 56px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
  box-shadow: 0 4px 14px rgba(211, 47, 47, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  margin-top: 8px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(211, 47, 47, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.submit-btn:active {
  transform: translateY(0);
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 8px 0;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.divider-text {
  padding: 0 16px;
  color: #999;
  font-size: 13px;
  font-weight: 500;
}

.toggle-btn {
  height: 48px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
  color: #666;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: rgba(211, 47, 47, 0.05);
  color: #d32f2f;
}

.message-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 20px;
}

.error-box {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.success-box {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.message-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.footer-text {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

@media (max-width: 1200px) {
  .content-wrapper {
    flex-direction: column;
    gap: 40px;
  }

  .branding-section {
    width: 100%;
  }

  .form-section {
    width: 100%;
    max-width: 500px;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 20px;
  }

  .card-content {
    padding: 32px 24px !important;
  }

  .school-title {
    font-size: 42px;
  }

  .school-subtitle {
    font-size: 18px;
  }

  .logo-outer-ring {
    width: 140px;
    height: 140px;
  }

  .logo-icon {
    font-size: 60px !important;
  }

  .feature-list {
    gap: 12px;
  }

  .feature-item {
    padding: 12px 16px;
  }

  .form-title {
    font-size: 26px;
  }
}

@media (max-width: 480px) {
  .school-title {
    font-size: 32px;
  }

  .school-subtitle {
    font-size: 16px;
  }

  .card-content {
    padding: 24px 20px !important;
  }

  .form-title {
    font-size: 24px;
  }
}
</style>
