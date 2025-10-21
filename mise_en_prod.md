# Déployer `log.seagale.fr` — Mémo complet

## Déploiement standard

~~~bash
# 1) Aller dans le dossier du projet
cd /data/log

# 2) Récupérer les dernières modifications
git pull

# 3) Rebuild l’image Docker
docker build -t log-app:latest .

# 4) Redémarrer proprement le conteneur
docker rm -f log || true
docker run -d \
  --name log \
  --network web \
  --env-file /data/log/.env \
  -e HOST=0.0.0.0 -e PORT=3000 \
  --restart unless-stopped \
  log-app:latest