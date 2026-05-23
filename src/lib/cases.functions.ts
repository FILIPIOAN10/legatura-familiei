import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CreateCaseSchema = z.object({
  deceased_full_name: z.string().min(2).max(120),
  deceased_cnp: z.string().regex(/^\d{13}$/).optional().or(z.literal("")),
  deceased_dob: z.string().optional().or(z.literal("")),
  deceased_dod: z.string(),
  death_location: z.string().max(200).optional().or(z.literal("")),
  death_cause_type: z.enum(["natural", "violent", "suspect", "unknown"]),
  city: z.string().max(80).optional().or(z.literal("")),
  county: z.string().max(80).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
});

export const createCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CreateCaseSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const status = data.death_cause_type === "violent" ? "AWAITING_DOCTOR" : "AWAITING_DOCTOR";
    const { data: created, error } = await supabase
      .from("cases")
      .insert({
        created_by: userId,
        deceased_full_name: data.deceased_full_name,
        deceased_cnp: data.deceased_cnp || null,
        deceased_dob: data.deceased_dob || null,
        deceased_dod: data.deceased_dod,
        death_location: data.death_location || null,
        death_cause_type: data.death_cause_type,
        city: data.city || null,
        county: data.county || null,
        address: data.address || null,
        status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Seed default tasks
    const now = new Date();
    const t72 = new Date(now.getTime() + 72 * 3600 * 1000).toISOString();
    await supabase.from("tasks").insert([
      { case_id: created.id, title: "Declarația de deces la Starea Civilă", role_responsible: "family", legal_deadline: t72, legal_reference: "L. 119/1996 art. 35" },
      { case_id: created.id, title: "Eliberare CMCD de către medic", role_responsible: "doctor", legal_reference: "Ordin MS 1147/2020" },
    ]);
    await supabase.from("audit_log").insert({ case_id: created.id, actor_id: userId, action: "CASE_CREATED", payload: { status } });
    return { case: created };
  });

export const listMyCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { cases: data ?? [] };
  });

export const getCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: c, error } = await supabase.from("cases").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const [{ data: docs }, { data: tasks }, { data: audit }] = await Promise.all([
      supabase.from("documents").select("*").eq("case_id", data.id).order("issued_at", { ascending: false }),
      supabase.from("tasks").select("*").eq("case_id", data.id).order("created_at"),
      supabase.from("audit_log").select("*").eq("case_id", data.id).order("created_at", { ascending: false }).limit(20),
    ]);
    return { case: c, documents: docs ?? [], tasks: tasks ?? [], audit: audit ?? [] };
  });

export const issueCmcd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        case_id: z.string().uuid(),
        cause_main: z.string().min(2).max(200),
        cause_secondary: z.string().max(200).optional().or(z.literal("")),
        icd10: z.string().max(20).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: c } = await supabase.from("cases").select("*").eq("id", data.case_id).single();
    if (!c) throw new Error("Caz inexistent");
    if (c.death_cause_type === "violent") throw new Error("Cazurile violente se redirectionează către IML.");

    const signatureMeta = {
      signed_by: userId,
      signed_at: new Date().toISOString(),
      method: "mock_electronic_signature",
    };

    await supabase.from("documents").insert({
      case_id: data.case_id,
      type: "cmcd",
      title: "CMCD — " + c.deceased_full_name,
      uploaded_by: userId,
      signed: true,
      signature_meta: signatureMeta,
      metadata: {
        cause_main: data.cause_main,
        cause_secondary: data.cause_secondary || null,
        icd10: data.icd10 || null,
        deceased: c.deceased_full_name,
        dod: c.deceased_dod,
      },
    });

    await supabase.from("cases").update({ status: "CMCD_ISSUED", assigned_doctor: userId }).eq("id", data.case_id);
    await supabase.from("audit_log").insert({ case_id: data.case_id, actor_id: userId, action: "CMCD_ISSUED" });
    await supabase.from("notifications").insert({
      user_id: c.created_by,
      case_id: data.case_id,
      type: "cmcd_issued",
      title: "CMCD emis",
      body: "Medicul a eliberat Certificatul Medical Constatator. Cazul a fost trimis la Starea Civilă.",
    });
    return { ok: true };
  });

export const validateAndIssueDeathCert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ case_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: c } = await supabase.from("cases").select("*").eq("id", data.case_id).single();
    if (!c) throw new Error("Caz inexistent");
    if (c.status !== "CMCD_ISSUED" && c.status !== "AWAITING_CIVIL_OFFICER") {
      throw new Error("Cazul nu este în starea corectă pentru emitere.");
    }
    const certNumber = "CD-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
    await supabase.from("documents").insert([
      {
        case_id: data.case_id,
        type: "death_certificate",
        title: "Certificat de deces nr. " + certNumber,
        uploaded_by: userId,
        signed: true,
        signature_meta: { signed_by: userId, signed_at: new Date().toISOString(), method: "mock_civil_officer_seal" },
        metadata: { certificate_number: certNumber, deceased: c.deceased_full_name },
      },
      {
        case_id: data.case_id,
        type: "burial_permit",
        title: "Adeverință de înhumare/incinerare",
        uploaded_by: userId,
        signed: true,
        signature_meta: { signed_by: userId, signed_at: new Date().toISOString() },
        metadata: { related_certificate: certNumber },
      },
    ]);
    await supabase.from("cases").update({ status: "DEATH_CERT_ISSUED", assigned_civil_officer: userId }).eq("id", data.case_id);
    await supabase.from("audit_log").insert({ case_id: data.case_id, actor_id: userId, action: "DEATH_CERT_ISSUED", payload: { certificate_number: certNumber } });
    await supabase.from("notifications").insert({
      user_id: c.created_by,
      case_id: data.case_id,
      type: "death_cert_issued",
      title: "Certificat de deces emis",
      body: "Certificatul de deces și adeverința de înhumare au fost eliberate.",
    });
    return { ok: true, certificate_number: certNumber };
  });

export const requestCorrections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ case_id: z.string().uuid(), reason: z.string().min(3).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: c } = await supabase.from("cases").select("created_by, assigned_doctor").eq("id", data.case_id).single();
    if (!c) throw new Error("Caz inexistent");
    await supabase.from("cases").update({ status: "AWAITING_DOCTOR" }).eq("id", data.case_id);
    await supabase.from("audit_log").insert({ case_id: data.case_id, actor_id: userId, action: "CORRECTIONS_REQUESTED", payload: { reason: data.reason } });
    const targets = [c.created_by, c.assigned_doctor].filter(Boolean) as string[];
    for (const uid of targets) {
      await supabase.from("notifications").insert({
        user_id: uid,
        case_id: data.case_id,
        type: "corrections_requested",
        title: "Solicitare corecții",
        body: "Funcționarul a solicitat corecții: " + data.reason,
      });
    }
    return { ok: true };
  });
