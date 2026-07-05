# MCP Tunnels — Operator Runbook

How to connect Claude to MGCC's private-network MCP servers (the CRM, Estimating
Engine, and other internal services the AI Command Center reaches through the
[Model Context Protocol](https://modelcontextprotocol.io)) without opening any
inbound firewall ports.

Traffic flows over an **outbound-only** connection from our network to
Anthropic's tunnel edge, so we never expose an internal MCP server to the public
internet or allowlist Anthropic IP ranges on our origins.

> MCP tunnels are in Anthropic **research preview** — provided "as-is" with no
> uptime/support commitment, and they ride on Cloudflare's network as the
> transport. [Request access](https://claude.com/form/claude-managed-agents)
> before relying on this. Treat this runbook as provisional.

Once a tunnel is up, MGCC code reaches the upstream servers through
[`@mgcc/mcp-connector`](../packages/mcp-connector/README.md) — see
[Reference the tunnel from code](#reference-the-tunnel-from-code).

---

## How it works (60-second version)

Two containers run inside our network as the **tunnel stack**:

- **cloudflared** — Cloudflare's connector; dials **outbound** to the tunnel
  edge and carries encrypted traffic.
- **proxy** (`mcp-proxy`) — Anthropic's router; terminates *inner TLS*, checks
  upstream IPs against an allowed range, and routes each request to the right
  internal MCP server by hostname.

Each upstream server is exposed as one subdomain of our tunnel domain:
`<route>.<tunnel-domain>` (e.g. `crm.abcd1234.tunnel.anthropic.com`).

Three independent layers protect every request: outer mTLS (Anthropic ↔
transport) with IP validation, inner TLS (Anthropic backend ↔ our proxy, using a
cert only we hold — so Cloudflare cannot read payloads), and each MCP server's
own OAuth/bearer auth. **The tunnel carries traffic; it does not authenticate to
the upstream server** — configure the server's own auth as you would for any
remote MCP server.

### Network requirements (egress only)

| Component       | Destination                                          | Port / protocol  | When                    |
| --------------- | ---------------------------------------------------- | ---------------- | ----------------------- |
| Setup component | `api.anthropic.com`                                  | 443 TCP          | Provisioning / rotation |
| cloudflared     | Tunnel edge (`198.41.192.0/19`, `2606:4700:a0::/44`) | 7844 TCP and UDP | Runtime                 |
| Proxy           | Our upstream MCP servers                             | As configured    | Runtime                 |

---

## Prerequisites

- One or more **MCP servers** running in our network, reachable from the cluster.
- A **Console role with the Manage tunnels permission** (org admins/owners have
  it by default) to create tunnels, rotate the token, and manage certs.
- A **deployment target**, either:
  - a **Kubernetes cluster** with `helm` and `kubectl` → [Deploy with Helm](#part-2a--deploy-with-helm-kubernetes), or
  - a **VM with Docker + Docker Compose** → [Deploy with Docker Compose](#part-2b--deploy-with-docker-compose-single-vm).

  The manual credential flow also needs `openssl` ≥ 1.1.1 on whichever host
  generates the certificates.
- Egress connectivity per the table above.
- A choice of **credential-provisioning mode**:
  - **Programmatic access (recommended)** — the setup component authenticates
    via [Workload Identity Federation](https://docs.anthropic.com/en/docs/manage-claude/workload-identity-federation),
    fetches the tunnel token, generates + registers a CA automatically, and a
    daily CronJob renews the server cert. No secrets handled by hand. Requires a
    federation rule scoped to `workspace:manage_tunnels`.
  - **Manual** — we retrieve the token from the Console, generate a CA + server
    cert with `openssl`, register the CA in the Console, and supply both as
    Kubernetes Secrets.

Our org may hold **up to 10 active tunnels**. Tunnels are **workspace-scoped**.

---

## Part 1 — Create the tunnel in the Console

1. **Manage > MCP tunnels** → confirm the correct workspace is selected (the
   tunnel belongs to it), then **New tunnel**.
2. Name it (e.g. `mgcc-prod`). A domain like `abcd1234.tunnel.anthropic.com` is
   assigned automatically.
3. *(Optional)* Toggle **Set up programmatic access** and pick/create a
   federation rule with the `workspace:manage_tunnels` scope. Skipping this is
   fully supported — the stack then uses the manual flow.
4. **Create tunnel** → the detail page opens.
5. **Record the identifiers** you'll need at deploy time:

   | Always                          | Programmatic access               | Manual                                    |
   | ------------------------------- | --------------------------------- | ----------------------------------------- |
   | Tunnel ID (`tnl_...`)           | Federation rule ID (`fdrl_...`)   | Tunnel token (eye icon → **Show token**)  |
   | Tunnel domain (`abcd1234.tunnel.anthropic.com`) | Organization ID (UUID) | A CA cert you generate + register         |

Creating a tunnel does **not** establish connectivity — that happens when the
stack dials in and a CA cert is registered.

### Register a CA certificate (manual mode, or any manual cert rotation)

A tunnel with **no active certificate cannot accept connections** and won't
appear in the agent MCP server picker.

- Detail page → **Certificates** → **Add certificate**.
- Provide a `.pem`/`.crt`/`.cer` (≤ 8 kB) — a `-----BEGIN CERTIFICATE-----`
  block only; private-key material is rejected.
- A tunnel holds **up to two active certs** so you can rotate without downtime.

### The token is a secret

Every token reveal/rotation is logged to the Compliance API. **Rotate token**
invalidates the current token immediately (existing cloudflared connections keep
draining). Copy it straight into the secret store.

---

## Part 2 — Deploy the tunnel stack

Pick a deployment target: **Helm** on Kubernetes ([Part 2A](#part-2a--deploy-with-helm-kubernetes))
or **Docker Compose** on a single VM ([Part 2B](#part-2b--deploy-with-docker-compose-single-vm)).
Both offer the same programmatic-access and manual credential flows and reach the
same tunnel — nothing traffic flows until the stack is running and dialed in.

## Part 2A — Deploy with Helm (Kubernetes)

Chart: `oci://us-docker.pkg.dev/anthropic-public-registry/charts/mcp-tunnel`,
version **2.0.0**. Examples assume release **`mcp-tunnel`** in namespace
**`mcp-tunnel`**. Always pass `--version` explicitly.

> If you don't yet have an MCP server to test against, deploy the sample
> `hello-mcp` server from the
> [Helm deploy guide](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/deploy-helm#optional-use-a-sample-mcp-server)
> and use the route `echo: http://hello-mcp:9000`.

Fetch the default values once (both flows):

```bash
helm show values \
  oci://us-docker.pkg.dev/anthropic-public-registry/charts/mcp-tunnel \
  --version 2.0.0 > values.yaml
```

### Flow A — With programmatic access (recommended)

1. **Set up WIF for the cluster.** Follow
   [Use WIF with Kubernetes](https://docs.anthropic.com/en/docs/manage-claude/wif-providers/kubernetes).
   The setup component runs under the ServiceAccount `mcp-tunnel-setup` (derived
   from the Helm `fullname`; for any release name other than `mcp-tunnel`,
   confirm with `helm template <release> ... | grep -A2 'kind: ServiceAccount'`).
   Create a federation rule:

   | Field    | Value                                               |
   | -------- | --------------------------------------------------- |
   | Subject  | `system:serviceaccount:mcp-tunnel:mcp-tunnel-setup` |
   | Audience | `api.anthropic.com` (chart default; **no scheme**)  |
   | Scope    | `workspace:manage_tunnels`                          |

   > **Audience must match byte-for-byte.** The chart default is
   > `api.anthropic.com` (no scheme) but the Console form suggests
   > `https://api.anthropic.com`. Either set the rule's audience to
   > `api.anthropic.com`, or set `api.wif.audience: https://api.anthropic.com`
   > in `values.yaml`. A mismatch fails authentication.

   If the tunnel lives in a non-default workspace, add the rule's service
   account to that workspace (**Settings > Workspaces**) and pass its ID as
   `api.wif.workspaceId`. Note the rule ID (`fdrl_...`).

2. **Configure `values.yaml`:**

   ```yaml
   api:
     wif:
       federationRuleId: "fdrl_..."
       organizationId: "00000000-0000-0000-0000-000000000000"
       # workspaceId: "wrkspc_..."   # only for a non-default workspace

   tunnel:
     id: ""            # empty → setup hook creates the tunnel during install
     tokenVersion: "1" # bump to rotate the token on the next forced upgrade

   gateway:
     config:
       routes:
         crm: http://crm-mcp.internal:8080
         estimating: http://estimating-mcp.internal:8080
   ```

   With these routes Claude reaches `crm.<tunnel-domain>` and
   `estimating.<tunnel-domain>`. If routes target in-cluster Services on a
   Service CIDR outside the standard private ranges, also set
   `gateway.config.upstream.allowed_ips`.

3. **Review, then install** (the setup component runs as a pre-install hook, so
   `helm install` blocks until it finishes; Helm deletes the Job on success):

   ```bash
   helm template mcp-tunnel \
     oci://us-docker.pkg.dev/anthropic-public-registry/charts/mcp-tunnel \
     --version 2.0.0 -n mcp-tunnel -f values.yaml > rendered.yaml
   # review rendered.yaml per our vetting practices, then:
   helm install mcp-tunnel \
     oci://us-docker.pkg.dev/anthropic-public-registry/charts/mcp-tunnel \
     --version 2.0.0 --namespace mcp-tunnel --create-namespace -f values.yaml
   ```

   When `tunnel.id` is empty the setup component creates the tunnel and stores
   its ID + domain in the `mcp-tunnel` Secret (re-runs reuse that ID — it never
   creates a second tunnel). Read the domain:

   ```bash
   kubectl -n mcp-tunnel get secret mcp-tunnel \
     -o jsonpath='{.data.tunnel-domain}' | base64 -d
   ```

   > The sensitive data at rest is the `mcp-tunnel` Secret (tunnel token + TLS
   > private keys). The `api.wif.*` values are identifiers, not secrets. Apply
   > our standard Kubernetes-Secret protections to this namespace.

### Flow B — Without programmatic access (manual)

No API calls from the chart; no setup component, no cert-renew CronJob.

1. **Get the token + domain** from the Console (Part 1).
2. **Generate a CA + server cert.** The server cert's SAN must include
   `*.<tunnel-domain>`:

   ```bash
   export TUNNEL_DOMAIN=abcd1234.tunnel.anthropic.com
   mkdir -p mcp-tunnel/data && cd mcp-tunnel

   openssl req -x509 -newkey rsa:2048 -nodes \
     -keyout data/ca.key -out data/ca.crt -days 3650 -subj "/CN=mcp-tunnel-ca" \
     -addext "basicConstraints=critical,CA:TRUE" \
     -addext "keyUsage=critical,keyCertSign,cRLSign" \
     -addext "subjectKeyIdentifier=hash"

   cat > data/tls.ext <<EOF
   subjectAltName = DNS:${TUNNEL_DOMAIN},DNS:*.${TUNNEL_DOMAIN}
   authorityKeyIdentifier = keyid,issuer
   extendedKeyUsage = serverAuth
   EOF

   openssl req -newkey rsa:2048 -nodes \
     -keyout data/tls.key -out /tmp/server.csr -subj "/CN=${TUNNEL_DOMAIN}"
   openssl x509 -req -in /tmp/server.csr \
     -CA data/ca.crt -CAkey data/ca.key -CAcreateserial \
     -out data/tls.crt -days 90 -extfile data/tls.ext
   ```

   **Register `data/ca.crt` in the Console.** Keep `data/ca.key` durable and
   secure — it signs future server certs at renewal.

3. **Create the two Secrets** (names are configurable; **keys are not**):

   ```bash
   kubectl create namespace mcp-tunnel --dry-run=client -o yaml | kubectl apply -f -
   kubectl -n mcp-tunnel create secret generic mcp-tunnel-token \
     --from-literal=tunnel-token='eyJ...'
   kubectl -n mcp-tunnel create secret generic mcp-tunnel-cert \
     --from-file=tls.crt=data/tls.crt --from-file=tls.key=data/tls.key
   ```

4. **Configure `values.yaml`:**

   ```yaml
   setup:
     enabled: false

   external:
     tunnelTokenSecretName: mcp-tunnel-token   # key: tunnel-token
     serverCertSecretName: mcp-tunnel-cert     # keys: tls.crt, tls.key

   gateway:
     config:
       tunnel_domain: abcd1234.tunnel.anthropic.com  # required when setup.enabled=false
       routes:
         crm: http://crm-mcp.internal:8080
         estimating: http://estimating-mcp.internal:8080
   ```

5. **Review + install** (same `helm template` / `helm install` commands as Flow
   A).

---

## Part 2B — Deploy with Docker Compose (single VM)

Runs the stack as hardened containers on one host (replicate across hosts for
availability). Images are pinned by digest and run non-root, read-only, with all
capabilities dropped. All commands run from an `mcp-tunnel/` deployment
directory. This is a reference layout — adapt it to our security requirements.

> For a quick test without a real MCP server, add a `hello-mcp` service (see the
> [Compose deploy guide](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/deploy-compose#optional-use-a-sample-mcp-server))
> and use the route `echo: http://hello-mcp:9000`.

The proxy image and config path are the same in both flows:

- Image: `us-docker.pkg.dev/anthropic-public-registry/images/mcp-proxy` (pin by digest)
- Config mounted at `/etc/mcp-gateway/config.yaml`, certs/data under `/data`
- cloudflared shares the proxy's netns (`network_mode: "service:mcp-proxy"`) so
  `localhost:8080` reaches the proxy; its `--url http://localhost:8080` flag is
  **required** in the manual flow or it 503s every request.

### Flow A — With programmatic access

Requires an OIDC identity provider on the host (cloud VM metadata, SPIFFE, …).

1. **Scaffold** (`data/` must be writable by the container UID 65532):

   ```bash
   mkdir -p mcp-tunnel/{config,data} && cd mcp-tunnel
   sudo chown 65532:65532 data
   ```

2. **Write `docker-compose.yaml`** with a `setup` service (profile `setup`,
   entrypoint `/setup`, `command: [init, --api-url=https://api.anthropic.com, --output=dir:/data, --token-version=1]`),
   a `cloudflared` service, and an `mcp-proxy` service — all non-root,
   `read_only: true`, `cap_drop: [ALL]`, `no-new-privileges`. (Full manifest in
   the [Compose deploy guide](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/deploy-compose).)

3. **Provision the tunnel** (leave `TUNNEL_ID` unset to have setup create one):

   ```bash
   # export TUNNEL_ID=tnl_...                 # set to attach to an existing tunnel
   export ANTHROPIC_FEDERATION_RULE_ID=fdrl_...
   export ANTHROPIC_ORGANIZATION_ID=00000000-0000-0000-0000-000000000000
   # export ANTHROPIC_WORKSPACE_ID=wrkspc_... # if the rule is workspace-scoped
   export ANTHROPIC_IDENTITY_TOKEN=...        # OIDC JWT from this host's IdP (audience must match the rule)

   docker compose run --rm setup              # idempotent over data/; never creates a 2nd tunnel
   export TUNNEL_DOMAIN=$(sudo cat data/tunnel-domain)
   ```

4. **Write `config/mcp-proxy.yaml`** — `tunnel_domain` is **required**; `routes`
   is a flat subdomain→URL map:

   ```yaml
   listen_addr: ":8080"
   log_level: info
   shutdown_timeout: 30s
   tunnel_domain: ${TUNNEL_DOMAIN}   # substitute the exported value
   tls:
     cert_file: /data/tls.crt
     key_file: /data/tls.key
   routes:
     crm: http://crm-mcp.internal:8080
     estimating: http://estimating-mcp.internal:8080
   ```

5. **Start:**

   ```bash
   export TUNNEL_TOKEN=$(sudo cat data/tunnel-token)
   docker compose up -d
   ```

### Flow B — Without programmatic access (manual)

No `setup` service; generate certs yourself.

1. **Get token + domain** from the Console, then:

   ```bash
   export TUNNEL_DOMAIN=abcd1234.tunnel.anthropic.com
   export TUNNEL_TOKEN='eyJ...'
   mkdir -p mcp-tunnel/{data,config} && cd mcp-tunnel
   ```

2. **Generate the CA + server cert** (same `openssl` commands as the
   [Helm manual flow](#flow-b--without-programmatic-access-manual) — SAN must
   include `*.${TUNNEL_DOMAIN}`), then **`chmod 644 data/tls.key`** so the
   non-root container (UID 65532) can read it from the bind mount. **Register
   `data/ca.crt` in the Console** — the tunnel flips to **Active**.

3. **Write `config/mcp-proxy.yaml`** (same as Flow A above) and a
   `docker-compose.yaml` with just `cloudflared` + `mcp-proxy` (no `setup`
   service; keep `--url http://localhost:8080` on cloudflared).

4. **Start:** `docker compose up -d`

> `TUNNEL_TOKEN` is read from the environment with no default — re-export it in
> every fresh shell and after a reboot. For multi-VM, copy `mcp-tunnel/` to each
> host, set `TUNNEL_TOKEN`, and `docker compose up -d`; the same token and certs
> work across replicas.

### Compose operations

- **Rotate token (programmatic):** bump the `setup` service's `--token-version`
  in `docker-compose.yaml`, re-mint `ANTHROPIC_IDENTITY_TOKEN`, `docker compose
  run --rm setup`, then `export TUNNEL_TOKEN=$(sudo cat data/tunnel-token) &&
  docker compose up -d cloudflared`.
- **Rotate token (manual):** **Rotate token** in the Console, update
  `TUNNEL_TOKEN` on each host, `docker compose up -d cloudflared`.
- **Cert renewal (programmatic):** `docker compose run --rm setup renew-cert
  --output=dir:/data` (add `--renew-before=720h` to make it a safe no-op on a
  schedule).
- **Cert renewal (manual):** re-sign with the existing CA (same `openssl x509`
  as Helm) and replace `data/tls.crt`. The proxy polls and hot-reloads — no
  restart.

---

## Verify the deployment

From Anthropic's side, use `https://<route>.<tunnel-domain>/<path>` in a Managed
Agent session or a Messages API request — `<route>` is a `gateway.config.routes`
key, `<path>` is whatever the upstream server serves (FastMCP `streamable-http`
serves `/mcp`). With the sample server: `https://echo.<tunnel-domain>/mcp`.

Note: `<route>` is a `gateway.config.routes` key (Helm) or a `routes` key in
`config/mcp-proxy.yaml` (Compose). If it fails, check the two container logs and
see the troubleshooting guide:

```bash
# Helm (Kubernetes)
kubectl -n mcp-tunnel logs deploy/mcp-tunnel -c mcp-proxy
kubectl -n mcp-tunnel logs deploy/mcp-tunnel -c cloudflared

# Docker Compose
docker compose logs mcp-proxy
docker compose logs cloudflared
```

---

## Reference the tunnel from code

Once the tunnel is active, MGCC services call the upstream servers through
[`@mgcc/mcp-connector`](../packages/mcp-connector/README.md). The only
tunnel-specific value is the URL — build it with `tunnelServer`:

```ts
import { McpConnectorClient, tunnelServer } from "@mgcc/mcp-connector";

const client = new McpConnectorClient(); // ANTHROPIC_API_KEY for the tunnel's workspace

await client.createMessage({
  model: "claude-opus-4-8",
  max_tokens: 1000,
  messages: [{ role: "user", content: "List overdue CRM follow-ups." }],
  bindings: [
    {
      server: tunnelServer({
        subdomain: "crm", // a gateway.config.routes key
        tunnelDomain: "abcd1234.tunnel.anthropic.com",
        // path defaults to "/mcp"; override to match the upstream server
        // authorization_token: "…", // the server's OWN auth — the tunnel does not authenticate to it
      }),
    },
  ],
});
```

Use the API key for the **same workspace** the tunnel was created in. Note:
tunnels created through the Console are **not** available as connectors in
claude.ai.

---

## Operations

### Rotate the tunnel token

**Programmatic:** bump `tunnel.tokenVersion` in `values.yaml`, then force the
setup component to re-run (it only re-runs on upgrade when forced):

```bash
helm upgrade mcp-tunnel \
  oci://us-docker.pkg.dev/anthropic-public-registry/charts/mcp-tunnel \
  --version 2.0.0 -n mcp-tunnel -f values.yaml --set setup.force=true
```

**Manual:** click **Rotate token** in the Console, then update the Secret and
restart:

```bash
kubectl -n mcp-tunnel create secret generic mcp-tunnel-token \
  --from-literal=tunnel-token='eyJ...' --dry-run=client -o yaml | kubectl apply -f -
kubectl -n mcp-tunnel rollout restart deploy/mcp-tunnel
```

> Rotating invalidates the old token immediately. Until the Secret is updated
> and the rollout completes, any pod that restarts (eviction, drain, OOM) can't
> reconnect. Update promptly; prefer programmatic access for stricter
> availability.

### Certificate renewal

**Programmatic:** automatic. The `-cert-renew` CronJob runs `setup renew-cert`
daily (default `0 0 * * *` UTC), a no-op until within `serverCert.renewBefore`
(default 30 days) of expiry. Renewal is local (no API calls); the proxy
hot-reloads from the Secret mount — no restart. *We still monitor expiry and
confirm renewal ran.*

**Manual:** no CronJob. From the `mcp-tunnel/` dir kept at install, sign a fresh
server cert with the **existing** CA (do not regenerate the CA):

```bash
export TUNNEL_DOMAIN=abcd1234.tunnel.anthropic.com
openssl req -new -key data/tls.key -out /tmp/server.csr -subj "/CN=${TUNNEL_DOMAIN}"
openssl x509 -req -in /tmp/server.csr \
  -CA data/ca.crt -CAkey data/ca.key -CAcreateserial \
  -out data/tls.crt -days 90 -extfile data/tls.ext

kubectl -n mcp-tunnel create secret generic mcp-tunnel-cert \
  --from-file=tls.crt=data/tls.crt --from-file=tls.key=data/tls.key \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Change routes / config

Keep a **complete** `values.yaml` (don't rely on `--reuse-values`; Helm's
deep-merge can silently keep deleted routes), then:

```bash
helm upgrade mcp-tunnel \
  oci://us-docker.pkg.dev/anthropic-public-registry/charts/mcp-tunnel \
  --version 2.0.0 -n mcp-tunnel -f values.yaml
```

### Upgrade from chart 1.x

Chart 2.0.0 moved the tunnel ID from `api.wif.tunnelId` to `tunnel.id`. Move the
`tnl_...` value and remove the old key. Also update the federation rule's scope
from `org:manage_tunnels` to `workspace:manage_tunnels` in the Console.

### Archive a tunnel

**MCP tunnels** list → row menu → **Archive**. This immediately stops the tunnel
from accepting connections and is **permanent**.

---

## Hardening notes

- If an attacker obtains the tunnel token **and** a TLS private key, they can
  impersonate our proxy and read MCP payloads. Treat both as high-value secrets.
- Ingress to the proxy pod is denied by default. To restrict egress too, set
  `networkPolicy.egress.enabled: true` and list the upstream MCP servers under
  `networkPolicy.egress.mcpServers`.
- Configure OAuth/bearer auth on every upstream MCP server — the tunnel does not
  do it for you.
- We own: all traffic through the tunnel, securing tokens + private keys,
  renewing the server cert before expiry, restricting network access, and
  notifying Anthropic on suspected breach.

## References

- [MCP tunnels overview](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/overview)
- [Architecture & components](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/concepts)
- [Manage tunnels in the Console](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/console)
- [Deploy with Helm](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/deploy-helm) ·
  [Deploy with Docker Compose](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/deploy-compose)
- [Security](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/security) ·
  [Troubleshooting](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/troubleshooting) ·
  [Reference](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/reference)
- [`@mgcc/mcp-connector`](../packages/mcp-connector/README.md) — the client-side code
