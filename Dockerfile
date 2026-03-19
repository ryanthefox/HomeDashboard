# ── Stage 1: Build frontend ────────────────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /src
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build backend ─────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend
WORKDIR /src
COPY HomeDashboard.Api/ ./HomeDashboard.Api/
WORKDIR /src/HomeDashboard.Api

# Patch csproj for Linux: remove Windows-only TFM, RuntimeIdentifier, Platforms, and NAudio
RUN sed -i \
      -e 's|net8.0-windows10.0.19041.0|net8.0|g' \
      -e '/<RuntimeIdentifier>/d' \
      -e '/<Platforms>/d' \
      -e '/NAudio/d' \
      HomeDashboard.Api.csproj

RUN dotnet restore
RUN dotnet publish -c Release -r linux-x64 --no-self-contained -o /publish

# ── Stage 3: Runtime ───────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=backend  /publish          ./
COPY --from=frontend /src/dist         ./frontend/dist
COPY HomeDashboard.Api/appsettings.example.json ./appsettings.json

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "HomeDashboard.Api.dll"]
