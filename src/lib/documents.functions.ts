import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DocTypes = z.enum([
  "id_card",
  "birth_certificate",
  "marriage_certificate",
  "other",
]);

export const registerUploadedDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        case_id: z.string().uuid(),
        type: DocTypes,
        title: z.string().min(2).max(200),
        storage_path: z.string().min(3).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify the user can see this case (RLS)
    const { data: c } = await supabase.from("cases").select("id").eq("id", data.case_id).single();
    if (!c) throw new Error("Nu aveți acces la acest dosar.");
    const { error } = await supabase.from("documents").insert({
      case_id: data.case_id,
      type: data.type,
      title: data.title,
      uploaded_by: userId,
      storage_path: data.storage_path,
      signed: false,
      metadata: { uploaded_via: "user" },
    });
    if (error) throw new Error(error.message);
    await supabase.from("audit_log").insert({
      case_id: data.case_id,
      actor_id: userId,
      action: "DOCUMENT_UPLOADED",
      payload: { type: data.type, title: data.title },
    });
    return { ok: true };
  });

export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ document_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, storage_path, title")
      .eq("id", data.document_id)
      .single();
    if (error || !doc) throw new Error("Document inexistent.");
    if (!doc.storage_path) {
      throw new Error("Document generat automat (nu există fișier încărcat).");
    }
    const { data: signed, error: sErr } = await supabase.storage
      .from("case-documents")
      .createSignedUrl(doc.storage_path, 300);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl, title: doc.title };
  });
