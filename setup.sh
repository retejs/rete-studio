set -e

function setupPackage {
  PACKAGE_DIR=$1
  FORCE_UPDATE_PACKAGES_STR=$2
  
  cd $PACKAGE_DIR
  
  # Force update local packages if specified
  if [ -n "$FORCE_UPDATE_PACKAGES_STR" ]; then
    read -ra FORCE_UPDATE_PACKAGES <<< "$FORCE_UPDATE_PACKAGES_STR"
    for package in "${FORCE_UPDATE_PACKAGES[@]}"; do
      npm install --force $package
    done
  fi

  npm ci
  
  npm run build
  cd dist
  npm pack
  mv *.tgz ..
  sleep 2
}

function setupApp {
  cd $1
  rm -f package-lock.json
  npm i
}

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

setupPackage $SCRIPT_DIR/core
setupPackage $SCRIPT_DIR/languages/template "rete-studio-core"
setupPackage $SCRIPT_DIR/languages/javascript "rete-studio-core"
setupPackage $SCRIPT_DIR/ui "rete-studio-core"
# Example with multiple packages: setupPackage $SCRIPT_DIR/some-package "rete-studio-core rete-studio-ui"
setupApp $SCRIPT_DIR/demo
