# syntax=docker/dockerfile:1

# Pinned to an exact patch of the Node.js Active LTS line (24.x "Krypton"), not
# a floating major tag: a rebuild months apart must produce the same runtime.
# Keep in sync with README.md and with the sibling Rails repo
# (seahal/umaxica-apps-jit-global), which targets the same exact release.
ARG NODE_VERSION=24.19.0-trixie
ARG DOCKER_UID=1000
ARG DOCKER_USER=edge
ARG DOCKER_GID=1000
ARG DOCKER_GROUP=group

FROM node:${NODE_VERSION} AS base

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ARG DEBIAN_FRONTEND=noninteractive
ARG DOCKER_UID
ARG DOCKER_USER
ARG DOCKER_GID
ARG DOCKER_GROUP

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    dumb-init \
    git \
    less \
    libfontconfig1 \
    libfreetype6 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    openssh-client \
    tzdata \
  && rm -rf /var/lib/apt/lists/*

# Pinned, NOT `pnpm@latest`: an unpinned install silently drifts away from the
# exact version `package.json#packageManager` claims. These two must stay
# byte-identical.
RUN corepack enable \
  && corepack install --global pnpm@11.20.0

RUN set -eux; \
  base_user=node; \
  base_group=node; \
  target_user="${DOCKER_USER}"; \
  target_group="${DOCKER_GROUP}"; \
  groupmod --gid "${DOCKER_GID}" "${base_group}"; \
  if [ "${target_group}" != "${base_group}" ]; then \
    groupmod --new-name "${target_group}" "${base_group}"; \
  else \
    target_group="${base_group}"; \
  fi; \
  usermod --gid "${DOCKER_GID}" --shell /bin/bash "${base_user}"; \
  if [ "${target_user}" != "${base_user}" ]; then \
    usermod --login "${target_user}" --home "/home/${target_user}" --move-home "${base_user}"; \
  else \
    target_user="${base_user}"; \
  fi; \
  usermod --uid "${DOCKER_UID}" "${target_user}"; \
  usermod --gid "${DOCKER_GID}" "${target_user}"; \
  install -d -m 0755 -o "${target_user}" -g "${target_group}" /workspaces; \
  install -d -m 0755 -o "${target_user}" -g "${target_group}" /workspaces/umaxica-apps-edge

FROM base AS development

ARG DOCKER_UID
ARG DOCKER_USER
ARG DOCKER_GID
ARG DOCKER_GROUP

# hadolint ignore=DL3008
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bat \
    entr \
    fd-find \
    fzf \
    htop \
    jq \
    yq \
    ncdu \
    ripgrep \
    tig \
    tree \
    watch \
    bash \
    curl \
    wget \
    bubblewrap \
    python3 \
  && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/${DOCKER_USER} \
    USER=${DOCKER_USER} \
    LANG=C.UTF-8 \
    SHELL=/bin/bash

# Create necessary directories with proper permissions
RUN mkdir -p \
    "${HOME}/.config" \
    "${HOME}/.cache" \
    "${HOME}/.local/share" \
    "${HOME}/workspace" \
    "${HOME}/workspace/node_modules" \
  && chown -R "${DOCKER_UID}:${DOCKER_GID}" "${HOME}" \
  && chmod -R 755 "${HOME}"

# `pn` — the short alias for pnpm, used interactively and in docs.
#
# An executable on PATH rather than a Bash alias: this also works in `sh`, in
# non-interactive shells, from lefthook hooks, and from VS Code tasks, and it
# forwards arbitrary arguments verbatim. Because it resolves `pnpm` through
# PATH rather than hard-coding a path or a version, it can never diverge from
# the corepack-managed binary installed above.
#
# Development stage only — it is deliberately absent from any production image.
RUN printf '#!/bin/sh\nexec pnpm "$@"\n' > /usr/local/bin/pn \
  && chmod 0755 /usr/local/bin/pn

WORKDIR ${HOME}/workspace

ENV BUN_INSTALL=${HOME}/.bun \
    PATH=${HOME}/.bun/bin:${PATH}

USER ${DOCKER_USER}:${DOCKER_GROUP}

RUN curl -fsSL https://bun.sh/install | bash

CMD ["sleep", "infinity"]
