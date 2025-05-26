import { z } from "zod";
import path from "path"; // Add this missing import

export const APPOINTMENT_URL = "https://www.keishicho-gto.metro.tokyo.lg.jp/keishicho-u/reserve/offerList_detail?tempSeq=363&accessFrom=offerList";
export const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");
export const CHECK_INTERVAL = 30000;

export const AppointmentSchema = z.object({
  location: z.enum(["府中試験場", "鮫洲試験場", "江東試験場"]),
  is29Country: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum([
    "29の国･地域以外の方で、住民票のある方",
    "29の国･地域以外の方で、住民票のない方",
    "29の国･地域の方"
  ])
});

export const AnalysisSchema = z.array(AppointmentSchema);