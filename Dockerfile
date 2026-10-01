# Multi-stage build for Hive ASP.NET Core 8 application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["NglApi/NglApi.csproj", "NglApi/"]
RUN dotnet restore "NglApi/NglApi.csproj"

# Copy full source code
COPY NglApi/ NglApi/
WORKDIR "/src/NglApi"

# Build and publish release
RUN dotnet publish "NglApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 5000

ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "NglApi.dll"]
