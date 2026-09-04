# Deployment

## Docker image

Published to Docker Hub as [`web3f/virustotal-exporter`](https://hub.docker.com/r/web3f/virustotal-exporter):

| Tag              | Published on                 |
| ---------------- | ---------------------------- |
| `<sha>`          | every commit to `main`       |
| `main`, `latest` | `main`, after the gates pass |
| `vX.Y.Z`         | release tags                 |

Release tags don't rebuild — they retag the already-tested `<sha>` image.

## Helm chart

The chart in [`chart/`](chart) deploys a single replica with a Service, a Secret holding the API credentials and, by default, a `ServiceMonitor` and a `PrometheusRule` with two alerts:

- `VirustotalDomainFlagged` — a watched domain is reported as malicious or suspicious
- `VirustotalLookupStale` — a domain has had no successful lookup for three sweep intervals

It's published to the [W3F chart repository](https://github.com/w3f/helm-charts/tree/gh-pages) on every `main` build whose chart version is new:

```bash
helm repo add w3f https://w3f.github.io/helm-charts
helm install virustotal-exporter w3f/virustotal-exporter -f your-values.yaml
```

[`chart/values.yaml`](chart/values.yaml) documents the defaults inline. You'll need to supply, at minimum:

- `secrets.virustotalApiKey`
- `secrets.cloudflareApiToken`, `domains`, or both
- `image.tag` — pin a release tag; the default `latest` is for trying it out

Set `serviceMonitor.enabled: false` and `prometheusRule.enabled: false` if you don't run the Prometheus operator.

The alerting rules are unit-tested with promtool against the rendered chart:

```bash
bash deployment/rule-tests/run.sh
```

## CI

GitHub Actions ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)):

- **Pull requests** — build, lint, unit tests, chart lint and render, alert-rule tests.
- **`main`** — push the `<sha>` image, promote `main`/`latest` and publish the chart.
- **Release tags** — retag the tested image and create a GitHub Release.

To release, push a `vX.Y.Z` tag on `main`. Bump `version` in [`chart/Chart.yaml`](chart/Chart.yaml) whenever the chart changes; that is what publishes it.
