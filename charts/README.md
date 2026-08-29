Upstream Karakeep's helm charts live in a separate repo
(https://github.com/karakeep-app/helm-charts) and aren't vendored here. For
this personal fork, use `docker/docker-compose.yml` for self-hosting, or the
plain manifests in `../kubernetes/` if you want to run it on Kubernetes
(you'll need to build and push your own images first — see the notes in
those manifests).
