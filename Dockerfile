FROM node:latest

RUN mkdir -p /app

WORKDIR /app

COPY package*.json ./
RUN npm install --silent

RUN apt-get update && apt-get install -y gnupg2
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list
RUN apt-get update && apt-get install -y mongodb-org
# Create a directory for the MongoDB data
RUN mkdir -p /data/db

# Set permissions for the MongoDB data directory
RUN chown -R mongodb:mongodb /data/db


COPY . .

EXPOSE 5000


CMD ["npm", "start","mongod"]