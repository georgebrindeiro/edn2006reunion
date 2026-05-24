// src/lib/uploadthing-client.ts
// Client-side upload hooks — import from here, not from uploadthing directly

import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "./uploadthing";

export const UploadButton   = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
