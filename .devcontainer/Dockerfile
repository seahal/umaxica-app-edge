# syntax=docker/dockerfile:1

# Single-stage image explicitly named "development" to satisfy build targets
FROM oven/bun:1.1.34-debian AS development

ENV DEBIAN_FRONTEND=noninteractive \
    PNPM_HOME=/home/bun/.local/share/pnpm \
    PATH="/home/bun/.bun/bin:/home/bun/.local/share/pnpm:$PATH"

# Base tooling commonly needed in dev containers
RUN apt-get update -qq \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    curl \
    openssh-client \
    less \
    nano \
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

# Create workspace and set ownership to default bun user
WORKDIR /workspaces/umaxica-app-edge
RUN mkdir -p /workspaces/umaxica-app-edge \
  && chown -R bun:bun /workspaces

# Switch to the non-root default user from oven/bun image
USER bun

# Pre-create Bun cache dirs to avoid permission friction
RUN mkdir -p /home/bun/.bun \
  && mkdir -p /home/bun/.cache \
  && bun --version

# Expose Vite dev port (documentary)
EXPOSE 4000

# Keep default command; IDE will start the workspace and tasks

