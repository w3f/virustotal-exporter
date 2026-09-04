# virustotal-exporter

Watches a set of internet domains for adverse security reputation and publishes what it finds as
Prometheus metrics. Every sweep it asks VirusTotal how many security vendors flag each domain as
malicious or suspicious; the Helm chart ships alerting rules that turn a non-zero count, or a
domain whose lookups keep failing, into an alert.

The watched set is the union of every DNS zone visible to a Cloudflare API token and a configured
list, rebuilt at the start of every sweep. Lookups are issued one at a time, 15 seconds apart, to
stay within VirusTotal's public rate limit.

## Metrics

| Metric                                      | Labels   | Meaning                                                |
| ------------------------------------------- | -------- | ------------------------------------------------------ |
| `virustotal_reports`                        | `domain` | vendors flagging the domain as malicious or suspicious |
| `virustotal_last_success_timestamp_seconds` | `domain` | Unix time of the last successful lookup                |

Served on port 3000 at `/metrics`, together with the default Node.js process metrics. `/health`
answers 200 while the process is serving. A failed lookup publishes nothing for that domain in
that sweep; a domain VirusTotal has never analysed publishes `0`.

## Configuration

| Variable               | Required | Default | Meaning                                               |
| ---------------------- | -------- | ------- | ----------------------------------------------------- |
| `VIRUSTOTAL_API_KEY`   | yes      |         | authenticates reputation lookups                      |
| `CLOUDFLARE_API_TOKEN` | no       |         | when set, every zone visible to it is watched         |
| `DOMAINS`              | no       | empty   | comma-separated domains to watch in addition to zones |
| `INTERVAL_MINUTES`     | no       | `480`   | minutes between sweep starts                          |
| `LOG_LEVEL`            | no       | `info`  | `debug`, `info`, `warn` or `error`                    |

Logs are JSON lines on stdout.

## Development

```
npm ci
npm run dev        # runs from source with tsx
npm test           # unit tests (node:test)
npm run lint
npm run build      # compiles to dist/
```

The chart lives in `deployment/chart`. Its alerting rules are unit-tested with promtool:

```
bash deployment/rule-tests/run.sh
```

## Releasing

Every push to `main` builds the image as `web3f/virustotal-exporter:<sha>`, promotes it to `main`
and `latest`, and publishes the chart to `https://w3f.github.io/helm-charts/` if its version is
new. To release, bump `version` and `appVersion` in `deployment/chart/Chart.yaml` and the version
in `package.json`, merge, then push a tag `vX.Y.Z` on that commit: the tested image is retagged
with the version and a GitHub Release is created.
