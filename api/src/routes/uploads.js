const router = require('express').Router();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuid } = require('uuid');
const mime = require('mime-types');
const auth = require('../middleware/auth');

const s3 = new S3Client({ region: process.env.AWS_REGION });

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

router.post('/presign', auth, async (req, res) => {
  try {
    const { fileName, contentType, size } = req.body || {};
    if (!fileName || !contentType || typeof size !== 'number') {
      return res.status(400).json({ error: 'fileName, contentType, size required' });
    }
    if (!ALLOWED_MIME.has(contentType)) {
      return res.status(400).json({ error: 'unsupported content type' });
    }
    if (size > MAX_BYTES) {
      return res.status(413).json({ error: 'file too large' });
    }

    const ext = mime.extension(contentType) || 'bin';
    const key = `${process.env.S3_PUBLIC_PREFIX}/${req.user.id}/${uuid()}.${ext}`;

    const putCmd = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      Metadata: { uploader: req.user.id }
    });

    const presignedUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 * 5 });
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ uploadUrl: presignedUrl, publicUrl, key, expiresIn: 300 });
  } catch (err) {
    console.error('presign error', err);
    res.status(500).json({ error: 'failed to presign' });
  }
});

module.exports = router;
