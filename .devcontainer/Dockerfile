# syntax=docker/dockerfile:1

# Single-stage image explicitly named "development" to satisfy build targets
FROM mcr.microsoft.com/devcontainers/typescript-node:20 AS development

ENV DEBIAN_FRONTEND=noninteractive \
    BUN_INSTALL=/home/node/.bun \
    PATH="${BUN_INSTALL}/bin:${PATH}"

# Base tooling commonly needed in dev containers
# Extra X11/font libraries keep JetBrains remote IDE backends happy
RUN apt-get update -qq \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    curl \
    openssh-client \
    less \
    nano \
    unzip \
    libfreetype6 \
    libfontconfig1 \
    libxi6 \
    libxrender1 \
    libxtst6 \
  && rm -rf /var/lib/apt/lists/*

# Optional: GitHub CLI (keep here to avoid devcontainer "features" target mismatch)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
  && apt-get update -qq \
  && apt-get install -y --no-install-recommends gh \
  && rm -rf /var/lib/apt/lists/*

# Create workspace and set ownership to default node user
WORKDIR /workspaces/umaxica-app-edge
RUN mkdir -p /workspaces/umaxica-app-edge \
  && chown -R node:node /workspaces

# Switch to the non-root default user provided by the base image
USER node

# Pre-create Bun cache dirs to avoid permission friction
RUN mkdir -p "$BUN_INSTALL" \
  && mkdir -p "$HOME/.cache"

# Expose Vite dev port (documentary)
EXPOSE 5173

# Keep default command; IDE will start the workspace and tasks
