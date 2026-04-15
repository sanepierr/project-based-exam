release: cd backend && python manage.py migrate --noinput
web: cd backend && gunicorn cinequest.wsgi:application --bind 0.0.0.0:${PORT:-8000}
