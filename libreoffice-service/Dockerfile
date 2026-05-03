# LibreOffice headless conversion service for SlideForge.
# Converts PDF → PPTX using LibreOffice's native vector engine.
FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libreoffice \
       libreoffice-impress \
       libreoffice-draw \
       fonts-dejavu \
       fonts-liberation \
       fonts-noto-core \
       curl \
       ca-certificates \
       gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./

# Pre-warm LibreOffice user profile so the first conversion is faster.
RUN libreoffice --headless --terminate_after_init || true

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
