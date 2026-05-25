// src/lib/uploadthing.ts
// Uploadthing file router
// Docs: https://docs.uploadthing.com/getting-started/appdir

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";

const f = createUploadthing();

async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return { id: session.user.id };
}

export const ourFileRouter = {

  profilePhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getAuthUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { ufsUrl: file.ufsUrl };
    }),

  memoryMedia: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    video: { maxFileSize: "256MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getAuthUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { ufsUrl: file.ufsUrl };
    }),

  videoMessage: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getAuthUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { ufsUrl: file.ufsUrl };
    }),

  paymentProof: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    pdf:   { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getAuthUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { ufsUrl: file.ufsUrl };
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
