# TODO - Augmenter coverage SonarQube > 80% par service

## AI Service (FastAPI / pytest)
- [ ] Ajouter une suite de tests pytest pour `models/anomaly.py` (detect_anomalies + _niveau)
- [ ] Ajouter une suite de tests pytest pour `models/prediction.py` (predict_charges)
- [ ] Ajouter une suite de tests pytest pour `models/production_prediction.py` (predict_production)
- [ ] Ajouter une suite de tests pytest pour `services/aggregation.py` (aggregate_charges + aggregate_production)
- [ ] Ajouter une suite de tests pour routers:
  - [ ] `routers/anomalie.py` (GET /anomalies) avec patch `load_charges` + patch detect_anomalies
  - [ ] `routers/prediction.py` (GET /prediction/charges) avec patch `load_charges`, `aggregate_charges`, `predict_charges`
  - [ ] `routers/production.py` (GET /prediction/production) avec patch `load_production`, `aggregate_production`, `predict_production`
- [x] Lancer une suite pytest (anomaly/prediction/production/aggregation/routers)


## Backend (NestJS / Jest)
- [ ] Étendre les specs existantes pour couvrir branches d’erreur/edge cases dans:
  - [ ] `src/auth/auth.service.ts`
  - [ ] `src/users/users.service.ts`
  - [ ] `src/dashboard/dashboard.service.ts`
  - [ ] `src/upload/upload.service.ts`
  - [ ] `src/logs/logs.service.ts`
- [ ] Lancer tests Jest + vérifier coverage

## Frontend (React / Vitest + RTL)
- [ ] Étendre tests `aiService.js` pour chemins d’erreur, structure payload, paramètres optionnels
- [ ] Étendre tests `Previsions.jsx` pour edge cases: données vides, pas de critiques, anomalies manquantes, etc.
- [ ] Lancer vitest + vérifier coverage

## SonarQube
- [ ] Ajuster génération/collecte coverage (lcov / cobertura) si Sonar ne remonte pas les rapports

