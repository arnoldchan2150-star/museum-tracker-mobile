import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePrepareUpload } from "./storage";

const backupPayload = z.object({
  version: z.number().int().min(1),
  updatedAt: z.string(),
  museums: z.array(z.unknown()),
  profile: z.record(z.string(), z.unknown()),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  cloudSync: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const backup = await db.getCloudBackup(ctx.user.id);
      if (!backup) return null;
      return { payload: backup.payload, version: backup.version, updatedAt: backup.updatedAt.toISOString() };
    }),
    save: protectedProcedure.input(backupPayload).mutation(async ({ ctx, input }) => {
      const saved = await db.saveCloudBackup(ctx.user.id, JSON.stringify(input), input.version);
      return { version: saved.version, updatedAt: saved.updatedAt.toISOString() };
    }),
    prepareUpload: protectedProcedure.input(z.object({ fileName: z.string().min(1).max(180), contentType: z.string().min(1).max(120) })).mutation(async ({ ctx, input }) => {
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150) || "media.bin";
      return storagePrepareUpload(`users/${ctx.user.id}/museum-media/${safeName}`);
    }),
  }),
});

export type AppRouter = typeof appRouter;
