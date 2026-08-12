# Tailscale in the Edge container

This refresh stops at Phase 1:

1. install the Tailscale client and daemon tooling;
2. verify `tailscale version`;
3. verify that `tailscaled` can create a userspace-networking socket without joining.

Run `scripts/check-tailscale-phase1`. It uses temporary in-memory/local state, does not
register an auth key, does not join the tailnet, and does not configure Tailscale SSH.

Later phases are explicitly deferred: dedicated `tag:devcontainer` identity, ephemeral node,
ACL policy, userspace traffic tests, Tailscale SSH, recreation behavior, rotation, and
revocation. They must not reuse host SSH credentials or request a Tailscale Auth Key during
this refresh.
