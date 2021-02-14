FROM node:15-alpine AS base
WORKDIR /app
RUN apk add --no-cache git python3 build-base
COPY package*.json .

FROM base as prod_base
RUN npm ci --production
COPY . .
RUN ./pack.sh

FROM node:15-alpine as prod
WORKDIR /app
COPY --from=prod_base /app .
RUN chown -R node:node .
USER node
CMD node app.js

FROM base as dev
RUN npm ci
COPY . .
CMD node --inspect=0.0.0.0:9229 app.js

