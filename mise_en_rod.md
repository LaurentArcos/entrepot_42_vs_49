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

# 5) Lancer l’app (publication sur 127.0.0.1:3007 -> 3000 dans le conteneur)
docker run -d \
  --name log \
  --env-file /data/log/.env \
  -p 127.0.0.1:3007:3000 \
  --restart unless-stopped \
  log-app:latest