# Use a Node.js base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock first to leverage Docker cache
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application files
COPY . .

EXPOSE 3001

# Set the command to run `yarn autonome`
CMD ["yarn", "autonome"]

# Build the docker image with
# docker build --platform=linux/amd64 -t autonome-agentkit-century-pay-2025 .

# Tag the image
# docker tag autonome-agentkit-century-pay-2025:latest vivi432/autonome-agentkit-century-pay-2025:latest

# Push the image to Docker Hub
# docker push vivi432/autonome-agentkit-century-pay-2025:latest
