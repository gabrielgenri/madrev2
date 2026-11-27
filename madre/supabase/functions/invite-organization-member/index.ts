import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

async function findUserIdByEmail(adminClient: SupabaseClient, email: string) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 1000) return null;
  }
  throw new Error("No se pudo localizar la cuenta existente.");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Sesión requerida." }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
    const publishableKey = publishableKeys.default ?? Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !publishableKey || !serviceRoleKey) {
      return json({ error: "Falta configuración interna de Supabase para enviar invitaciones." }, 500);
    }

    const token = authHeader.slice(7);
    const userClient = createClient(url, publishableKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "La sesión no es válida o expiró." }, 401);

    const body = await req.json().catch(() => null);
    const organizationId = typeof body?.organization_id === "string" ? body.organization_id : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = typeof body?.role === "string" ? body.role : "";
    const fullName = typeof body?.full_name === "string" ? body.full_name.trim().slice(0, 120) : "";
    if (!/^[0-9a-f-]{36}$/i.test(organizationId)
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || !["client_admin", "employee"].includes(role)) {
      return json({ error: "Organización, correo o rol no válido." }, 400);
    }

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const [{ data: platformRole, error: roleError }, { data: organization, error: organizationError }] = await Promise.all([
      adminClient.from("user_roles").select("user_id").eq("user_id", authData.user.id).eq("role", "admin").maybeSingle(),
      adminClient.from("organizations").select("id,status").eq("id", organizationId).maybeSingle()
    ]);
    if (roleError || organizationError) throw roleError ?? organizationError;
    if (!organization || organization.status !== "active") {
      return json({ error: "La organización no existe o está suspendida." }, 404);
    }

    const isPlatformAdmin = Boolean(platformRole);
    if (role === "client_admin" && !isPlatformAdmin) {
      return json({ error: "Solo un administrador de MADRE puede invitar al administrador de un cliente." }, 403);
    }

    if (role === "employee" && !isPlatformAdmin) {
      const { data: membership, error: membershipError } = await adminClient
        .from("organization_memberships")
        .select("user_id")
        .eq("organization_id", organizationId)
        .eq("user_id", authData.user.id)
        .eq("role", "client_admin")
        .eq("status", "active")
        .maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) return json({ error: "Solo el administrador de este cliente puede invitar empleados." }, 403);
    }

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: fullName ? { full_name: fullName } : {}
    });
    if (inviteError) {
      const alreadyRegistered = /already|registered|exists/i.test(inviteError.message);
      if (!alreadyRegistered) {
        return json({
          error: "No se pudo enviar la invitación. Revisá la configuración de correo de Supabase e intentá de nuevo.",
          code: "invite_failed"
        }, 502);
      }

      const existingUserId = await findUserIdByEmail(adminClient, email);
      if (!existingUserId) return json({ error: "No se pudo localizar la cuenta de ese correo." }, 404);
      const deliveryClient = createClient(url, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      const { error: signInEmailError } = await deliveryClient.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      });
      if (signInEmailError) return json({ error: "La cuenta existe, pero no se pudo enviar el enlace de acceso." }, 502);
      return json({ user_id: existingUserId, email, role, organization_id: organizationId, existing_user: true });
    }

    if (!inviteData.user) return json({ error: "Supabase no devolvió la cuenta invitada." }, 502);
    return json({ user_id: inviteData.user.id, email: inviteData.user.email, role, organization_id: organizationId, existing_user: false });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "No se pudo procesar la invitación." }, 500);
  }
});
