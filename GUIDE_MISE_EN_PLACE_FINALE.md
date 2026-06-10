# VISITE MÉDICALE & COMPÉTENCE — Résultat final

## 1. Mettre à jour GitHub Pages

Dans le dépôt GitHub `caboua/visite-medicale-competence`, envoyer tous les fichiers du dossier :

- `index.html`
- `agents.json`
- `config.js`
- `manifest.json`
- `service-worker.js`
- `icon.svg`

Puis attendre 1 à 2 minutes. Le site sera visible ici :

https://caboua.github.io/visite-medicale-competence/

## 2. Installer sur iPhone

Ouvrir le lien avec Safari, puis : Partager → Ajouter à l’écran d’accueil.

## 3. Créer la base Google Sheet

Créer un Google Sheet et importer le fichier :

`google_sheet_base.csv`

Ce fichier contient la liste des agents et toutes les colonnes nécessaires.

Colonnes importantes : Nom, Prénom, Statut, Dernière visite, Prochaine visite, Avis médical, Restriction, Observation, Pré-visite, Bilan à faire, Source.

## 4. Relier l’application au Google Sheet

Dans Google Sheet : Fichier → Partager → Publier sur le Web → CSV.
Copier l’URL CSV.

Dans GitHub, ouvrir `config.js` et remplacer :

DATA_URL: ""

par :

DATA_URL: "URL_CSV_GOOGLE_SHEET"

Après cette étape, l’application lira les données en ligne.

## 5. Automatisation Make pour les mails

Scénario Make recommandé :

1. Gmail — Watch emails
   - Filtre conseillé : aptitude médicale OR visite médicale OR inaptitude OR restriction

2. OpenAI — Create a completion/chat completion
   - Coller le contenu de `PROMPT_ANALYSE_MAIL_OPENAI.txt`
   - Remplacer `{{body}}` par le corps du mail Gmail

3. JSON — Parse JSON
   - Parser la réponse OpenAI

4. Google Sheets — Search Rows
   - Chercher la ligne où `Nom` + `Prénom` correspondent

5. Google Sheets — Update Row
   - Mettre à jour : Dernière visite, Prochaine visite, Avis médical, Restriction, Observation, Pré-visite, Bilan à faire, Dernière mise à jour, Source de mise à jour

6. Gmail — Add label
   - Ajouter le libellé : `Traité visite médicale`

## 6. Résultat final

Tu obtiens une application iPhone pour :

- Voir tous les agents du CIS Bouillante
- Voir qui est à jour, non à jour, bientôt expiré ou inapte
- Modifier une fiche agent
- Ajouter un agent
- Coller un mail reçu pour mise à jour semi-automatique
- Brancher Make pour mise à jour automatique par mail
- Charger les données depuis Google Sheet
- Sauvegarder/exporter les données JSON
