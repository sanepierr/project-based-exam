#!/usr/bin/env bash
set -euo pipefail

# Backend: install deps and collect static assets for production
cd backend
python -m pip install -r requirements.txt
python manage.py collectstatic --noinput
