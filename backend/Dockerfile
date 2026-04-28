FROM node:22-alpine

WORKDIR /app

# Копіюємо файли залежностей
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо весь інший код
COPY . .

# Компілюємо TypeScript у JavaScript
RUN npm run build

# Вказуємо порт (за замовчуванням 5000)
EXPOSE 5000

# Запускаємо скомпільований код
CMD ["npm", "start"]