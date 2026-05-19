# Projet OCP — Suivi & IA (Avancement au niveau actuel du code)

## 1) Objectif global
Le projet implémente une application web permettant :
- l’authentification d’utilisateurs,
- l’import de fichiers Excel (production et charges) issus du site OCP,
- la persistance des données dans une base PostgreSQL via TypeORM,
- l’exposition de services d’analytique/IA (prévisions, détection d’anomalies, chat),
- la visualisation côté frontend (pages “login” et “upload”, ainsi que des pages de dashboard/prévisions).

Les briques sont organisées en 3 parties principales :
- **frontend** (React + Vite),
- **backend** (NestJS + TypeORM + JWT),
- **ai-service** (FastAPI, pipelines de données & endpoints IA).

---

## 2) Backend (NestJS) — API applicative et persistance

### 2.1 Module applicatif
Le point d’entrée **`backend/src/app.module.ts`** configure :
- `ConfigModule` (variables d’environnement),
- `TypeOrmModule.forRootAsync` (connexion PostgreSQL),
- inclusion des modules :
  - `UsersModule`,
  - `AuthModule`,
  - `UploadModule`.

La configuration TypeORM enregistre les entités :
- `User`,
- `FichierExcel`,
- `DonneeProduction`,
- `PosteCharge`.

### 2.2 Authentification JWT
- **`backend/src/auth/auth.controller.ts`** : endpoint **POST `/auth/login`** qui délègue à `AuthService`.
- **`backend/src/auth/auth.service.ts`** :
  - `validateUser(email, password)` : récupère l’utilisateur via `UsersService`, puis vérifie le hash avec `bcrypt.compare`.
  - `login(email, password)` : construit un payload `{ sub, email, role }` et signe un JWT (`JwtService`).

Le contrôle d’accès côté routes est assuré par :
- **`backend/src/auth/jwt-auth.guard.ts`** : wrapper de `AuthGuard('jwt')`.

### 2.3 Gestion des utilisateurs
- **`backend/src/users/users.controller.ts`** expose (toutes protégées par `JwtAuthGuard`) :
  - GET `/users` (liste),
  - POST `/users` (création),
  - PATCH `/users/:id` (mise à jour),
  - DELETE `/users/:id` (suppression).

### 2.4 Import Excel (Upload)
Le flux d’import est implémenté autour de `UploadController` + `UploadService`.

#### UploadController
- **`backend/src/upload/upload.controller.ts`** :
  - Route **POST `/upload`** protégée par JWT.
  - Utilise `FileInterceptor('file')` pour recevoir un fichier.
  - Attend aussi des champs `type`, `mois`, `annee`.
  - Valide la présence des champs puis appelle `uploadService.processExcel(...)`.

#### UploadService : traitement Excel + persistance
- **`backend/src/upload/upload.service.ts`** contient :

1. **Mapping mois → nom de feuille Excel** (`MOIS_SHEET_MAP`).
2. **Lecture du workbook** via `xlsx.read(file.buffer, { type: 'buffer' })`.
3. **Validation de la feuille** : la feuille correspondant à `mois` doit exister.
4. **Lecture des lignes** selon `type` :
   - `PRODUCTION` : conversion en JSON à partir de la ligne d’en-têtes (`range: 2`),
   - `CHARGES` : à partir de `range: 3`,
   - autres cas : fallback sur la totalité.
5. **Gestion du doublon** :
   - recherche d’un fichier existant par `(type, mois, annee, user.id)` ; si trouvé → erreur.
6. **Insertion de l’entité FichierExcel** :
   - insertion via `QueryBuilder().insert()` (évite des comportements d’update parasites).
7. **Parsing et insertion en base** :
   - `parseProduction(rows, fichierId, mois)`
     - ignore les lignes sans `Date` ou `Activité`.
     - mappe les colonnes Excel vers `DonneeProduction`.
     - insertion via `QueryBuilder().insert()`.
   - `parseCharges(rows, fichierId, mois)`
     - ignore les lignes sans `Date` ou `Poste de charge`.
     - mappe les colonnes vers `PosteCharge`.
     - insertion via `QueryBuilder().insert()`.
8. **Mise à jour du nombre de lignes** importées :
   - `update(FichierExcel).set({ nbLignes: lignesSauvegardees })`.
9. **Réponse** :
   - message de succès,
   - `fichierId`, `mois`, `annee`, nom de feuille, nombre de lignes lues et sauvegardées.

Les en-têtes attendus sont documentés en commentaires dans le service (structure typique OCP : titre fusionné, ligne vide, ligne d’en-têtes, etc.).

---

## 3) AI Service (FastAPI) — Endpoints IA

Le service AI est démarré via **`ai-service/main.py`**.

### 3.1 Composition du serveur
- Ajoute `CORSMiddleware` (origins `*`).
- Inclut les routers :
  - `prediction`,
  - `production`,
  - `anomalie`,
  - `chat`.

### 3.2 Prédiction
- **`ai-service/routers/prediction.py`** :
  - endpoint **GET `/prediction/charges`**
  - charge les données via `load_charges()` (dans `database.py`),
  - agrège via `aggregate_charges`,
  - calcule des prédictions via `predict_charges`.
  - renvoie `{ type: 'charges', predictions: ... }`.

### 3.3 Anomalies
- **`ai-service/routers/anomalie.py`** :
  - endpoint **GET `/anomalies`**
  - charge charges `load_charges()`.
  - applique `detect_anomalies(df)`.
  - renvoie `{ total, anomalies }`.

### 3.4 Chat
- **`ai-service/routers/chat.py`** :
  - endpoint **POST `/chat`**.
  - Utilise Groq (API OpenAI compatible) avec un modèle `llama-3.3-70b-versatile`.
  - Supporte un champ `system` optionnel.
  - Renvoie `{ reply }`.

---

## 4) Frontend (React) — Pages et intégration API

### 4.1 Upload (UI)
- **`frontend/src/pages/UploadPage.jsx`** :
  - choix d’un fichier Excel.
  - envoi au backend via `axios.post('http://localhost:3000/upload', formData, headers Bearer token)`.
  - affiche un message de retour.

### 4.2 Service d’accès IA
- **`frontend/src/services/aiService.js`** :
  - définit `AI_URL = 'http://localhost:8000'`.
  - fournit des fonctions :
    - `getPrevisionCharges()` → GET `${AI_URL}/prediction/charges`,
    - `getPrevisionProduction()` → GET `${AI_URL}/prediction/production`,
    - `getAnomalies()` → GET `${AI_URL}/anomalies`.

---

## 5) Statut au “niveau de code” constaté
À ce stade, le projet est construit autour d’un flux complet :
1. **Login** (JWT),
2. **Upload Excel** (parsing en mémoire + insertion DB),
3. **Consommation IA** côté frontend (via endpoints FastAPI),
4. **Endpoints IA** basés sur des données chargées en base (via `load_charges`).

Les diagrammes UML à produire ci-dessous reflètent :
- l’architecture en 3 composants (frontend/backend/ai-service),
- le flux principal d’import,
- les flux de prédiction/anomalies/chat,
- les relations d’authentification et de protection JWT sur les routes backend.

