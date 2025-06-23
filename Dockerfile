FROM oven/bun:debian AS base

RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    wget \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /main

COPY package.json bun.lockb* ./

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 4444

CMD ["bun", "run", "server"]