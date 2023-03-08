FROM node:16.10-alpine3.14
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "./"]

RUN npm install --production

COPY . .

CMD [ "node", "server.js" ]