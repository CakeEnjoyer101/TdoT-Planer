<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { exportFile } from 'quasar'

// Formular Daten
const titel = ref("");
const beschreibung = ref("");
const datum = ref("");
const uhrzeit = ref("");
const tagDerWoche = ref("");

// Schüler Daten
const schueler = ref([]);
const filterKlasse = ref("");
const search = ref("");
const exportDialog = ref(false);
const exportFormat = ref("csv");
const includeAufgaben = ref(true);

// Popup States
const selectedSchueler = ref(null);
const selectedAufgabe = ref(null);
const showSchuelerPopup = ref(false);
const showAufgabePopup = ref(false);
const schuelerAufgaben = ref([]);
const loadingAufgaben = ref(false);
const activeTab = ref("aufgaben");


onMounted(async () => {
  const res = await axios.get("http://localhost:3000/auth/profile", {
    withCredentials: true,
  });

  if (res.data.user.klasse !== "Admin") {
    window.location.href = "http://localhost:9000/main";
    return;
  }

  await loadSchueler();
});

const loadSchueler = async () => {
  const res = await axios.get("http://localhost:3000/admin/schueler", {
    withCredentials: true,
  });
  schueler.value = res.data;
};

const submitAufgabe = async () => {
  await axios.post(
    "http://localhost:3000/aufgaben",
    {
      titel: titel.value,
      beschreibung: beschreibung.value,
      datum: datum.value,
      uhrzeit: uhrzeit.value,
      tagDerWoche: tagDerWoche.value,
    },
    { withCredentials: true }
  );

  // Formular zurücksetzen
  titel.value = "";
  beschreibung.value = "";
  datum.value = "";
  uhrzeit.value = "";
  tagDerWoche.value = "";

  alert("Aufgabe erstellt");
};

// Schüler Popup öffnen
const openSchuelerView = async (schueler) => {
  selectedSchueler.value = schueler;
  showSchuelerPopup.value = true;
  activeTab.value = 'aufgaben';
  loadingAufgaben.value = true;
  
  // Aufgaben für Schüler laden
  try {
    const res = await axios.get(`http://localhost:3000/admin/schueler/${schueler.userid}/aufgaben`, {
      withCredentials: true,
    });
    schuelerAufgaben.value = res.data;
  } catch (error) {
    console.error("Fehler beim Laden der Aufgaben:", error);
    schuelerAufgaben.value = [];
  } finally {
    loadingAufgaben.value = false;
  }
};

// Aufgabe Popup öffnen
const openAufgabeView = (aufgabe) => {
  selectedAufgabe.value = aufgabe;
  showAufgabePopup.value = true;
};

// Popups schließen
const closeSchuelerPopup = () => {
  showSchuelerPopup.value = false;
  selectedSchueler.value = null;
  schuelerAufgaben.value = [];
};

const closeAufgabePopup = () => {
  showAufgabePopup.value = false;
  selectedAufgabe.value = null;
};

// CSV/Excel Export
const exportSchuelerListe = async () => {
  try {
    const schuelerToExport = gefilterteSchueler.value;
    
    if (schuelerToExport.length === 0) {
      alert("Keine Schüler zum Exportieren gefunden");
      return;
    }

    let content = "";
    let filename = "";
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (exportFormat.value === "csv") {
      // CSV Export
      const headers = ["ID", "Name", "Email", "Klasse", "Erstellt am"];
      
      if (includeAufgaben.value) {
        headers.push("Anzahl Aufgaben", "Letzte Aufgabe", "Status");
      }
      
      content = headers.join(",") + "\n";
      
      for (const s of schuelerToExport) {
        let row = [
          `"${s.userid || ''}"`,
          `"${s.name || ''}"`,
          `"${s.email || ''}"`,
          `"${s.klasse || ''}"`,
          `"${formatDate(s.createdAt) || ''}"`
        ];
        
        if (includeAufgaben.value) {
          const aufgaben = await getSchuelerAufgaben(s.userid);
          row.push(
            aufgaben.length,
            `"${aufgaben[0]?.titel || 'Keine'}"`,
            `"${getStatusSummary(aufgaben)}"`
          );
        }
        
        content += row.join(",") + "\n";
      }
      
      filename = `schueler_liste_${timestamp}.csv`;
      
    } else if (exportFormat.value === "excel") {
      // Excel (als CSV mit Tab-separated)
      const headers = ["ID", "Name", "Email", "Klasse", "Erstellt am"];
      
      if (includeAufgaben.value) {
        headers.push("Anzahl Aufgaben", "Letzte Aufgabe", "Status");
      }
      
      content = headers.join("\t") + "\n";
      
      for (const s of schuelerToExport) {
        let row = [
          s.userid || '',
          s.name || '',
          s.email || '',
          s.klasse || '',
          formatDate(s.createdAt) || ''
        ];
        
        if (includeAufgaben.value) {
          const aufgaben = await getSchuelerAufgaben(s.userid);
          row.push(
            aufgaben.length,
            aufgaben[0]?.titel || 'Keine',
            getStatusSummary(aufgaben)
          );
        }
        
        content += row.join("\t") + "\n";
      }
      
      filename = `schueler_liste_${timestamp}.xls`;
    }
    
    // Datei herunterladen
    exportFile(filename, content, 'text/plain');
    
    // Erfolgsmeldung
    alert(`Export erfolgreich! ${schuelerToExport.length} Schüler exportiert.`);
    exportDialog.value = false;
    
  } catch (error) {
    console.error("Export error:", error);
    alert("Fehler beim Exportieren: " + error.message);
  }
};

// Hilfsfunktionen für Export
const getSchuelerAufgaben = async (userId) => {
  try {
    const res = await axios.get(`http://localhost:3000/admin/schueler/${userId}/aufgaben`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

const getStatusSummary = (aufgaben) => {
  if (aufgaben.length === 0) return "Keine Aufgaben";
  
  const completed = aufgaben.filter(a => a.status === 'completed').length;
  const pending = aufgaben.filter(a => !a.status || a.status === 'pending').length;
  
  return `${completed} abgeschlossen, ${pending} ausstehend`;
};

// Hilfsfunktionen
const sendEmail = (email) => {
  window.location.href = `mailto:${email}`;
};

const assignAufgabe = () => {
  alert(`Aufgabe für ${selectedSchueler.value.name} zuweisen`);
};

const markAsCompleted = () => {
  alert('Aufgabe als erledigt markieren');
};

// Formatierungsfunktionen
const formatDatum = (datumString) => {
  if (!datumString) return '';
  const date = new Date(datumString);
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE');
};

// Computed Properties
const klassen = computed(() => {
  return [...new Set(schueler.value.map(s => s.klasse))];
});

const gefilterteSchueler = computed(() => {
  return schueler.value.filter(s => {
    const klasseOk = !filterKlasse.value || s.klasse === filterKlasse.value;
    const searchOk =
      !search.value ||
      s.name.toLowerCase().includes(search.value.toLowerCase()) ||
      s.email.toLowerCase().includes(search.value.toLowerCase());

    return klasseOk && searchOk;
  });
});

// Wochentage für Select
const wochentage = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
];
</script>

<template>
  <div class="admin-page">
    <!-- Hauptlayout -->
    <div class="layout">
      <!-- Linke Seite: Aufgabe erstellen -->
      <div class="left-side">
        <div class="card">
          <h2 class="card-title">Neue Aufgabe erstellen</h2>
          
          <div class="form">
            <div class="form-group">
              <label>Titel *</label>
              <q-input 
                v-model="titel" 
                placeholder="Titel der Aufgabe" 
                outlined 
                dense
              />
            </div>

            <div class="form-group">
              <label>Beschreibung *</label>
              <q-input 
                v-model="beschreibung" 
                placeholder="Beschreibung der Aufgabe" 
                outlined 
                type="textarea"
                rows="3"
                dense
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Datum *</label>
                <q-input 
                  v-model="datum" 
                  placeholder="TT.MM.JJJJ" 
                  outlined 
                  dense
                />
              </div>
              
              <div class="form-group">
                <label>Uhrzeit</label>
                <q-input 
                  v-model="uhrzeit" 
                  placeholder="HH:MM" 
                  outlined 
                  dense
                />
              </div>
            </div>

            <div class="form-group">
              <label>Tag der Woche</label>
              <q-select
                v-model="tagDerWoche"
                :options="wochentage"
                placeholder="Wochentag auswählen"
                outlined
                dense
                clearable
              />
            </div>

            <q-btn
              color="primary"
              label="Aufgabe erstellen"
              @click="submitAufgabe"
              :disabled="!titel || !beschreibung || !datum"
              class="submit-btn"
              unelevated
            />
          </div>
        </div>

        <!-- Hinweis Box -->
        <div class="hint-box">
          <div class="hint-icon">ℹ️</div>
          <div class="hint-content">
            <h3>Hinweise</h3>
            <ul>
              <li>Titel und Beschreibung sind Pflichtfelder</li>
              <li>Datum muss angegeben werden</li>
              <li>Uhrzeit und Wochentag sind optional</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Rechte Seite: Schüler verwalten -->
      <div class="right-side">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Schüler verwalten</h2>
            <q-btn 
              color="secondary"
              icon="download"
              label="Exportieren"
              @click="exportDialog = true"
              class="export-btn"
              dense
              unelevated
            />
          </div>
          
          <!-- Filter Bereich -->
          <div class="filter-area">
            <div class="filter-row">
              <q-select
                v-model="filterKlasse"
                :options="klassen"
                placeholder="Alle Klassen"
                outlined
                dense
                clearable
                class="filter-select"
              />
              
              <q-input
                v-model="search"
                placeholder="Suche nach Name oder Email"
                outlined
                dense
                clearable
                class="search-input"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            
            <div class="results-info">
              <span>{{ gefilterteSchueler.length }} Schüler gefunden</span>
              <span v-if="filterKlasse" class="filter-active">
                (gefiltert nach: {{ filterKlasse }})
              </span>
            </div>
          </div>

          <!-- Schüler Liste -->
          <div class="schueler-list">
            <div 
              v-for="s in gefilterteSchueler" 
              :key="s.userid" 
              class="schueler-item"
              @click="openSchuelerView(s)"
            >
              <div class="avatar">
                {{ s.name.charAt(0) }}
              </div>
              <div class="schueler-info">
                <div class="name">{{ s.name }}</div>
                <div class="email">{{ s.email }}</div>
                <div class="klasse">{{ s.klasse }}</div>
              </div>
              <q-icon name="chevron_right" class="arrow" />
            </div>
          </div>

          <!-- Export Info Box -->
          <div class="export-info">
            <q-icon name="info" size="16px" />
            <span>Exportieren Sie Schülerlisten für Berichte oder Analysen</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Dialog -->
    <q-dialog v-model="exportDialog">
      <q-card class="export-dialog">
        <q-card-section>
          <div class="dialog-header">
            <h3>Schülerliste exportieren</h3>
            <q-btn flat round dense icon="close" @click="exportDialog = false" />
          </div>
        </q-card-section>

        <q-card-section>
          <div class="export-options">
            <div class="option-group">
              <label>Export-Format</label>
              <div class="format-buttons">
                <q-btn
                  :outline="exportFormat !== 'csv'"
                  :color="exportFormat === 'csv' ? 'primary' : 'grey'"
                  label="CSV"
                  @click="exportFormat = 'csv'"
                  class="format-btn"
                />
                <q-btn
                  :outline="exportFormat !== 'excel'"
                  :color="exportFormat === 'excel' ? 'primary' : 'grey'"
                  label="Excel"
                  @click="exportFormat = 'excel'"
                  class="format-btn"
                />
              </div>
            </div>

            <div class="option-group">
              <label>Inhalt</label>
              <q-toggle
                v-model="includeAufgaben"
                label="Aufgaben-Informationen mit einbeziehen"
                color="primary"
              />
              <div class="toggle-hint">
                Beinhaltet Anzahl der Aufgaben und Status-Übersicht
              </div>
            </div>

            <div class="export-summary">
              <div class="summary-item">
                <span>Anzahl Schüler:</span>
                <strong>{{ gefilterteSchueler.length }}</strong>
              </div>
              <div class="summary-item">
                <span>Dateiformat:</span>
                <strong>{{ exportFormat.toUpperCase() }}</strong>
              </div>
              <div v-if="filterKlasse" class="summary-item">
                <span>Filter:</span>
                <strong>{{ filterKlasse }}</strong>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" @click="exportDialog = false" />
          <q-btn 
            color="primary" 
            label="Exportieren" 
            @click="exportSchuelerListe"
            :disabled="gefilterteSchueler.length === 0"
            icon="download"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Schüler Popup - Zentriert und schöner -->
    <div v-if="showSchuelerPopup" class="dialog-overlay" @click="closeSchuelerPopup"></div>
    <div v-if="showSchuelerPopup" class="dialog-wrapper">
      <div class="dialog-content" v-if="selectedSchueler">
        <!-- Header -->
        <div class="dialog-header">
          <div class="header-left">
            <div class="schueler-avatar-large">
              {{ selectedSchueler.name.charAt(0) }}
            </div>
            <div>
              <h2 class="schueler-name">{{ selectedSchueler.name }}</h2>
              <div class="schueler-meta">
                <span class="meta-item">
                  <q-icon name="school" size="16px" />
                  {{ selectedSchueler.klasse }}
                </span>
                <span class="meta-item">
                  <q-icon name="person" size="16px" />
                  ID: {{ selectedSchueler.userid }}
                </span>
              </div>
            </div>
          </div>
          <q-btn 
            flat 
            round 
            dense 
            icon="close" 
            @click="closeSchuelerPopup"
            class="close-btn"
          />
        </div>

        <!-- Content -->
        <div class="dialog-body">
          <!-- Tabs -->
          <div class="tabs">
            <button 
              class="tab-button"
              :class="{ active: activeTab === 'aufgaben' }"
              @click="activeTab = 'aufgaben'"
            >
              <q-icon name="assignment" size="18px" />
              Aufgaben ({{ schuelerAufgaben.length }})
            </button>
            <button 
              class="tab-button"
              :class="{ active: activeTab === 'details' }"
              @click="activeTab = 'details'"
            >
              <q-icon name="info" size="18px" />
              Details
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Aufgaben Tab -->
            <div v-if="activeTab === 'aufgaben'" class="aufgaben-tab">
              <div v-if="loadingAufgaben" class="loading-state">
                <q-spinner size="40px" color="primary" />
                <p>Lade Aufgaben...</p>
              </div>
              
              <div v-else-if="schuelerAufgaben.length > 0" class="aufgaben-list">
                <div 
                  v-for="aufgabe in schuelerAufgaben" 
                  :key="aufgabe.id" 
                  class="aufgabe-card"
                  @click="openAufgabeView(aufgabe)"
                >
                  <div class="aufgabe-header">
                    <h3>{{ aufgabe.titel }}</h3>
                    <div class="aufgabe-actions">
                      <q-btn 
                        flat 
                        round 
                        dense 
                        icon="visibility" 
                        size="12px"
                        @click.stop="openAufgabeView(aufgabe)"
                        title="Details anzeigen"
                      />
                    </div>
                  </div>
                  
                  <div class="aufgabe-meta">
                    <div class="meta-row">
                      <span class="meta-label">
                        <q-icon name="event" size="14px" />
                        {{ formatDatum(aufgabe.datum) }}
                      </span>
                      <span v-if="aufgabe.uhrzeit" class="meta-label">
                        <q-icon name="schedule" size="14px" />
                        {{ aufgabe.uhrzeit }} Uhr
                      </span>
                    </div>
                    <div v-if="aufgabe.tagDerWoche" class="meta-row">
                      <span class="meta-label">
                        <q-icon name="calendar_today" size="14px" />
                        {{ aufgabe.tagDerWoche }}
                      </span>
                    </div>
                  </div>
                  
                  <p class="aufgabe-beschreibung">
                    {{ aufgabe.beschreibung.substring(0, 100) }}{{ aufgabe.beschreibung.length > 100 ? '...' : '' }}
                  </p>
                  
                  <div class="aufgabe-footer">
                    <div class="status-badge" :class="aufgabe.status || 'pending'">
                      {{ aufgabe.status || 'Ausstehend' }}
                    </div>
                    <span class="aufgabe-id">#{{ aufgabe.id }}</span>
                  </div>
                </div>
              </div>
              
              <div v-else class="empty-state">
                <div class="empty-icon">
                  <q-icon name="assignment" size="48px" />
                </div>
                <h3>Keine Aufgaben</h3>
                <p>Dieser Schüler hat noch keine zugewiesenen Aufgaben.</p>
              </div>
            </div>

            <!-- Details Tab -->
            <div v-if="activeTab === 'details'" class="details-tab">
              <div class="details-grid">
                <div class="detail-item">
                  <label>Vollständiger Name</label>
                  <p>{{ selectedSchueler.name }}</p>
                </div>
                <div class="detail-item">
                  <label>Email Adresse</label>
                  <p class="email-text">{{ selectedSchueler.email }}</p>
                  <q-btn 
                    flat 
                    dense 
                    icon="email" 
                    size="12px"
                    class="email-btn"
                    @click="sendEmail(selectedSchueler.email)"
                  />
                </div>
                <div class="detail-item">
                  <label>Klasse</label>
                  <p>
                    <span class="klasse-badge">{{ selectedSchueler.klasse }}</span>
                  </p>
                </div>
                <div class="detail-item">
                  <label>Benutzer ID</label>
                  <p class="user-id">{{ selectedSchueler.userid }}</p>
                </div>
                <div class="detail-item">
                  <label>Registriert seit</label>
                  <p>{{ formatDate(selectedSchueler.createdAt) }}</p>
                </div>
                <div class="detail-item">
                  <label>Anzahl Aufgaben</label>
                  <p>{{ schuelerAufgaben.length }}</p>
                </div>
              </div>
              
              <div class="quick-actions">
                <h4>Schnellaktionen</h4>
                <div class="action-buttons">
                  <q-btn 
                    color="primary" 
                    icon="add" 
                    label="Aufgabe zuweisen"
                    dense
                    @click="assignAufgabe"
                  />
                  <q-btn 
                    color="secondary" 
                    icon="email" 
                    label="Email senden"
                    dense
                    @click="sendEmail(selectedSchueler.email)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <q-btn 
            flat 
            label="Schließen" 
            @click="closeSchuelerPopup"
            class="close-footer-btn"
          />
          <div class="footer-info">
            Zuletzt aktualisiert: {{ formatDate(new Date()) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Aufgabe Popup -->
    <div v-if="showAufgabePopup" class="dialog-overlay" @click="closeAufgabePopup"></div>
    <div v-if="showAufgabePopup" class="dialog-wrapper">
      <div class="dialog-content aufgabe-popup" v-if="selectedAufgabe">
        <!-- Header -->
        <div class="dialog-header aufgabe-header">
          <div class="header-left">
            <div class="aufgabe-icon">
              <q-icon name="assignment" size="32px" />
            </div>
            <div>
              <h2 class="aufgabe-title">{{ selectedAufgabe.titel }}</h2>
              <div class="aufgabe-meta-header">
                <span class="meta-item">
                  <q-icon name="event" size="16px" />
                  {{ formatDatum(selectedAufgabe.datum) }}
                </span>
                <span v-if="selectedAufgabe.uhrzeit" class="meta-item">
                  <q-icon name="schedule" size="16px" />
                  {{ selectedAufgabe.uhrzeit }} Uhr
                </span>
                <span v-if="selectedAufgabe.tagDerWoche" class="meta-item">
                  <q-icon name="calendar_today" size="16px" />
                  {{ selectedAufgabe.tagDerWoche }}
                </span>
              </div>
            </div>
          </div>
          <q-btn 
            flat 
            round 
            dense 
            icon="close" 
            @click="closeAufgabePopup"
            class="close-btn"
          />
        </div>

        <!-- Content -->
        <div class="dialog-body aufgabe-body">
          <div class="section">
            <h3>Beschreibung</h3>
            <div class="beschreibung-content">
              {{ selectedAufgabe.beschreibung }}
            </div>
          </div>
          
          <div class="details-section">
            <div class="detail-box">
              <h3>Details</h3>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value status-badge" :class="selectedAufgabe.status || 'pending'">
                    {{ selectedAufgabe.status || 'Ausstehend' }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Erstellt am:</span>
                  <span class="detail-value">{{ formatDate(selectedAufgabe.erstelltAm) }}</span>
                </div>
                <div v-if="selectedAufgabe.fälligkeitsDatum" class="detail-row">
                  <span class="detail-label">Fällig am:</span>
                  <span class="detail-value">{{ formatDate(selectedAufgabe.fälligkeitsDatum) }}</span>
                </div>
              </div>
            </div>
            
            <div class="schueler-box" v-if="selectedSchueler">
              <h3>Zugewiesen an</h3>
              <div class="schueler-info-card">
                <div class="schueler-avatar-mini">
                  {{ selectedSchueler.name.charAt(0) }}
                </div>
                <div class="schueler-details">
                  <div class="schueler-name">{{ selectedSchueler.name }}</div>
                  <div class="schueler-klasse">{{ selectedSchueler.klasse }}</div>
                  <div class="schueler-email">{{ selectedSchueler.email }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <q-btn 
            flat 
            label="Schließen" 
            @click="closeAufgabePopup"
            class="close-footer-btn"
          />
          <div class="footer-actions">
            <q-btn 
              color="primary" 
              label="Als erledigt markieren"
              dense
              v-if="selectedAufgabe.status !== 'completed'"
              @click="markAsCompleted"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  padding: 20px;
  background: #f5f5f5;
  position: relative;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Karten Styling */
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-title {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
  font-weight: 600;
}

.export-btn {
  font-weight: 500;
}

/* Formular Styling */
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
  font-size: 0.95rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.submit-btn {
  margin-top: 10px;
  height: 44px;
  font-weight: 500;
}

/* Hinweis Box */
.hint-box {
  margin-top: 20px;
  background: #e8f4ff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.hint-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.hint-content h3 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: #333;
}

.hint-content ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.hint-content li {
  margin-bottom: 4px;
  font-size: 0.9rem;
}

/* Filter Bereich */
.filter-area {
  margin-bottom: 24px;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  margin-bottom: 12px;
}

.results-info {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-active {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Schüler Liste */
.schueler-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.schueler-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.schueler-item:hover {
  background: white;
  border-color: #e0e0e0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #7b1fa2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 16px;
  flex-shrink: 0;
}

.schueler-info {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.email {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.klasse {
  font-size: 0.8rem;
  color: #7b1fa2;
  background: #f3e5f5;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.arrow {
  color: #999;
  margin-left: 12px;
}

/* Export Info Box */
.export-info {
  background: #f0f7ff;
  border: 1px solid #d1e9ff;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #1976d2;
  font-size: 0.9rem;
}

.export-info q-icon {
  flex-shrink: 0;
}

/* Export Dialog */
.export-dialog {
  width: 500px;
  max-width: 90vw;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-group label {
  font-weight: 500;
  color: #555;
  font-size: 0.95rem;
}

.format-buttons {
  display: flex;
  gap: 12px;
}

.format-btn {
  flex: 1;
  height: 44px;
}

.toggle-hint {
  font-size: 0.85rem;
  color: #666;
  margin-left: 40px;
  margin-top: 4px;
}

.export-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item span {
  color: #666;
}

.summary-item strong {
  color: #333;
}

/* Popup Overlay und Wrapper */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9998;
}

.dialog-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-content {
  position: relative;
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
  overflow: hidden;
  z-index: 1;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 32px;
  background: linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%);
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.schueler-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
  color: #7b1fa2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.schueler-name {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.schueler-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.close-btn {
  color: white !important;
}

/* Tabs */
.tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin: 0 32px;
}

.tab-button {
  flex: 1;
  padding: 16px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: #7b1fa2;
}

.tab-button.active {
  color: #7b1fa2;
  border-bottom-color: #7b1fa2;
}

/* Tab Content */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

/* Aufgaben Tab */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loading-state p {
  margin-top: 16px;
}

.aufgaben-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.aufgabe-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.aufgabe-card:hover {
  background: white;
  border-color: #7b1fa2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(123, 31, 162, 0.1);
}

.aufgabe-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.aufgabe-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
  flex: 1;
}

.aufgabe-meta {
  margin-bottom: 12px;
}

.meta-row {
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.meta-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #666;
}

.aufgabe-beschreibung {
  margin: 0 0 16px 0;
  color: #555;
  line-height: 1.5;
  font-size: 0.9rem;
}

.aufgabe-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.in-progress {
  background: #d1ecf1;
  color: #0c5460;
}

.aufgabe-id {
  font-size: 0.8rem;
  color: #999;
  font-family: monospace;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-icon {
  margin-bottom: 16px;
  color: #ccc;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.empty-state p {
  margin: 0;
}

/* Details Tab */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.detail-item {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.detail-item label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.detail-item p {
  margin: 0;
  font-size: 1rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.email-text {
  word-break: break-all;
  flex: 1;
}

.email-btn {
  flex-shrink: 0;
}

.klasse-badge {
  background: #7b1fa2;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.user-id {
  font-family: monospace;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.quick-actions {
  border-top: 1px solid #e0e0e0;
  padding-top: 24px;
}

.quick-actions h4 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* Footer */
.dialog-footer {
  padding: 20px 32px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.close-footer-btn {
  color: #666;
}

.footer-info {
  font-size: 0.85rem;
  color: #999;
}

/* Aufgabe Popup spezifische Styles */
.aufgabe-popup .dialog-header {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

.aufgabe-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
  color: #2196f3;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.aufgabe-title {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
}

.aufgabe-meta-header {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.aufgabe-body {
  padding: 24px 32px;
}

.section {
  margin-bottom: 32px;
}

.section h3 {
  margin: 0 0 16px 0;
  font-size: 1.2rem;
  color: #333;
}

.beschreibung-content {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

.details-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.detail-box, .schueler-box {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: #666;
}

.detail-value {
  color: #333;
}

.schueler-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.schueler-avatar-mini {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #2196f3;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.schueler-details {
  flex: 1;
}

.schueler-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.schueler-klasse {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 2px;
}

.schueler-email {
  font-size: 0.85rem;
  color: #2196f3;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

/* Responsive */
@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .admin-page {
    padding: 12px;
  }
  
  .card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .schueler-item {
    padding: 12px;
  }
  
  .export-dialog {
    width: 90vw;
  }
  
  .format-buttons {
    flex-direction: column;
  }
  
  .dialog-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .dialog-header {
    padding: 20px 24px;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .tabs {
    margin: 0 24px;
  }
  
  .tab-content {
    padding: 20px 24px;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .details-section {
    grid-template-columns: 1fr;
  }
}
</style>