# Decision Log

## 2025-09-26

- Stack: Node.js + Express + MongoDB (Atlas later). Rationale: high concurrency, simple DX.
- Repo layout: single repo `market` with `api/` backend; add `web/` later.
- Deployment target: AWS Elastic Beanstalk (first), GitHub Actions pipeline later.
- Chose CommonJS (require/exports) for Node backend in api/ to match current code and simplify setup.
