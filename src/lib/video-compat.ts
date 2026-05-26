"use client";

// ── Shared MP4 box parser ───────────────────────────────────────────────────

const BROWSER_SUPPORTED = new Set(["avc1", "avc3", "hvc1", "hev1", "vp08", "vp09", "av01"]);

function readU32(dv: DataView, offset: number) { return dv.getUint32(offset); }
function readFourCC(buf: ArrayBuffer, offset: number) {
  return String.fromCharCode(...new Uint8Array(buf, offset, 4));
}
function findBox(buf: ArrayBuffer, start: number, end: number, type: string): number {
  const dv = new DataView(buf);
  let pos = start;
  while (pos + 8 <= end) {
    const size = readU32(dv, pos);
    if (size < 8 || pos + size > end) break;
    if (readFourCC(buf, pos + 4) === type) return pos;
    pos += size;
  }
  return -1;
}

function extractCodecFromBuffer(buf: ArrayBuffer): string | null {
  const len = buf.byteLength;
  const dv  = new DataView(buf);

  const moovPos = findBox(buf, 0, len, "moov");
  if (moovPos === -1) return null;
  const moovEnd = moovPos + readU32(dv, moovPos);

  let trakPos = findBox(buf, moovPos + 8, moovEnd, "trak");
  while (trakPos !== -1) {
    const trakEnd = trakPos + readU32(dv, trakPos);
    const mdiaPos = findBox(buf, trakPos + 8, trakEnd, "mdia");
    if (mdiaPos !== -1) {
      const mdiaEnd = mdiaPos + readU32(dv, mdiaPos);
      const hdlrPos = findBox(buf, mdiaPos + 8, mdiaEnd, "hdlr");
      // handler_type is at hdlr+8 (box header) +4 (version/flags) +4 (pre_defined) = +16
      if (hdlrPos !== -1 && readFourCC(buf, hdlrPos + 16) === "vide") {
        const minfPos = findBox(buf, mdiaPos + 8, mdiaEnd, "minf");
        if (minfPos !== -1) {
          const minfEnd = minfPos + readU32(dv, minfPos);
          const stblPos = findBox(buf, minfPos + 8, minfEnd, "stbl");
          if (stblPos !== -1) {
            const stblEnd = stblPos + readU32(dv, stblPos);
            const stsdPos = findBox(buf, stblPos + 8, stblEnd, "stsd");
            if (stsdPos !== -1) {
              // stsd: [8 header] + [4 ver/flags] + [4 entry_count] + first entry: [4 size][4 codec]
              const entryStart = stsdPos + 8 + 4 + 4;
              if (entryStart + 8 <= len) return readFourCC(buf, entryStart + 4);
            }
          }
        }
      }
    }
    trakPos = findBox(buf, trakEnd, moovEnd, "trak");
  }
  return null;
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Parse the video codec fourcc from a local File object. */
export async function detectMp4VideoCodec(file: File): Promise<string | null> {
  try {
    return extractCodecFromBuffer(await file.arrayBuffer());
  } catch { return null; }
}

/**
 * Detect video codec from a CDN URL using Range requests.
 * Tries the first 4KB (moov-at-start) then the last 200KB (moov-at-end).
 */
export async function detectVideoCodecFromUrl(url: string): Promise<string | null> {
  try {
    const head = await fetch(url, { headers: { Range: "bytes=0-4095" } });
    if (!head.ok && head.status !== 206) return null;
    const headBuf = await head.arrayBuffer();

    const codec = extractCodecFromBuffer(headBuf);
    if (codec) return codec;

    // moov is at end — determine file size from Content-Range
    const cr = head.headers.get("Content-Range");
    const cl = head.headers.get("Content-Length");
    const total = cr ? parseInt(cr.split("/")[1]) : cl ? parseInt(cl) : 0;
    if (!total) return null;

    const tailStart = Math.max(0, total - 204800);
    const tail = await fetch(url, { headers: { Range: `bytes=${tailStart}-${total - 1}` } });
    if (!tail.ok && tail.status !== 206) return null;
    return extractCodecFromBuffer(await tail.arrayBuffer());
  } catch { return null; }
}

/** Returns true if the codec needs transcoding for browser playback. */
export function codecNeedsTranscode(codec: string | null): boolean {
  if (!codec) return false;
  return !BROWSER_SUPPORTED.has(codec);
}

// ── FFmpeg.wasm transcoder ──────────────────────────────────────────────────
// Loaded lazily from CDN — only downloaded when a transcoding is actually needed.
// Uses @ffmpeg/core (single-threaded) — no COOP/COEP headers required.

type FFmpegInstance = import("@ffmpeg/ffmpeg").FFmpeg;
let ffSingleton: FFmpegInstance | null = null;
let ffLoadPromise: Promise<FFmpegInstance> | null = null;

async function getFFmpeg(): Promise<FFmpegInstance> {
  if (ffSingleton?.loaded) return ffSingleton;
  if (ffLoadPromise) return ffLoadPromise;

  ffLoadPromise = (async () => {
    const { FFmpeg }     = await import("@ffmpeg/ffmpeg");
    const { toBlobURL }  = await import("@ffmpeg/util");
    const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ff = new FFmpeg();
    await ff.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`,   "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffSingleton = ff;
    return ff;
  })();

  return ffLoadPromise;
}

/**
 * Transcode a video file to H.264/AAC MP4 in the browser.
 * Uses ultrafast preset — trades file size for transcoding speed.
 */
export async function transcodeToH264(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<File> {
  const { fetchFile } = await import("@ffmpeg/util");
  const ff = await getFFmpeg();

  const ext    = file.name.match(/\.[^.]+$/)?.[0] ?? ".mp4";
  const inName = `in${ext}`;
  const outName = "out.mp4";

  const handler = onProgress
    ? ({ progress }: { progress: number }) =>
        onProgress(Math.min(1, Math.max(0, progress)))
    : null;

  if (handler) ff.on("progress", handler);

  await ff.writeFile(inName, await fetchFile(file));
  await ff.exec([
    "-i", inName,
    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23",
    "-c:a", "aac",
    "-movflags", "faststart",
    outName,
  ]);

  const raw  = await ff.readFile(outName) as Uint8Array;
  // Ensure a plain ArrayBuffer (readFile may return Uint8Array backed by SharedArrayBuffer)
  const data = new Uint8Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  if (handler) ff.off("progress", handler);
  try { await ff.deleteFile(inName); }  catch {}
  try { await ff.deleteFile(outName); } catch {}

  const outName2 = file.name.replace(/\.[^.]+$/, ".mp4");
  return new File([data.buffer as ArrayBuffer], outName2, { type: "video/mp4" });
}
