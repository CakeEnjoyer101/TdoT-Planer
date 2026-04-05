<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-code">404</div>
      <h1>Seite nicht gefunden</h1>
      <p>Der angeforderte Bereich existiert nicht oder ist nicht mehr verfügbar.</p>

      <q-btn
        class="error-btn"
        unelevated
        to="/"
        label="Zur Anmeldung"
        no-caps
      />
    </div>
  </div>
</template>

<script setup>
//
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--app-bg-gradient);
  color: var(--text-primary);
  font-family: var(--font-sans);
}

.error-card {
  width: min(100%, 520px);
  padding: 40px 36px;
  border-radius: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-soft);
}

.error-code {
  font-size: clamp(88px, 18vw, 160px);
  font-weight: 800;
  line-height: 1;
  margin-bottom: 12px;
  background: linear-gradient(145deg, #f8fbff 0%, #c7dbf8 50%, #78a5e8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

h1 {
  margin: 0 0 12px;
  font-size: 30px;
  font-weight: 800;
}

p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.7;
}

.error-btn {
  margin-top: 28px;
  padding: 10px 20px;
  border-radius: 12px;
  background: linear-gradient(145deg, var(--accent-primary), var(--accent-primary-strong));
  color: #ffffff;
  font-weight: 700;
}
</style>
