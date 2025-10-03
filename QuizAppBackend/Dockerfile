# --- Build stage ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom và tải dependency trước để cache tốt hơn
COPY pom.xml .
RUN mvn -q -B -DskipTests dependency:go-offline

# Copy source code và build
COPY src ./src
RUN mvn -q -B -DskipTests package

# --- Runtime stage ---
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Set timezone sang VN
ENV TZ=Asia/Ho_Chi_Minh

# Copy jar từ build stage
COPY --from=build /app/target/*-SNAPSHOT.jar app.jar

# Tùy chỉnh Java memory limit
ENV JAVA_OPTS="-Xms256m -Xmx512m"

# Expose cổng
EXPOSE 8080

# Install curl cho healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run app
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
