// LibreOffice headless conversion microservice.
// POST /convert  multipart/form-data { file: <PDF> } → application/vnd.openxmlformats-officedocument.presentationml.presentation
//
// Optional auth: set SHARED_SECRET in env; clients must send "Authorization: Bearer <secret>".

import express from 'express';
import multer from 'multer';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const execFileP = promisify(execFile);
const PORT = parseInt(process.env.PORT || '8080', 10);
const SHARED_SECRET = process.env.SHARED_SECRET || '';
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB upload cap

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
});

const app = express();

// Permissive CORS — restrict via SHARED_SECRET, not origin.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/healthz', (_req, res) => res.json({ ok: true, service: 'libreoffice-converter' }));

app.post('/convert', upload.single('file'), async (req, res) => {
  // Auth check (only if SHARED_SECRET is configured)
  if (SHARED_SECRET) {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (token !== SHARED_SECRET) {
      return res.status(401).json({ error: 'unauthorized' });
    }
  }

  if (!req.file) return res.status(400).json({ error: 'missing file (field name: "file")' });
  if (!/\.pdf$/i.test(req.file.originalname || '') && req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ error: 'file must be a PDF' });
  }

  const id = crypto.randomBytes(8).toString('hex');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `lo-${id}-`));
  const inputPath = path.join(tmpDir, 'input.pdf');
  const outputPath = path.join(tmpDir, 'input.pptx');

  try {
    await fs.writeFile(inputPath, req.file.buffer);

    // Convert using LibreOffice headless — vector PDF parsing → real PPTX objects.
    await execFileP('libreoffice', [
      '--headless',
      '--norestore',
      '--nologo',
      '--nofirststartwizard',
      '--convert-to', 'pptx',
      '--outdir', tmpDir,
      inputPath,
    ], { timeout: 90_000 });

    const buf = await fs.readFile(outputPath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pptx"');
    res.setHeader('Content-Length', String(buf.length));
    res.end(buf);
  } catch (err) {
    console.error(`[convert ${id}]`, err?.stderr?.toString?.() || err?.message || err);
    res.status(500).json({
      error: 'conversion failed',
      details: (err?.stderr?.toString?.() || err?.message || String(err)).slice(0, 500),
    });
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

app.use((err, _req, res, _next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `file too large (max ${MAX_BYTES} bytes)` });
  }
  console.error('unhandled', err);
  res.status(500).json({ error: 'internal error' });
});

app.listen(PORT, () => {
  console.log(`libreoffice-converter listening on :${PORT}`);
});
