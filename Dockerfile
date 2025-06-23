FROM oven/bun:1.1-debian AS base

WORKDIR /app

COPY package.json bun.lockb* ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

EXPOSE 4444

CMD ["bun", "run", "server"]