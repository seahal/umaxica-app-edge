# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-trixie
ARG DOCKER_UID=1000
ARG DOCKER_USER=edge
ARG DOCKER_GID=1000
ARG DOCKER_GROUP=group

FROM node:${NODE_VERSION} AS base

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ARG DEBIAN_FRONTEND=noninteractive
ARG BUN_VERSION
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
    sudo \
    tzdata \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g "bun@1.3.2" \
  && npm cache clean --force \
  && corepack enable

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
  usermod --append --groups sudo "${target_user}"; \
  install -d -m 0755 -o "${target_user}" -g "${target_group}" /workspaces; \
  install -d -m 0755 -o "${target_user}" -g "${target_group}" /workspaces/umaxica-app-edge

RUN printf '%s ALL=(ALL) NOPASSWD:ALL\n' "${DOCKER_USER}" > /etc/sudoers.d/devcontainer \
  && chmod 0440 /etc/sudoers.d/devcontainer

FROM base AS development

ARG DOCKER_UID
ARG DOCKER_USER
ARG DOCKER_GID
ARG DOCKER_GROUP

ENV HOME=/home/${DOCKER_USER} \
    USER=${DOCKER_USER} \
    LANG=C.UTF-8 \
    SHELL=/bin/bash \
    BUN_INSTALL=/home/${DOCKER_USER}/.bun \
    BUN_CACHE_DIR=/home/${DOCKER_USER}/.cache/bun
ENV PATH=${BUN_INSTALL}/bin:${PATH}

# Create necessary directories with proper permissions
RUN mkdir -p "${BUN_INSTALL}" \
             "${HOME}/.cache/bun" \
             "${HOME}/.config" \
             "${HOME}/workspace" \
             "${HOME}/workspace/node_modules" \
  && chown -R "${DOCKER_UID}:${DOCKER_GID}" "${HOME}" \
  && chmod -R 755 "${HOME}"

WORKDIR ${HOME}/workspace

USER ${DOCKER_USER}:${DOCKER_GROUP}

# Set up bun for the user
RUN bun --version

EXPOSE 5170 5171 5172 5173

CMD ["sleep", "infinity"]
