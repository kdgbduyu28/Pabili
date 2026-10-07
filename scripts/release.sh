#!/usr/bin/env bash
#
# Build Pabili for the web and deploy it to Cloudflare Pages.
#
#   ./scripts/release.sh               # build + deploy to pabili.pages.dev
#   ./scripts/release.sh --no-deploy   # build only
#   ./scripts/release.sh --clean       # clear the bundler cache first
#
# Same Cloudflare account and flow as health-platform-fe/scripts/release.sh.
# Always a production deploy, whatever git branch you are on.

set -euo pipefail

PROJECT=pabili
WRANGLER=(npx --yes wrangler@4)
# Stops wrangler from pausing on a hidden metrics prompt.
export WRANGLER_SEND_METRICS=false

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY=true
CLEAN=false

for arg in "$@"; do
  case "$arg" in
    --no-deploy) DEPLOY=false ;;
    --clean)     CLEAN=true ;;
    -h|--help)   sed -n '3,9p' "$0"; exit 0 ;;
    *) echo "release.sh: unknown option '$arg'" >&2; exit 2 ;;
  esac
done

if [[ "$DEPLOY" == true ]]; then
  echo "==> checking Cloudflare login"
  if ! whoami_out="$("${WRANGLER[@]}" whoami </dev/null 2>&1)" \
      || ! grep -qi "you are logged in" <<<"$whoami_out"; then
    echo "$whoami_out" >&2
    echo "release.sh: not signed in. Run: npx wrangler@4 login   (or pass --no-deploy)" >&2
    exit 1
  fi
  grep -i "you are logged in" <<<"$whoami_out" | sed 's/^/    /' || true
fi

echo "==> building"
cd "$ROOT"
extra=()
if [[ "$CLEAN" == true ]]; then
  rm -rf .expo
  extra=(--clear)
fi
rm -rf dist
npx expo export --platform web --output-dir dist ${extra[@]+"${extra[@]}"} </dev/null

# Wrangler never uploads folders named node_modules, so fonts Expo exports to
# assets/node_modules/... (the Ionicons font) would 404 and fall through to the
# SPA rewrite, breaking every icon. Move them and point the bundle at the new path.
if [[ -d dist/assets/node_modules ]]; then
  mv dist/assets/node_modules dist/assets/vendor
  grep -rlF '/assets/node_modules/' dist --include='*.js' --include='*.html' --include='*.css' \
    | xargs sed -i.bak 's#/assets/node_modules/#/assets/vendor/#g'
  find dist -name '*.bak' -delete
fi

if [[ "$DEPLOY" == false ]]; then
  echo "Built: $ROOT/dist ($(du -sh dist | cut -f1)), not deployed"
  exit 0
fi

# Create the Pages project on first deploy; later runs skip this. Newer
# wrangler tries to create a Workers project instead and fails on a plain
# assets folder; --force keeps it a classic Pages project like the rowph* apps.
if ! "${WRANGLER[@]}" pages project list </dev/null 2>/dev/null | grep -q "│ ${PROJECT} "; then
  echo "==> creating Pages project ${PROJECT}"
  "${WRANGLER[@]}" pages project create "$PROJECT" --production-branch main --force </dev/null
fi

echo "==> deploying to ${PROJECT}.pages.dev"
"${WRANGLER[@]}" pages deploy dist --project-name "$PROJECT" --branch main --commit-dirty=true </dev/null

echo ""
echo "Live: https://${PROJECT}.pages.dev"
