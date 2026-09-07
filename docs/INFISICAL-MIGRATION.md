# Infisical runtime migration

The production Portainer deployment should fetch runtime secrets from the
LAN-only Infisical service through `https://infisical.homebase.kazimurtaza.com`.
Do not commit secrets or edit the compose file until the migration is approved.

Required design: a one-shot `python:3-alpine` init container authenticates with
the `prunebox-runtime` Viewer identity, fetches the `prod` project, writes a
mode-0600 `.env` into a private shared volume, and the app sources it before
starting. Portainer retains only the bootstrap client ID, client secret, project
ID, and HTTPS host as stack variables. Missing or incomplete secrets must fail
closed. Validate with a rollback backup, health check, and a redeploy webhook.
