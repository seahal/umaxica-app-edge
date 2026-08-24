# ADR 014: Edge owns its development Tunnel

## Status: Accepted

## Context

Edge development surfaces need browser access through Cloudflare Access and Tunnel. Workers VPC is
a separate, one-way path from Edge Workers to Global/Rails. Sharing a host Podman network between
the repositories couples independent trust boundaries, while using the same Tunnel token would
register replicas with different origin reachability.

## Decision

Edge runs its own `cloudflare-tunnel` sidecar and uses a dedicated Tunnel ID and
`EDGE_CLOUDFLARED_TOKEN`, falling back to a generic `CLOUDFLARED_TOKEN` when a machine runs only
one tunnel locally. The connector reaches `core:<port>` only over Edge's compose default
network. Global shares neither the network nor the Tunnel token. Public Hostnames on the Edge
Tunnel remain protected by Cloudflare Access.

Global independently runs the connector used by Workers VPC to reach Rails. No Global-to-Edge VPC
path exists.

The cloudflared image is pinned to `2026.8.2`; Cloudflare supports releases for one year, so the pin
must be kept current.

## Consequences

A new machine must set the Edge-specific token in its gitignored root `.env` before Dev Container
startup. Missing configuration fails during Compose resolution. Rotating or revoking one Tunnel
does not affect the other repository.
