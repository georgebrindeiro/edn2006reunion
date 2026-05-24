// src/lib/uploadthing.ts
// Uploadthing file router
// Docs: https://docs.uploadthing.com/getting-started/appdir

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";

const f = createUploadthing();

// Auth helper — reused across routes
async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  return session.user;
}

export const ourFileRouter = {

  // ── Profile photo (then or now) ───────────────────────────────────────────
  profilePhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getAuthUser();
      return { userEmail: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile photo uploaded by:", metadata.userEmail, "→", file.url);
      return { url: file.url };
    }),

  // ── Memory photo/video ────────────────────────────────────────────────────
  memoryMedia: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    video: { maxFileSize: "256MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getAuthUser();
      return { userEmail: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Memory media uploaded by:", metadata.userEmail, "→", file.url);
      return { url: file.url };
    }),

  // ── Video message (up to 2 min ≈ ~200 MB) ────────────────────────────────
  videoMessage: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getAuthUser();
      return { userEmail: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Video message uploaded by:", metadata.userEmail, "→", file.url);
      return { url: file.url };
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
