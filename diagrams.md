# Diagrammes UML (résultat attendu pour l’état actuel du code)

> Format conseillé : Mermaid (compatible GitHub / certains rendus Markdown). Sinon, tu peux aussi convertir ces diagrammes.

---

## 1) Diagramme de contexte / architecture (vue d’ensemble)
```mermaid
autonumber
flowchart TB
  user[Utilisateur] -->|1. login(email,password)| fe[Frontend React]
  fe -->|POST /auth/login| be[Backend NestJS]

  user -->|2. upload Excel + token JWT| fe
  fe -->|POST /upload (Bearer JWT)| be

  be -->|Parse & persist (PostgreSQL)| db[(PostgreSQL)]

  fe -->|3. demander IA| ai[AI Service FastAPI]
  ai -->|4. lit données depuis DB| db

  fe -->|4. visualisation| user

  ai -->|POST /chat| groq[Groq API (llama-3.3)]
```

---

## 2) Diagramme de classes (principales entités logiques)
```mermaid
autonumber
classDiagram
  class User{
    +id
    +email
    +password
    +fullname
    +role
  }

  class AuthService{
    +validateUser(email,password)
    +login(email,password)
  }

  class UploadService{
    +processExcel(file,type,mois,annee,user)
    -parseProduction(rows,fichierId,mois)
    -parseCharges(rows,fichierId,mois)
  }

  class FichierExcel{
    +id
    +nomFichier
    +type
    +mois
    +annee
    +statut
    +nbLignes
  }

  class DonneeProduction{
    +id
    +date
    +mois
    +activite
    +zone
    +prevuT
    +realiseT
    +tauxRP
    +cumulPrevuT
    +cumulRealiseT
  }

  class PosteCharge{
    +id
    +date
    +mois
    +categorie
    +poste
    +prevuJour
    +realiseJour
    +ecartJour
    +tauxRP
    +cumulPrevu
    +cumulRealise
  }

  class AI_Router{
    <<router>>
    +/prediction/charges
    +/anomalies
    +/chat
  }

  AuthService --> User
  UploadService --> FichierExcel
  UploadService --> DonneeProduction
  UploadService --> PosteCharge
  AI_Router --> AI_Router
```

---

## 3) Diagramme de séquence (Login + protection JWT)
```mermaid
autonumber
sequenceDiagram
  participant U as Utilisateur
  participant FE as Frontend
  participant BE as Backend NestJS
  participant Auth as AuthService
  participant JWT as JwtService

  U->>FE: Saisir email/password
  FE->>BE: POST /auth/login {email,password}
  BE->>Auth: login(email,password)
  Auth->>Auth: validateUser()
  Auth->>JWT: sign(payload{sub, email, role})
  Auth-->>BE: access_token + user
  BE-->>FE: access_token
  FE-->>U: Stockage token

  U->>FE: Upload fichier Excel
  FE->>BE: POST /upload (Authorization: Bearer token)
  BE->>BE: JwtAuthGuard('jwt')
  BE-->>FE: Réponse upload (message + ids)
```

---

## 4) Diagramme de séquence (Upload Excel → parsing → insertion DB)
```mermaid
autonumber
sequenceDiagram
  participant U as Utilisateur
  participant FE as Frontend
  participant BE as Backend NestJS
  participant UC as UploadController
  participant US as UploadService
  participant XLSX as XLSX Parser
  participant DB as PostgreSQL

  U->>FE: Choisir fichier + type + mois + annee
  FE->>BE: POST /upload multipart/form-data + Bearer JWT
  BE->>UC: uploadFile(file,type,mois,annee,user)
  UC->>US: processExcel(file,type,mois,annee,user)

  US->>US: validate mimetype + mapping MOIS_SHEET_MAP
  US->>XLSX: read(file.buffer)
  US->>US: sheetName = MOIS_SHEET_MAP[mois]
  US->>US: sheet_to_json(range=2 ou range=3)
  US->>DB: findOne(FichierExcel dup)

  alt fichier inexistant
    US->>DB: insert FichierExcel (QueryBuilder)
    US->>US: parseProduction / parseCharges
    US->>DB: insert DonneeProduction / PosteCharge
    US->>DB: update nbLignes
    DB-->>US: confirmation
  else doublon
    US-->>UC: BadRequestException
  end

  UC-->>FE: {message, fichierId, lignes,...}
  FE-->>U: Affichage du résultat
```

---

## 5) Diagramme de séquence (Prédiction charges)
```mermaid
autonumber
sequenceDiagram
  participant FE as Frontend
  participant AI as FastAPI
  participant DB as PostgreSQL
  participant Loader as load_charges()
  participant Agg as aggregate_charges()
  participant Model as predict_charges()

  FE->>AI: GET /prediction/charges
  AI->>Loader: load_charges()
  Loader->>DB: SELECT charges
  DB-->>Loader: df
  Loader-->>AI: df

  AI->>Agg: aggregate_charges(df)
  Agg-->>AI: monthly
  AI->>Model: predict_charges(monthly)
  Model-->>AI: predictions
  AI-->>FE: {type:'charges', predictions}
```

---

## 6) Diagramme de séquence (Détection anomalies)
```mermaid
autonumber
sequenceDiagram
  participant FE as Frontend
  participant AI as FastAPI
  participant DB as PostgreSQL
  participant Loader as load_charges()
  participant Anom as detect_anomalies(df)

  FE->>AI: GET /anomalies
  AI->>Loader: load_charges()
  Loader->>DB: SELECT charges
  DB-->>Loader: df
  Loader-->>AI: df

  AI->>Anom: detect_anomalies(df)
  Anom-->>AI: anomalies
  AI-->>FE: {total, anomalies}
```

---

## 7) Diagramme de séquence (Chat → Proxy Groq)
```mermaid
autonumber
sequenceDiagram
  participant FE as Frontend
  participant AI as FastAPI
  participant Groq as Groq API

  FE->>AI: POST /chat {messages[], system?}
  AI->>AI: construire messages (system + history)
  AI->>Groq: POST /openai/v1/chat/completions
  Groq-->>AI: JSON choix[0].message.content
  AI-->>FE: {reply}
```

