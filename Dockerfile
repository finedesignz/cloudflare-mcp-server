FROM node:20-slim
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci --ignore-scripts

COPY src/ ./src/
COPY http-bridge.mjs ./

RUN npx tsc

ENV NODE_ENV=production
ENV HTTP_PORT=3011
EXPOSE 3011
CMD ["node", "http-bridge.mjs"]
