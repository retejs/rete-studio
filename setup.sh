function setupPackage {
  cd $1
  npm i
  npm run build
  cd dist
  npm pack
  mv *.tgz ..
}

function setupApp {
  cd $1
  npm i
}

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

setupPackage $SCRIPT_DIR/core
setupPackage $SCRIPT_DIR/languages/template
setupPackage $SCRIPT_DIR/languages/javascript
setupPackage $SCRIPT_DIR/ui
setupApp $SCRIPT_DIR/demo
setupApp $SCRIPT_DIR/studio
