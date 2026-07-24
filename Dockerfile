# syntax=docker/dockerfile:1
# Stage 1: Build frontend (Vite + React)
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build backend (Spring Boot + Maven)
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app
# Copy frontend dist into Spring Boot static resources so the JAR serves everything
COPY --from=frontend-build /app/dist /app/backend-java/src/main/resources/static
# Cache Maven dependencies
COPY backend-java/pom.xml /app/backend-java/pom.xml
RUN cd backend-java && mvn dependency:resolve -q 2>/dev/null || true
# Build the JAR
COPY backend-java/src /app/backend-java/src
RUN cd backend-java && mvn package -DskipTests -q

# Stage 3: Runtime
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN mkdir -p /app/data
COPY --from=backend-build /app/backend-java/target/*.jar /app/app.jar

ENV SPRING_PROFILES_ACTIVE=prod

CMD ["java", "-jar", "app.jar"]
