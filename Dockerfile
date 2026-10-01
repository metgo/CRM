# Step 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
RUN yarn build

# Step 2: Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/node_modules ./node_modules

# Copy migration sources so the same image can run `yarn migration:run`
# (ts-node is already present in node_modules from the builder's dev deps).
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.migration.json ./tsconfig.migration.json

# Expose port
EXPOSE 3000

# Start the application
CMD ["yarn", "start"]
