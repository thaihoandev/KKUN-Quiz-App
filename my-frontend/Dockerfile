# Stage 1: build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json yarn.lock ./
RUN npm ci
COPY . .
RUN npm run build          # Vite xuất ra /dist

# Stage 2: serve bằng nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]