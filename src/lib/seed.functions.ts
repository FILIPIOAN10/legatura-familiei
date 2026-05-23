import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEMO = [
  { email: "demo.family@exitusro.ro", name: "Maria Popescu", role: "family", county: "București" },
  { email: "demo.doctor@exitusro.ro", name: "Dr. Andrei Marinescu", role: "doctor", county: "București" },
  { email: "demo.officer@exitusro.ro", name: "Elena Vasilescu", role: "civil_officer", county: "București" },
  { email: "demo.notary@exitusro.ro", name: "Notar Cristian Ene", role: "notary", county: "București" },
  { email: "demo.funeral@exitusro.ro", name: "Casa Funerară Pacea", role: "funeral_provider", county: "București" },
  { email: "admin@exitusro.ro", name: "Administrator", role: "admin", county: "București" },
] as const;

const PASSWORD = "Demo2026!";

export const seedDemo = createServerFn({ method: "POST" }).handler(async () => {
  const created: Record<string, string> = {};
  for (const u of DEMO) {
    // try create; ignore if exists
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.role },
    });
    let userId = data?.user?.id;
    if (error && !userId) {
      // find existing
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const found = list.users.find((x) => x.email === u.email);
      userId = found?.id;
    }
    if (!userId) continue;
    created[u.role] = userId;

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: u.name,
      county: u.county,
      city: u.county,
    });
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: u.role as any }, { onConflict: "user_id,role" });
  }

  // Demo case in CMCD_ISSUED state
  const familyId = created["family"];
  const doctorId = created["doctor"];
  if (familyId) {
    const { data: existing } = await supabaseAdmin
      .from("cases")
      .select("id")
      .eq("created_by", familyId)
      .limit(1)
      .maybeSingle();
    if (!existing) {
      const { data: c } = await supabaseAdmin
        .from("cases")
        .insert({
          created_by: familyId,
          deceased_full_name: "Constantinescu Adrian",
          deceased_cnp: "1450203412345",
          deceased_dob: "1945-02-03",
          deceased_dod: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
          death_location: "Domiciliu",
          death_cause_type: "natural",
          city: "București",
          county: "București",
          address: "Str. Primăverii nr. 14, sector 1",
          status: "CMCD_ISSUED",
          assigned_doctor: doctorId,
        })
        .select()
        .single();
      if (c) {
        await supabaseAdmin.from("documents").insert({
          case_id: c.id,
          type: "cmcd",
          title: "CMCD — Constantinescu Adrian",
          uploaded_by: doctorId,
          signed: true,
          signature_meta: { signed_by: doctorId, signed_at: new Date().toISOString(), method: "mock_electronic_signature" },
          metadata: { cause_main: "Insuficiență cardiacă cronică", icd10: "I50.9" },
        });
        const deadline = new Date(Date.now() + 30 * 3600 * 1000).toISOString();
        await supabaseAdmin.from("tasks").insert([
          { case_id: c.id, title: "Validare CMCD la Starea Civilă", role_responsible: "civil_officer", legal_deadline: deadline, legal_reference: "L. 119/1996 art. 35" },
          { case_id: c.id, title: "Programare înmormântare", role_responsible: "funeral_provider", legal_reference: "L. 102/2014" },
        ]);
        await supabaseAdmin.from("notifications").insert({
          user_id: familyId,
          case_id: c.id,
          type: "cmcd_issued",
          title: "CMCD emis",
          body: "Medicul a eliberat Certificatul Medical Constatator. Cazul a fost trimis la Starea Civilă.",
        });
      }
    }
  }

  return { ok: true, accounts: DEMO.map((d) => ({ email: d.email, role: d.role })), password: PASSWORD };
});
