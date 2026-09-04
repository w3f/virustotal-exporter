#!/usr/bin/env bash
# Renders the chart's PrometheusRule and runs the promtool unit tests against it.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

helm template virustotal-exporter "$here/../chart" \
  --set secrets.virustotalApiKey=placeholder \
  --show-only templates/prometheusrule.yaml \
  | sed -n '/^spec:/,$p' | tail -n +2 | sed 's/^  //' > "$work/rules.yaml"
cp "$here/tests.yaml" "$work/"

promtool check rules "$work/rules.yaml"
promtool test rules "$work/tests.yaml"
