# Wardrobe AI - Next.js Frontend

A beautiful, modern Next.js frontend for the Wardrobe AI FastAPI backend.

## Features

- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- 📤 **Image Upload** - Drag-and-drop file upload with preview
- 🗂️ **Wardrobe Gallery** - Browse all your clothing items with filtering
- 📋 **Item Details** - View detailed information about each item
- 🌤️ **Smart Recommendations** - Weather-based outfit suggestions
- 🎯 **Real-time Classification** - AI-powered clothing classification

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API URL

The frontend is configured to connect to `http://localhost:8000` by default. If your FastAPI backend runs on a different URL, you can:

- Set the `NEXT_PUBLIC_API_URL` environment variable, or
- Update the `API_BASE_URL` in `lib/api.ts`

### 3. Run the Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Make Sure FastAPI Backend is Running

Ensure your FastAPI backend is running on `http://localhost:8000` (or update the API URL accordingly).

**Note:** CORS middleware has been added to the FastAPI backend (`app/main.py`) to allow requests from the Next.js frontend. If you're running the backend on a different port or domain, update the `allow_origins` list in the CORS middleware configuration.

## Project Structure

```
├── app/
│   ├── page.tsx              # Upload page (home)
│   ├── wardrobe/
│   │   └── page.tsx          # Wardrobe gallery
│   ├── item/
│   │   └── [id]/
│   │       └── page.tsx      # Item detail page
│   ├── recommend/
│   │   └── page.tsx          # Recommendations page
│   ├── layout.tsx            # Root layout with navbar
│   └── globals.css           # Global styles
├── components/
│   └── Navbar.tsx            # Navigation component
├── lib/
│   └── api.ts                # API utility functions
└── package.json
```

## Pages

### Upload Page (`/`)
- Drag-and-drop or click to upload images
- Real-time preview
- Automatic classification on upload
- Success/error notifications

### Wardrobe Page (`/wardrobe`)
- Grid view of all wardrobe items
- Category filtering (shirt, pants, jacket, etc.)
- Click any item to view details
- Color indicators for each item

### Item Detail Page (`/item/[id]`)
- Full-size image display
- Classification details with confidence score
- Dominant color visualization
- Thickness information
- Metadata display

### Recommendations Page (`/recommend`)
- Weather-based outfit suggestions
- Configurable city and API key
- Visual outfit composition
- Style tips and color advice

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls

## Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Notes

- The frontend uses Next.js API rewrites to proxy requests to the FastAPI backend
- Images are served directly from the FastAPI backend
- All API calls are made client-side using Axios
- The UI is fully responsive and works on mobile devices

