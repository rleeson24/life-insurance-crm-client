FROM node:24-alpine AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm install -g npm@11.19.0 && npm ci

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_AZURE_AD_CLIENT_ID
ARG VITE_AZURE_AD_TENANT_ID
ARG VITE_AZURE_AD_API_SCOPE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_AZURE_AD_CLIENT_ID=$VITE_AZURE_AD_CLIENT_ID \
    VITE_AZURE_AD_TENANT_ID=$VITE_AZURE_AD_TENANT_ID \
    VITE_AZURE_AD_API_SCOPE=$VITE_AZURE_AD_API_SCOPE

RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
