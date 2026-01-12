FROM node:20-alpine

WORKDIR /app

# 1. Copy Shared Library First
COPY shared ./shared

# 2. Copy Game Server
COPY ft_transcendence-pong_game ./ft_transcendence-pong_game

# 3. Install Shared Dependencies
WORKDIR /app/shared
RUN npm install

# 4. Install Game Server Dependencies
WORKDIR /app/ft_transcendence-pong_game
RUN npm install

# 5. Expose Port
EXPOSE 3002

# 6. Run Server
CMD sh -c "npx prisma generate && npm start"
