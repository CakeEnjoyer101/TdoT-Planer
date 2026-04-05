# Admin-Dokumentation

## Zweck des Admin-Bereichs

Der Admin-Bereich ist die zentrale Stelle fuer die Organisation des Tags der offenen Tuer. Hier werden Aufgaben erstellt, Lehrer zugewiesen und der Anmeldestatus aller relevanten Schueler ueberwacht.

## Voraussetzungen

Fuer den Zugriff brauchst du einen bereits freigeschalteten Admin-Account.

Wichtig:

- Ein normal registrierter Benutzer wird nicht automatisch zum Admin.
- Der Admin-Bereich ist nur fuer Konten mit Admin-Berechtigung gedacht.

## Admin-Bereich oeffnen

1. Melde dich mit deinem Admin-Konto an.
2. Oeffne die Hauptseite.
3. Klicke oben auf den Button `Admin`.

Danach gelangst du ins `Admin Dashboard`.

## Aufbau des Admin Dashboards

Das Dashboard ist in vier Hauptbereiche gegliedert:

1. Neue Aufgabe erstellen
2. Lehrer-Accounts verwalten
3. Schuelerstatus und Entschuldigungen
4. Noch nicht angemeldet

## 1. Neue Aufgabe erstellen

Mit diesem Formular legst du neue Aufgaben fuer die Website an.

### Pflichtfelder

- Titel
- Datum fuer Tag 1
- Uhrzeit fuer Tag 1
- Datum fuer Tag 2
- Uhrzeit fuer Tag 2
- mindestens eine Zielklasse

### Optionale Felder

- Beschreibung
- Lehrer

### Vorgehen

1. Trage einen eindeutigen Titel ein.
2. Fuege bei Bedarf eine Beschreibung hinzu.
3. Lege Datum und Uhrzeit fuer Tag 1 fest.
4. Lege Datum und Uhrzeit fuer Tag 2 fest.
5. Waehle optional bereits einen Lehrer aus.
6. Waehle eine oder mehrere Zielklassen.
7. Klicke auf `Aufgabe erstellen`.

### Empfehlung fuer die Praxis

- Verwende kurze, klar erkennbare Titel.
- Weise die Aufgabe nur den Klassen zu, fuer die sie wirklich gedacht ist.
- Trage fuer beide Tage korrekte Zeiten ein, damit Schueler und Lehrer dieselbe Information sehen.

## 2. Lehrer-Accounts verwalten

In diesem Bereich siehst du alle vorhandenen Lehrer-Accounts und kannst ihnen Aufgaben zuweisen.

### Was hier moeglich ist

- einem Lehrer eine Aufgabe zuweisen
- eine bestehende Zuweisung aendern
- eine Zuweisung wieder entfernen

### So weist du eine Aufgabe zu

1. Suche den gewuenschten Lehrer in der Liste.
2. Oeffne das Auswahlfeld `Aufgabe waehlen`.
3. Waehle die passende Aufgabe aus.

Die Aenderung wird direkt gespeichert.

### Wichtige Regel

- Ein Lehrer kann aktuell nur einer Aufgabe gleichzeitig zugeordnet sein.
- Mehrere Lehrer koennen aber dieselbe Aufgabe betreuen.

### Zuweisung entfernen

Waehle bei einem Lehrer `Keine Aufgabe`, wenn du die aktuelle Zuordnung loeschen willst.

## 3. Schuelerstatus und Entschuldigungen

Dieser Bereich zeigt alle relevanten Schueler mit ihrem aktuellen Stand fuer beide Veranstaltungstage.

Zu jedem Schueler siehst du:

- Name
- E-Mail
- Klasse
- Aufgabe an Tag 1
- Aufgabe an Tag 2
- Entschuldigungsstatus pro Tag

### Schueler suchen

Ueber das Suchfeld kannst du nach folgenden Angaben filtern:

- Name
- E-Mail
- Klasse

### Entschuldigung fuer einen Tag setzen oder entfernen

1. Suche den betreffenden Schueler.
2. Verwende die Buttons fuer `Tag 1` oder `Tag 2`.
3. Klicke auf den gewuenschten Tag, um die Entschuldigung ein- oder auszuschalten.

### Wichtiger Effekt von Entschuldigungen

Wenn ein Schueler fuer einen Tag entschuldigt wird:

- wird dieser Tag als entschuldigt markiert
- eine bestehende Einteilung fuer genau diesen Tag wird entfernt

Das ist wichtig, damit die Uebersicht aktuell bleibt.

## 4. Noch nicht angemeldet

In diesem Bereich siehst du alle Schueler, die noch nicht vollstaendig eingeteilt sind.

Die Liste hilft dir dabei, schnell zu erkennen:

- wer fuer Tag 1 noch keine Aufgabe hat
- wer fuer Tag 2 noch keine Aufgabe hat
- bei wem noch Handlungsbedarf besteht

## Welche Schueler muessen sich anmelden?

Das System behandelt die Klassen unterschiedlich.

- 1. Klassen muessen sich nicht fuer Aufgaben anmelden.
- 5. Klassen erhalten ihre Sonderansicht zur Diplomarbeitspraesentation.
- Schueler aus den uebrigen Klassen sollen fuer die Veranstaltungstage eingeteilt sein.

Darum erscheinen vor allem die relevanten mittleren Klassen in der Uebersicht `Noch nicht angemeldet`.

## Empfohlener Arbeitsablauf fuer Admins

### Vor der Veranstaltung

1. Pruefe, ob alle Lehrer einen funktionierenden Account haben.
2. Lege alle Aufgaben mit korrekten Zeiten und Zielklassen an.
3. Weise den Aufgaben Lehrer zu.
4. Kontrolliere die Liste `Noch nicht angemeldet`.
5. Setze Entschuldigungen fuer bekannte Ausnahmen.

### Kurz vor dem Event

1. Kontrolliere offene Schuelerfaelle.
2. Pruefe noch einmal die Lehrer-Zuweisungen.
3. Stelle sicher, dass fuer beide Tage alle Aufgaben sichtbar und korrekt sind.

### Waehren des Events

1. Reagiere auf kurzfristige Aenderungen bei Entschuldigungen.
2. Passe Lehrer-Zuweisungen bei Bedarf an.
3. Nutze die Uebersichten, um offene oder fehlerhafte Einteilungen schnell zu finden.

## Typische Hinweise fuer die Administration

### Ein Lehrer sieht keine Aufgabe

Dann wurde ihm noch keine Aufgabe zugewiesen oder die Zuweisung wurde entfernt. Loese das ueber den Bereich `Lehrer-Accounts`.

### Ein Schueler fehlt in der Aufgabenliste

Pruefe:

- ob die richtige Klasse eingetragen ist
- ob die Aufgabe fuer diese Klasse freigegeben wurde
- ob der Schueler fuer den Tag entschuldigt wurde

### Ein Schueler soll an einem Tag nicht eingeteilt sein

Setze fuer diesen Tag eine Entschuldigung. Die bestehende Einteilung wird fuer diesen Tag automatisch entfernt.
