# Etapa 1: Construcción
FROM node:20 AS build

# Establece el directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm ci

# Copia el resto de los archivos del proyecto
COPY . .

# Construye la aplicación React
RUN npm run build

# Utiliza una imagen de Nginx para servir la aplicación
FROM nginx:alpine

# Copia los archivos construidos desde la etapa de construcción a la ubicación de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expon el puerto 80
EXPOSE 80

# Comando por defecto para ejecutar Nginx
CMD ["nginx", "-g", "daemon off;"]
# CMD ["npm", "start"]