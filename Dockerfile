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
    nano \
    openssh-client \
    sudo \
    tzdata \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g "bun@1.3.1" \
  && npm cache clean --force

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

ENV HOME=/home/edge \
    USER=${DOCKER_USER} \
    LANG=C.UTF-8 \
    SHELL=/bin/bash \
    BUN_INSTALL=/home/${DOCKER_USER}/.bun
ENV PATH=${BUN_INSTALL}/bin:${PATH}

RUN mkdir -p "${BUN_INSTALL}" "${HOME}/.cache/bun" "${HOME}/.config" \
  && chown -R "${DOCKER_UID}:${DOCKER_GID}" "${HOME}"

WORKDIR ${HOME}/main

USER ${DOCKER_UID}:${DOCKER_GID}

EXPOSE 5170 5171 5172 5173

CMD ["sleep", "infinity"]
