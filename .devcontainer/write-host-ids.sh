#!/usr/bin/env bash
set -euo pipefail

# Runs on the host before the devcontainer builds (devcontainer.json
# initializeCommand). $UID/$GID are bash builtins, not exported env vars, so
# compose's ${UID:-1000}/${GID:-1000} substitution in compose.yaml silently
# falls back to 1000 unless something writes real values into the
# environment. On a host whose UID is not 1000 that fallback is not benign:
# `userns_mode: keep-id` maps the host user straight through, while the image
# still bakes CONTAINER_UID=1000 into /home/edge, so every home and workspace
# path lands with a mismatched owner and the developer has to chown by hand
# after each container recreate.
#
# Write the real values to a gitignored .env at the repo root; docker/podman
# compose auto-loads .env from the compose project directory, which the Dev
# Containers CLI resolves to the directory of the first dockerComposeFile
# entry (../compose.yaml, i.e. the repo root) -- and manual `podman compose`
# runs are invoked from the repo root as well. The container never sees this
# file: compose.yaml masks the workspace .env with .devcontainer/empty.env.
#
# The repo root .env also carries unrelated local settings, and may already
# hold empty `UID=`/`GID=` placeholders. Only rewrite those two lines; never
# truncate or replace the rest of the file.
#
# Kept in sync with seahal/umaxica-apps-global.
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${repo_root}/.env"

touch "${env_file}"

set_kv() {
  local key=$1 value=$2
  if grep -q "^${key}=" "${env_file}"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${env_file}"
  else
    printf '%s=%s\n' "${key}" "${value}" >> "${env_file}"
  fi
}

set_kv UID "$(id -u)"
set_kv GID "$(id -g)"
