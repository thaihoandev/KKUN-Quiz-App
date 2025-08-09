# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE đọc biến môi trường lúc build theo prefix VITE_
# ví dụ: VITE_API_BASE_URL=https://api.example.com
RUN npm run build

# --- Runtime stage ---
FROM nginx:alpine
# copy file build sang nginx html
COPY --from=build /app/dist /usr/share/nginx/html
# copy cấu hình nginx tùy chỉnh (tuỳ chọn)
# (nếu dùng nginx ở infra thì có thể bỏ qua file này)
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]