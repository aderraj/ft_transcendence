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

# 5. Copy and set up entrypoint script
COPY ft_transcendence-pong_game/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 6. Expose Port
EXPOSE 3000

# 7. Use entrypoint to load secrets before starting
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "start"]