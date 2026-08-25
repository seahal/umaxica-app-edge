#!/usr/bin/env bash
set -euo pipefail

# Runs on the host before the devcontainer starts (devcontainer.json
# initializeCommand), after write-host-ids.sh.
#
# `devcontainer exec` finds its target by the `devcontainer.local_folder`
# label, not by the Compose project. Every container this repository has ever
# produced carries the same value for that label, so a leftover from an earlier
# Compose project name -- a renamed project, a `-f` list that changed, an older
# CLI that suffixed the folder name -- stays a candidate forever. When the CLI
# picks the stopped leftover instead of the container it just started, the only
# symptom is:
#
#   Error: can only create exec sessions on running containers: container state improper
#
# which names neither container and points at nothing to fix. Remove the
# leftovers here, where the ambiguity is still cheap to resolve.
#
# Two rules keep this safe. A project with a running container is never
# touched, and a project is only removed when it is *not* the one currently in
# use -- so `shutdownAction: stopCompose` stopping this project's own
# containers between sessions is not mistaken for staleness, and the built
# container survives a restart. Volumes are never removed: they are named per
# project and an unreferenced one costs disk, not correctness.

command -v podman > /dev/null 2>&1 || exit 0

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

projects=$(
  podman ps --all --sort created \
    --filter "label=devcontainer.local_folder=${repo_root}" \
    --format '{{.State}} {{.Label "com.docker.compose.project"}}'
)
[[ -n ${projects} ]] || exit 0

# The project in use is the one that is up. When nothing is up -- the ordinary
# case for an `initializeCommand`, which runs before the container starts --
# fall back to the most recently created, which `--sort created` puts last.
current_project=$(
  printf '%s\n' "${projects}" | grep '^running ' | tail -n 1 | cut -d' ' -f2
) || true
[[ -n ${current_project} ]] ||
  current_project=$(printf '%s\n' "${projects}" | tail -n 1 | cut -d' ' -f2)

while read -r state project; do
  [[ -n ${project} && ${project} != "${current_project}" ]] || continue
  if [[ ${state} == running ]]; then
    echo "Leaving running containers of Compose project '${project}' alone." >&2
    continue
  fi
  # Remove the whole project, not just the labelled service container: the
  # `cloudflare-tunnel` sidecar carries no devcontainer label but does declare
  # `depends_on: core`, and Podman refuses to remove a container that still has
  # a dependent.
  echo "Removing stale devcontainer Compose project '${project}'." >&2
  podman ps --all --quiet --filter "label=com.docker.compose.project=${project}" |
    xargs --no-run-if-empty podman rm --force --depend > /dev/null
done <<< "${projects}"
