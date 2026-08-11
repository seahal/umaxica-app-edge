# syntax=docker/dockerfile:1

# Keep these runtime pins aligned with package.json and the documented Edge baseline.
ARG NODE_VERSION=24.19.0-trixie
ARG PNPM_VERSION=11.20.0
ARG CLAUDE_CODE_VERSION=2.1.220
ARG CODEX_VERSION=0.147.0
ARG OPENCODE_VERSION=1.18.16
ARG CONTAINER_UID=1000
ARG CONTAINER_GID=1000
ARG CONTAINER_USER=edge
ARG CONTAINER_GROUP=group

FROM node:${NODE_VERSION} AS development

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG DEBIAN_FRONTEND=noninteractive
ARG PNPM_VERSION
ARG CLAUDE_CODE_VERSION
ARG CODEX_VERSION
ARG OPENCODE_VERSION
ARG CONTAINER_UID
ARG CONTAINER_GID
ARG CONTAINER_USER
ARG CONTAINER_GROUP

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    bat \
    bubblewrap \
    ca-certificates \
    curl \
    dumb-init \
    entr \
    fd-find \
    fzf \
    gh \
    git \
    htop \
    jq \
    less \
    libasound2t64 \
    libatk-bridge2.0-0t64 \
    libatk1.0-0t64 \
    libatspi2.0-0t64 \
    libdbus-1-3 \
    libfontconfig1 \
    libfreetype6 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    ncdu \
    openssh-client \
    python3 \
    ripgrep \
    tig \
    time \
    tree \
    tzdata \
    watch \
    wget \
    yq \
  && curl -fsSL https://pkgs.tailscale.com/stable/debian/trixie.noarmor.gpg \
    -o /usr/share/keyrings/tailscale-archive-keyring.gpg \
  && curl -fsSL https://pkgs.tailscale.com/stable/debian/trixie.tailscale-keyring.list \
    -o /etc/apt/sources.list.d/tailscale.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends tailscale \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
  && corepack install --global "pnpm@${PNPM_VERSION}" \
  && npm install --global \
    "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
    "@openai/codex@${CODEX_VERSION}" \
    "opencode-ai@${OPENCODE_VERSION}" \
  && npm cache clean --force

RUN set -eux; \
  base_user=node; \
  base_group=node; \
  groupmod --gid "${CONTAINER_GID}" "${base_group}"; \
  if [ "${CONTAINER_GROUP}" != "${base_group}" ]; then \
    groupmod --new-name "${CONTAINER_GROUP}" "${base_group}"; \
  fi; \
  usermod --gid "${CONTAINER_GID}" --shell /bin/bash "${base_user}"; \
  if [ "${CONTAINER_USER}" != "${base_user}" ]; then \
    usermod --login "${CONTAINER_USER}" --home "/home/${CONTAINER_USER}" --move-home "${base_user}"; \
  fi; \
  usermod --uid "${CONTAINER_UID}" --gid "${CONTAINER_GID}" "${CONTAINER_USER}"; \
  home="/home/${CONTAINER_USER}"; \
  install -d -m 0755 -o "${CONTAINER_USER}" -g "${CONTAINER_GROUP}" \
    "${home}" \
    "${home}/workspace" \
    "${home}/workspace/node_modules" \
    "${home}/.cache" \
    "${home}/.config" \
    "${home}/.config/.wrangler" \
    "${home}/.config/gh" \
    "${home}/.local" \
    "${home}/.local/bin" \
    "${home}/.local/share" \
    "${home}/.local/share/opencode" \
    "${home}/.local/share/pnpm" \
    "${home}/.local/state" \
    "${home}/.npm" \
    "${home}/.codex" \
    "${home}/.claude"

ENV HOME=/home/edge \
    USER=edge \
    LANG=C.UTF-8 \
    SHELL=/bin/bash \
    XDG_CONFIG_HOME=/home/edge/.config \
    XDG_CACHE_HOME=/home/edge/.cache \
    XDG_DATA_HOME=/home/edge/.local/share \
    XDG_STATE_HOME=/home/edge/.local/state \
    PNPM_HOME=/home/edge/.local/share/pnpm \
    PATH=/home/edge/.local/bin:/home/edge/.local/share/pnpm:${PATH}

WORKDIR /home/edge/workspace
USER edge:group

CMD ["sleep", "infinity"]
