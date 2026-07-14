#!/bin/bash
echo "==> Procurando Python no Homebrew..."
find /opt/homebrew -name "python3*" -type f 2>/dev/null
echo ""
echo "==> python3 no PATH:"
which python3
python3 --version
echo ""
echo "==> brew list python:"
/opt/homebrew/bin/brew list | grep python
