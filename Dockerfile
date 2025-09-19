ARG NODE_VERSION=24-trixie

FROM node:${NODE_VERSION} AS base

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ARG DEBIAN_FRONTEND=noninteractive

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

RUN npm install -g "bun@latest" \
  && npm cache clean --force

RUN set -eux; \
  : "${DOCKER_UID:=1000}"; \
  : "${DOCKER_GID:=1000}"; \
  : "${DOCKER_USER:=user}"; \
  : "${DOCKER_GROUP:=group}"; \
  BASE_USER=node; \
  BASE_GROUP=node; \
  TARGET_GROUP="${DOCKER_GROUP}"; \
  TARGET_USER="${DOCKER_USER}"; \
  groupmod --gid "${DOCKER_GID}" "${BASE_GROUP}"; \
  if [ "${TARGET_GROUP}" != "${BASE_GROUP}" ]; then \
    groupmod --new-name "${TARGET_GROUP}" "${BASE_GROUP}"; \
  else \
    TARGET_GROUP="${BASE_GROUP}"; \
  fi; \
  usermod --gid "${DOCKER_GID}" --shell /bin/bash "${BASE_USER}"; \
  if [ "${TARGET_USER}" != "${BASE_USER}" ]; then \
    usermod --login "${TARGET_USER}" --home "/home/${TARGET_USER}" --move-home "${BASE_USER}"; \
  else \
    TARGET_USER="${BASE_USER}"; \
  fi; \
  usermod --uid "${DOCKER_UID}" "${TARGET_USER}"; \
  usermod --gid "${DOCKER_GID}" "${TARGET_USER}"; \
  usermod --append --groups sudo "${TARGET_USER}"; \
  install -d -m 0755 -o "${TARGET_USER}" -g "${TARGET_GROUP}" /workspaces; \
  install -d -m 0755 -o "${TARGET_USER}" -g "${TARGET_GROUP}" /workspaces/umaxica-app-edge

RUN printf '%s ALL=(ALL) NOPASSWD:ALL\n' "${DOCKER_USER}" > /etc/sudoers.d/devcontainer \
  && chmod 0440 /etc/sudoers.d/devcontainer

FROM base AS development

ENV HOME=/home/${DOCKER_USER} \
    USER=${DOCKER_USER} \
    LANG=C.UTF-8 \
    SHELL=/bin/bash \
    BUN_INSTALL=/home/${DOCKER_USER}/.bun
ENV PATH=${BUN_INSTALL}/bin:${PATH}

RUN mkdir -p "${BUN_INSTALL}" "${HOME}/.cache/bun" "${HOME}/.config" \
  && chown -R "${DOCKER_UID}:${DOCKER_GID}" "${HOME}"

WORKDIR /edge

USER ${DOCKER_UID}:${DOCKER_GID}

EXPOSE 4000 5170 5171 5172 5173

ENTRYPOINT ["dumb-init", "--"]

CMD ["sleep", "infinity"]
