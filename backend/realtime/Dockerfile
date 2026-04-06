FROM node:20-slim

WORKDIR /app

# Install deps first for layer caching
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

# Non-root user
RUN useradd -m -u 1001 cleancity
USER cleancity

EXPOSE 4000

CMD ["node", "index.js"]
