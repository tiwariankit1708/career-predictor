# Dockerfile for Next.js frontend
FROM node:20-alpine

WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Expose port and run dev server
EXPOSE 3000
CMD ["npm", "run", "dev"]
