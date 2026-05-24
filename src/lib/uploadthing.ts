// src/lib/uploadthing.ts
// Uploadthing file router
// Docs: https://docs.uploadthing.com/getting-started/appdir

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const f = createUploadthing();

async function getAuthUser(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.email) throw new Error("Unauthorized");
  return { email: token.email as string };
}

export const ourFileRouter = {

  profilePhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await getAuthUser(req);
      return { userEmail: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),

  memoryMedia: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    video: { maxFileSize: "256MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await getAuthUser(req);
      return { userEmail: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),

  videoMessage: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await getAuthUser(req);
      return { userEmail: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
