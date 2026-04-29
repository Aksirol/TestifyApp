# Етап 1: Збірка проекту
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Етап 2: Production сервер (роздача зібраної статики)
FROM nginx:alpine

# ДОДАНО: Копіюємо конфігурацію для React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копіюємо зібрані файли з першого етапу в директорію Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]