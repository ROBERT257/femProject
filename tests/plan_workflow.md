This file contains manual curl commands to test the rehab plan workflow against the backend running at http://127.0.0.1:8080

1) Create a rehab plan (Therapist creates plan)

```bash
curl -X POST http://127.0.0.1:8080/rehab-plans \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Shoulder Recovery Plan",
    "patient_name": "John Doe",
    "therapist_name": "Dr. Smith",
    "status": "active",
    "start_date": "2026-05-31",
    "entries": [
      {"exercise":"Band Pull Apart","sets":3,"reps":15,"order_index":0},
      {"exercise":"Wall Slides","sets":3,"reps":10,"order_index":1},
      {"exercise":"External Rotation","sets":3,"reps":12,"order_index":2}
    ]
  }'
```

2) List plans (verify plan exists)

```bash
curl http://127.0.0.1:8080/rehab-plans
```

3) Get plan details (replace <id> with returned id)

```bash
curl http://127.0.0.1:8080/rehab-plans/<id>
```

4) Assign plan to patient (PATCH)

```bash
curl -X PATCH http://127.0.0.1:8080/rehab-plans/<id> \
  -H "Content-Type: application/json" \
  -d '{"patient_name":"John Doe"}'
```

5) Patient marks an exercise completed and sets pain level (PATCH exercise)

```bash
curl -X PATCH http://127.0.0.1:8080/rehab-exercises/<entryID> \
  -H "Content-Type: application/json" \
  -d '{"completion_status":"completed","pain_level":3,"patient_notes":"Felt okay"}'
```

6) Check progress

```bash
curl http://127.0.0.1:8080/rehab-plans/<id>/progress
```

Backfill `patient_id` safely from PowerShell:

```powershell
# Preview matches first
Get-Content .\scripts\preview_patient_id_backfill.sql -Raw | docker exec -i workoutDB psql -U postgres -d postgres

# Apply the backfill
Get-Content .\scripts\apply_patient_id_backfill.sql -Raw | docker exec -i workoutDB psql -U postgres -d postgres

# Report workout rows whose names do not match any account exactly
Get-Content .\scripts\report_unmatched_patient_names.sql -Raw | docker exec -i workoutDB psql -U postgres -d postgres

# Apply manual mappings for specific workout rows after editing the INSERT block in the template
Get-Content .\scripts\manual_patient_id_mapping.sql -Raw | docker exec -i workoutDB psql -U postgres -d postgres
```

Notes:
- Replace `<id>` and `<entryID>` with actual numeric ids returned by the API.
- The frontend (created UI) calls these same endpoints using `fetch` and the helper functions in `frontend/src/lib/api.js`.
- If your backend is behind a different base URL, update the `VITE_API_BASE_URL` environment variable or the `API_BASE_URL` in `frontend/src/lib/api.js`.
