set -e

function setupPackage {
  cd $1
  rm -f package-lock.json
  npm i --registry=https://registry.npmmirror.com
  npm run build
  cd dist
  npm pack
  mv *.tgz ..
  sleep 2
}

function setupApp {
  cd $1
  rm -f package-lock.json
  npm i --registry=https://registry.npmmirror.com
}

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

setupPackage $SCRIPT_DIR/core
setupPackage $SCRIPT_DIR/languages/template
setupPackage $SCRIPT_DIR/languages/javascript
setupPackage $SCRIPT_DIR/languages/dsl
setupPackage $SCRIPT_DIR/ui
setupApp $SCRIPT_DIR/demo
