FROM node:16-alpine

WORKDIR /app

ENV BROWSER=none
ENV CHOKIDAR_USEPOLLING=true
ENV WDS_SOCKET_PORT=0

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
