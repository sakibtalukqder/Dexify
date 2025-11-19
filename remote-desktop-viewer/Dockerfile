FROM node:16

WORKDIR /app

ENV BROWSER=none
ENV CI=true

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
