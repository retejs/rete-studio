#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}=== Rete Studio Package Update Script ===${NC}\n"

# Function to build and pack a package
function updatePackage {
  local package_dir=$1
  local package_name=$2

  echo -e "${YELLOW}📦 Updating ${package_name}...${NC}"
  cd "$package_dir"

  # Build the package
  echo "  Building..."
  npm run build

  # Pack the package
  echo "  Packing..."
  npm pack

  # Move tarball to package root (if packed in dist/)
  if [ -f dist/*.tgz ]; then
    mv dist/*.tgz .
  fi

  echo -e "${GREEN}✓ ${package_name} updated${NC}\n"
}

# Function to reinstall package dependencies in demo
function updateDemoPackage {
  local package_name=$1
  local tarball_path=$2

  echo -e "${YELLOW}🔄 Updating ${package_name} in demo...${NC}"
  cd "$SCRIPT_DIR/demo"

  # Uninstall and reinstall to ensure fresh package
  npm uninstall "$package_name" 2>/dev/null || true
  npm install "$tarball_path"

  echo -e "${GREEN}✓ ${package_name} updated in demo${NC}\n"
}

# Parse command line arguments
UPDATE_CORE=false
UPDATE_LANGUAGES=false
UPDATE_UI=false
UPDATE_ALL=false

if [ $# -eq 0 ]; then
  UPDATE_ALL=true
else
  for arg in "$@"; do
    case $arg in
      --core)
        UPDATE_CORE=true
        ;;
      --languages)
        UPDATE_LANGUAGES=true
        ;;
      --ui)
        UPDATE_UI=true
        ;;
      --all)
        UPDATE_ALL=true
        ;;
      --help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Update monorepo packages and demo dependencies"
        echo ""
        echo "Options:"
        echo "  --core        Update core package only"
        echo "  --languages   Update language packages only (javascript, template, dsl)"
        echo "  --ui          Update UI package only"
        echo "  --all         Update all packages (default)"
        echo "  --help        Show this help message"
        exit 0
        ;;
      *)
        echo "Unknown option: $arg"
        echo "Use --help to see available options"
        exit 1
        ;;
    esac
  done
fi

# Update core if requested
if [ "$UPDATE_ALL" = true ] || [ "$UPDATE_CORE" = true ]; then
  updatePackage "$SCRIPT_DIR/core" "rete-studio-core"

  # Core is a dependency of languages and UI, so update them too
  if [ "$UPDATE_CORE" = true ] && [ "$UPDATE_ALL" = false ]; then
    echo -e "${YELLOW}⚠️  Core updated. You may need to update languages and UI packages that depend on it.${NC}\n"
  fi
fi

# Update languages if requested
if [ "$UPDATE_ALL" = true ] || [ "$UPDATE_LANGUAGES" = true ]; then
  updatePackage "$SCRIPT_DIR/languages/template" "rete-studio-template-lang"
  updatePackage "$SCRIPT_DIR/languages/javascript" "rete-studio-javascript-lang"
  updatePackage "$SCRIPT_DIR/languages/dsl" "rete-studio-dsl-lang"
fi

# Update UI if requested
if [ "$UPDATE_ALL" = true ] || [ "$UPDATE_UI" = true ]; then
  updatePackage "$SCRIPT_DIR/ui" "rete-studio-ui"
fi

# Update demo dependencies
echo -e "${BLUE}=== Updating Demo Dependencies ===${NC}\n"

if [ "$UPDATE_ALL" = true ] || [ "$UPDATE_CORE" = true ]; then
  updateDemoPackage "rete-studio-core" "$SCRIPT_DIR/core/rete-studio-core-0.0.0.tgz"
fi

if [ "$UPDATE_ALL" = true ] || [ "$UPDATE_LANGUAGES" = true ]; then
  updateDemoPackage "rete-studio-template-lang" "$SCRIPT_DIR/languages/template/rete-studio-template-lang-0.0.0.tgz"
  updateDemoPackage "rete-studio-javascript-lang" "$SCRIPT_DIR/languages/javascript/rete-studio-javascript-lang-0.0.0.tgz"
  updateDemoPackage "rete-studio-dsl-lang" "$SCRIPT_DIR/languages/dsl/rete-studio-dsl-lang-0.0.0.tgz"
fi

if [ "$UPDATE_ALL" = true ] || [ "$UPDATE_UI" = true ]; then
  updateDemoPackage "rete-studio-ui" "$SCRIPT_DIR/ui/rete-studio-ui-0.0.0.tgz"
fi

echo -e "${GREEN}✅ All packages updated successfully!${NC}"
echo -e "${BLUE}You can now run 'cd demo && npm run dev' to start the demo${NC}"
