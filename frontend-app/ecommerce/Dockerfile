# Build stage
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage (using nginx)
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/ecommerce/browser /usr/share/nginx/html
RUN chown -R 101:101 /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]