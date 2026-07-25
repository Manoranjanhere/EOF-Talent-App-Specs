# Deploy EOF Talent API on EC2 (Docker + Postgres)

Your instance:

| Field | Value |
|--------|--------|
| Instance ID | `i-088f3d250343e2527` |
| Public IP | `13.203.201.155` |
| Private IP | `172.31.3.87` |
| API | `http://13.203.201.155:3000/api` |
| Docs | `http://13.203.201.155:3000/docs` |

## 1. AWS Security Group

Inbound rules on the instance security group:

| Port | Source | Why |
|------|--------|-----|
| 22 | Your IP | SSH |
| 3000 | `0.0.0.0/0` | Mobile app API + Socket.io |

Do **not** open Postgres `5432` to the internet.

## 2. On the EC2 box (Ubuntu)

```bash
# Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
# log out / in so docker works without sudo

# Clone (or pull)
git clone <YOUR_REPO_URL> EOF-Talent-App-Specs
cd EOF-Talent-App-Specs
# later updates:
# git pull
```

## 3. Env + Firebase

```bash
cp deploy/ec2.env.example .env
nano .env
# set strong POSTGRES_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

Copy Firebase JSON (if using phone OTP):

```bash
# from your laptop:
scp backend/firebase-service-account.json ubuntu@13.203.201.155:~/EOF-Talent-App-Specs/backend/
```

If the JSON is missing, `docker compose` may fail the volume mount. Either:

- place the file at `backend/firebase-service-account.json`, or  
- temporarily remove that volume line from `docker-compose.yml` and keep `OTP_TEST_BYPASS=true`.

## 4. Build & run

```bash
cd ~/EOF-Talent-App-Specs
docker compose up -d --build
docker compose logs -f api
```

Migrations run automatically on container start.

## 5. Verify

```bash
curl http://127.0.0.1:3000/api/health
# or from laptop / phone browser:
# http://13.203.201.155:3000/docs
```

## 6. Mobile APK

In `mobile-app/.env` **before** building the APK:

```env
EXPO_PUBLIC_API_URL=http://13.203.201.155:3000/api
```

Then rebuild:

```bash
cd mobile-app
npm run android
```

`EXPO_PUBLIC_*` is baked at build time — change URL → rebuild APK.

## 7. Update after code changes

```bash
cd ~/EOF-Talent-App-Specs
git pull
docker compose up -d --build
```

## Useful commands

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f postgres
docker compose restart api
docker compose down          # stop (keeps DB volume)
docker compose down -v       # DANGER: deletes Postgres data
```

## Notes

- Public IP can change if the instance is stopped without an Elastic IP — attach an **Elastic IP** in AWS if you want a stable address.
- HTTP works for now (`usesCleartextTraffic` is enabled). Add Nginx + HTTPS later for production.
- Chat uses Socket.io on the same host/port (`http://13.203.201.155:3000/chat`).
