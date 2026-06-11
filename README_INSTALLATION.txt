SITE ALLEGE - VISITES MEDICALES BOUILLANTE

Contenu :
- index.html
- style.css
- script.js

Installation GitHub :
1. Ouvre le depot GitHub : caboua / visite-medicale-competence
2. Remplace les fichiers index.html, style.css et script.js par ceux de ce dossier.
3. Garde ton fichier agents.json actuel à la racine du depot.
4. Attends 1 à 3 minutes puis ouvre :
   https://caboua.github.io/visite-medicale-competence/

Le site affiche :
- le tableau des alertes visites médicales,
- le tableau des inaptitudes / restrictions,
- la liste complète des agents,
- une recherche rapide.

Les alertes se déclenchent si :
- la date est expirée,
- la visite expire dans 60 jours ou moins,
- la date de validité est absente ou illisible.

CORRECTION INCLUSE :
- lecture des champs actuels agents.json : prochaineVisite, derniereVisite, derniereMaj ;
- lecture des dates au format 2026-06-10 ;
- exclusion de 'Aucune' dans le tableau restrictions ;
- rechargement sans cache pour afficher la base la plus récente.
