# Aptitudes médicales — CIS Bouillante

Tableau de bord de suivi des visites médicales et restrictions d'aptitude.

## Accès protégé (RGPD)

Les données (noms, dates de visite, restrictions) sont **chiffrées** dans la page
(AES‑256‑GCM, clé dérivée de la phrase secrète par PBKDF2). Le fichier publié ne
contient aucune donnée en clair : sans la phrase secrète, rien n'est lisible, même
dans le code source.

- Ouvrir le site → saisir la **phrase secrète** → le tableau s'affiche.
- L'indexation par les moteurs de recherche est désactivée (`noindex` + `robots.txt`).
- Données de santé : usage strictement professionnel, soumis au secret professionnel.

## Mise à jour des données

Les données sont chiffrées hors‑ligne puis ré‑injectées dans `index.html`. Pour
changer la phrase secrète ou rafraîchir la liste, il faut re‑générer le bloc chiffré.
