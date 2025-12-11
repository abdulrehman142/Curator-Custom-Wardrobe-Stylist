# Migration Guide: Separating Backend and Frontend

This guide will help you reorganize the project into separate `backend/` and `frontend/` folders.

## Step 1: Create Folder Structure

Create these folders in the root directory:
- `backend/`
- `backend/app/`
- `frontend/`

## Step 2: Move Backend Files

Move the following files/folders to `backend/`:

### Python Files (to `backend/app/`):
- `app/main.py` → `backend/app/main.py`
- `app/crud.py` → `backend/app/crud.py`
- `app/db.py` → `backend/app/db.py`
- `app/detector.py` → `backend/app/detector.py`
- `app/face_analyzer.py` → `backend/app/face_analyzer.py`
- `app/utils.py` → `backend/app/utils.py`
- `app/web_scraper.py` → `backend/app/web_scraper.py`
- `app/outfit_compatibility.py` → `backend/app/outfit_compatibility.py`

### Data Files (to `backend/`):
- `uploads/` → `backend/uploads/`
- `wardrobe.db` → `backend/wardrobe.db`
- `app/models/` → `backend/models/`
- `app/mlruns/` → `backend/mlruns/`
- `app/weights/` → `backend/weights/`
- `app/testScripts/` → `backend/testScripts/`
- `requirements.txt` → `backend/requirements.txt`
- `test.py` → `backend/test.py`
- `modelTraining.ipynb` → `backend/modelTraining.ipynb` (optional)

## Step 3: Move Frontend Files

Move the following to `frontend/`:

### Next.js Files:
- `app/page.tsx` → `frontend/app/page.tsx`
- `app/layout.tsx` → `frontend/app/layout.tsx`
- `app/globals.css` → `frontend/app/globals.css`
- `app/wardrobe/` → `frontend/app/wardrobe/`
- `app/item/` → `frontend/app/item/`
- `app/recommend/` → `frontend/app/recommend/`
- `app/face-recommend/` → `frontend/app/face-recommend/`
- `app/outfit-recommend/` → `frontend/app/outfit-recommend/`
- `components/` → `frontend/components/`
- `lib/` → `frontend/lib/`
- `node_modules/` → `frontend/node_modules/`
- `.next/` → `frontend/.next/` (if exists)
- `package.json` → `frontend/package.json`
- `package-lock.json` → `frontend/package-lock.json`
- `next.config.js` → `frontend/next.config.js`
- `next-env.d.ts` → `frontend/next-env.d.ts`
- `tsconfig.json` → `frontend/tsconfig.json`
- `tailwind.config.js` → `frontend/tailwind.config.js`
- `postcss.config.js` → `frontend/postcss.config.js`
- `README_FRONTEND.md` → `frontend/README.md`

## Step 4: Update Backend Paths

The backend files have been created with updated paths. Key changes:

1. **`backend/app/db.py`**: Database path stays relative (`./wardrobe.db`)
2. **`backend/app/main.py`**: Upload directory stays relative (`uploads/`)
3. **`backend/app/detector.py`**: Weights path updated to `app/weights/best.pt`
4. **`backend/app/outfit_compatibility.py`**: Model paths updated

## Step 5: Create Backend Package File

Create `backend/app/__init__.py` (empty file) to make it a Python package.

## Step 6: Update Frontend API URL

The frontend API client (`lib/api.ts`) uses `NEXT_PUBLIC_API_URL` environment variable.
Make sure it's set to `http://localhost:8000` (default).

## Step 7: Run Commands

### Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Notes

- The backend and frontend are now completely separate
- Backend runs on port 8000
- Frontend runs on port 3000
- Make sure CORS is configured in backend (already done)
- Database and uploads stay with backend
- All model files stay with backend

