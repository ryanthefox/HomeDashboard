FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.mjs ./
ENV RING_DATA=/data RING_PORT=5057 RING_BIND=127.0.0.1
VOLUME /data
CMD ["node", "server.mjs"]
