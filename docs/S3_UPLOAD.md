# S3 Upload Flow (MARKET Project)

This doc explains how we wired up **browser → API → S3** uploads in the MARKET app.

---

## 1. Local Setup

**Dependencies:**

```bash
npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm i -D dotenv ts-node typescript
```
