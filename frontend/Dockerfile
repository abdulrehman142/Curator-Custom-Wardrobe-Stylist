FROM node:18-alpine AS builder
WORKDIR /app

ENV NEXT_PUBLIC_API_URL=http://backend:8000

# Copy package.json from current directory (frontend/)
COPY package*.json ./
RUN npm ci

# Copy everything from frontend/
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://backend:8000

COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]
