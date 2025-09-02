# React Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 8081

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8081"]
