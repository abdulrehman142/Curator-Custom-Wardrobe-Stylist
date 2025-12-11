# Wardrobe AI - Frontend

Next.js frontend for the Wardrobe AI application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables (create `.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## Structure

- `app/` - Next.js app directory (pages and layouts)
- `components/` - React components
- `lib/` - Utility libraries and API client

## API Configuration

The frontend connects to the backend API. Make sure the backend is running on `http://localhost:8000` or update `NEXT_PUBLIC_API_URL` in your environment variables.

