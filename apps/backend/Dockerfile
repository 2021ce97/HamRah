FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Expose API port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
