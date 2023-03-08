FROM node:16.10-alpine3.14

WORKDIR /app

COPY ["package.json", "./"]

RUN npm install 


COPY . .

RUN npx tsc


CMD [ "npm", "start" ]
EXPOSE 5000