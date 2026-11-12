#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")"

echo "=== MarsPizza → GitHub ==="

# Если .git — файл-указатель на /tmp (из Cursor sandbox), превращаем в обычный репозиторий
if [ -f .git ]; then
  GITDIR="$(sed -n 's/^gitdir: //p' .git)"
  echo "Найден gitdir: $GITDIR"
  if [ -d "$GITDIR" ]; then
    rm -f .git
    mkdir -p .git
    cp -a "$GITDIR"/. .git/
    git config core.bare false
    git config --unset-all core.worktree 2>/dev/null || true
    echo "Репозиторий перенесён в локальную папку .git"
  fi
fi

if [ ! -d .git ]; then
  git init
  git add index.html style.css script.js README.md
  git commit -m "$(cat <<'EOF'
Add MarsPizza landing page for GitHub Pages.

Single-page HTML/CSS/JS site with menu, cart, calculator, weather scene, and order form.
EOF
)"
  git branch -M main
fi

git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/skrega/marspizza.git

git status
git log -1 --oneline
git push -u origin main

echo
echo "Готово: https://github.com/skrega/marspizza"
echo "Pages: Settings → Pages → Branch main / (root)"
echo "Сайт: https://skrega.github.io/marspizza/"
