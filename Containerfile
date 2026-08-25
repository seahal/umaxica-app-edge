# syntax=docker/dockerfile:1

# Keep these runtime pins aligned with package.json and the documented Edge baseline.
ARG NODE_VERSION=24.19.0-trixie
ARG PNPM_VERSION=11.22.0
ARG CLAUDE_CODE_VERSION=2.1.220
ARG CODEX_VERSION=0.147.0
ARG OPENCODE_VERSION=1.18.16
ARG CONTAINER_UID=1000
ARG CONTAINER_GID=1000
ARG CONTAINER_USER=edge
ARG CONTAINER_GROUP=edge

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

# Corepack is removed, not merely unused. Node ships it only up to (not
# including) 25.0.0, and pnpm no longer lists it as an installation method, so
# it is a dependency with an expiry date. Deleting it here means a later
# `corepack enable` cannot reintroduce a second `pnpm` on PATH ahead of the
# standalone install below, and it makes "builds without Corepack" a property
# the image demonstrates rather than one the Containerfile merely refrains from
# violating.
RUN npm rm --global corepack \
  && npm install --global \
    "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
    "@openai/codex@${CODEX_VERSION}" \
    "opencode-ai@${OPENCODE_VERSION}" \
  && npm cache clean --force

# The group is named after the user on purpose. Devcontainer features are
# third-party scripts, and several of them chown their state with a literal
# `${_REMOTE_USER}:${_REMOTE_USER}` — a group named
# anything else makes those installs fail with "chown: invalid group".
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
    PATH=/home/edge/.local/bin:/home/edge/.local/share/pnpm/bin:${PATH}

WORKDIR /home/edge/workspace
USER edge:edge

# Standalone install per https://pnpm.io/installation. This is the single source
# of pnpm in the image: it needs no root, so it runs after the USER switch and
# lands under $HOME rather than /usr/local.
#
# The PATH above ends in `/bin` for a reason. pnpm 11 moved every global binary
# into a `bin` subdirectory of PNPM_HOME — the install script runs `pnpm setup`,
# which installs the CLI with `pnpm add -g` and writes `pn`/`pnpx`/`pnx` there
# too, then deletes the v10-era shims that used to sit in PNPM_HOME itself.
# Pointing PATH at PNPM_HOME directly, as the v10 layout required, leaves this
# image with no pnpm at all.
#
# `pnpm setup` also has to identify the shell it is configuring, which it does
# from $SHELL — so this must stay below the ENV block that sets it. It writes a
# PATH line into ~/.bashrc as well; that is redundant here because PATH is baked
# into the image, but harmless, and suppressing it is not worth diverging from
# the documented install.
#
# PNPM_VERSION is pinned to the same version package.json declares under
# devEngines.packageManager; test/development-container-security.test.ts fails
# if the two ever drift apart.
RUN wget -qO- https://get.pnpm.io/install.sh \
  | env PNPM_VERSION="${PNPM_VERSION}" bash -

# The global install that `pnpm setup` performs is a SYMLINK into
# $PNPM_HOME/store (`store/v11/links/@pnpm/exe/...`) — but compose.yaml mounts
# the named volume `pnpm-store` over that store at runtime, hiding the image's
# copy behind an empty volume. The symlink then dangles and every `pn`/`pnpm`
# invocation fails with "exec: .../@pnpm/exe/pnpm: not found". Dereference it
# here so the global install is self-contained and survives the mount.
RUN set -eu; \
  for link in "${PNPM_HOME}"/global/v11/*/node_modules/@pnpm/exe; do \
    [ -L "${link}" ] || continue; \
    real="$(readlink -f "${link}")"; \
    rm "${link}"; \
    cp -a "${real}" "${link}"; \
  done; \
  pnpm --version

CMD ["sleep", "infinity"]
