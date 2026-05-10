import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NP_URL = "https://api.novaposhta.ua/v2.0/json/";

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function npCall(apiKey: string, modelName: string, calledMethod: string, methodProperties: Record<string, unknown>) {
  const res = await fetch(NP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
  });
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("NOVA_POSHTA_API_KEY");
    if (!apiKey) return json(500, { error: "Nova Poshta API key not configured" });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    // Public actions (no auth needed): used during checkout
    if (action === "searchCities") {
      const query = String(body.query ?? "").trim();
      if (query.length < 2) return json(200, { data: [] });
      const r = await npCall(apiKey, "Address", "searchSettlements", { CityName: query, Limit: "20" });
      const addresses = r?.data?.[0]?.Addresses ?? [];
      const cities = addresses.map((a: any) => ({
        ref: a.Ref || a.DeliveryCity, name: a.MainDescription || a.Present,
        area: a.Area, region: a.Region, present: a.Present,
      })).filter((c: any) => c.ref);
      return json(200, { data: cities });
    }

    if (action === "searchWarehouses") {
      const cityRef = String(body.cityRef ?? "").trim();
      const query = String(body.query ?? "").trim();
      const warehouseType = body.warehouseType as string | undefined;
      if (!cityRef) return json(200, { data: [] });
      const props: Record<string, unknown> = { SettlementRef: cityRef, Language: "UA", Limit: "500" };
      if (query) props.FindByString = query;
      if (warehouseType === "postomat") props.TypeOfWarehouseRef = "f9316480-5f2d-425d-bc2c-ac7cd29decf0";
      const r = await npCall(apiKey, "AddressGeneral", "getWarehouses", props);
      let warehouses = (r?.data ?? []).map((w: any) => ({
        ref: w.Ref, number: w.Number, description: w.Description, shortAddress: w.ShortAddress,
        typeRef: w.TypeOfWarehouse,
        isPostomat: w.CategoryOfWarehouse === "Postomat" || w.TypeOfWarehouse === "f9316480-5f2d-425d-bc2c-ac7cd29decf0",
      }));
      if (warehouseType === "branch") warehouses = warehouses.filter((w: any) => !w.isPostomat);
      else if (warehouseType === "postomat") warehouses = warehouses.filter((w: any) => w.isPostomat);
      return json(200, { data: warehouses });
    }

    // Protected actions: must be event manager
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json(401, { error: "Unauthorized" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) return json(401, { error: "Unauthorized" });

    const eventId = String(body.event_id ?? "");
    if (!eventId) return json(400, { error: "event_id required" });

    const { data: canManage } = await supabase.rpc("can_manage_event", {
      _event_id: eventId,
      _user_id: user.id,
    });
    if (!canManage) return json(403, { error: "Not authorized for this event" });

    if (action === "getCounterparties") {
      // Sender counterparties
      const r = await npCall(apiKey, "Counterparty", "getCounterparties", {
        CounterpartyProperty: "Sender",
        Page: "1",
      });
      if (!r?.success) return json(400, { error: r?.errors?.join(", ") || "NP error", raw: r });
      return json(200, { data: r.data ?? [] });
    }

    if (action === "getCounterpartyContactPersons") {
      const ref = String(body.counterpartyRef ?? "");
      if (!ref) return json(400, { error: "counterpartyRef required" });
      const r = await npCall(apiKey, "Counterparty", "getCounterpartyContactPersons", {
        Ref: ref, Page: "1",
      });
      if (!r?.success) return json(400, { error: r?.errors?.join(", ") || "NP error", raw: r });
      return json(200, { data: r.data ?? [] });
    }

    if (action === "getSenderAddresses") {
      // List sender's own warehouses (city of sender)
      const cityRef = String(body.cityRef ?? "");
      if (!cityRef) return json(400, { error: "cityRef required" });
      const r = await npCall(apiKey, "AddressGeneral", "getWarehouses", {
        SettlementRef: cityRef, Language: "UA", Limit: "500",
      });
      const warehouses = (r?.data ?? []).map((w: any) => ({
        ref: w.Ref, number: w.Number, description: w.Description, shortAddress: w.ShortAddress,
      }));
      return json(200, { data: warehouses });
    }

    if (action === "createTtn") {
      const registrationId = String(body.registration_id ?? "");
      if (!registrationId) return json(400, { error: "registration_id required" });

      const { data: settings } = await supabase
        .from("event_np_sender_settings")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle();
      if (!settings) return json(400, { error: "Sender settings not configured" });

      const { data: reg } = await supabase
        .from("registrations")
        .select("id, event_id, np_ttn_number, delivery_enabled, delivery_recipient_name, delivery_phone, delivery_city_ref, delivery_city_name, delivery_warehouse_ref, delivery_warehouse_name, delivery_warehouse_type")
        .eq("id", registrationId)
        .maybeSingle();
      if (!reg) return json(404, { error: "Registration not found" });
      if (reg.event_id !== eventId) return json(400, { error: "event mismatch" });
      if (!reg.delivery_enabled) return json(400, { error: "Delivery not requested" });
      if (reg.np_ttn_number) return json(400, { error: "TTN already exists", ttn: reg.np_ttn_number });
      if (!reg.delivery_city_ref || !reg.delivery_warehouse_ref) {
        return json(400, { error: "Recipient delivery address not provided" });
      }

      // Recipient name parsing
      const fullName = (reg.delivery_recipient_name ?? "").trim();
      const parts = fullName.split(/\s+/);
      const lastName = parts[0] ?? "";
      const firstName = parts[1] ?? lastName;
      const middleName = parts.slice(2).join(" ");

      // Phone normalization (380XXXXXXXXX)
      let phone = (reg.delivery_phone ?? "").replace(/\D/g, "");
      if (phone.startsWith("0")) phone = "38" + phone;
      if (!phone.startsWith("380")) phone = "380" + phone.replace(/^380?/, "");

      const serviceType = reg.delivery_warehouse_type === "postomat" ? "WarehousePostomat" : "WarehouseWarehouse";

      // NP rule: when payer is Recipient, payment for delivery must be Cash (paid on pickup).
      const payerType = settings.payer_type;
      const paymentMethod = payerType === "Recipient" ? "Cash" : settings.payment_method;

      // Create private recipient counterparty + contact, then use warehouse Ref directly.
      const cpRes = await npCall(apiKey, "Counterparty", "save", {
        FirstName: firstName,
        MiddleName: middleName,
        LastName: lastName,
        Phone: phone,
        Email: "",
        CounterpartyType: "PrivatePerson",
        CounterpartyProperty: "Recipient",
      });
      if (!cpRes?.success || !cpRes?.data?.[0]?.Ref) {
        const msg = [
          ...(cpRes?.errors ?? []),
          ...(cpRes?.warnings ? Object.values(cpRes.warnings) : []),
        ].filter(Boolean).join("; ") || "Failed to create recipient counterparty";
        return json(200, { error: msg, raw: cpRes });
      }
      const recipientRef: string = cpRes.data[0].Ref;
      const contactRecipientRef: string = cpRes.data[0]?.ContactPerson?.data?.[0]?.Ref ?? "";

      const npProps: Record<string, unknown> = {
        PayerType: payerType,
        PaymentMethod: paymentMethod,
        DateTime: new Date().toLocaleDateString("uk-UA"),
        CargoType: settings.cargo_type,
        Weight: String(settings.weight),
        ServiceType: serviceType,
        SeatsAmount: String(settings.seats_amount),
        Description: settings.cargo_description,
        Cost: String(settings.cost),
        // Sender
        CitySender: settings.sender_city_ref,
        Sender: settings.sender_ref,
        SenderAddress: settings.sender_address_ref,
        ContactSender: settings.sender_contact_ref,
        SendersPhone: settings.sender_phone,
        // Recipient (existing private counterparty + warehouse/postomat ref)
        CityRecipient: reg.delivery_city_ref,
        Recipient: recipientRef,
        RecipientAddress: reg.delivery_warehouse_ref,
        ContactRecipient: contactRecipientRef,
        RecipientsPhone: phone,
        OptionsSeat: Array.from({ length: Number(settings.seats_amount) || 1 }, () => {
          const w = Number(settings.volume_width) || 10;
          const l = Number(settings.volume_length) || 10;
          const h = Number(settings.volume_height) || 10;
          return {
            volumetricVolume: String(((w * l * h) / 4000).toFixed(4)),
            volumetricWidth: String(w),
            volumetricLength: String(l),
            volumetricHeight: String(h),
            weight: String(settings.weight),
          };
        }),
      };


      console.log("NP createTtn props:", JSON.stringify(npProps));
      const r = await npCall(apiKey, "InternetDocument", "save", npProps);
      console.log("NP createTtn response:", JSON.stringify(r));
      if (!r?.success || !r?.data?.[0]?.IntDocNumber) {
        const msg = [
          ...(r?.errors ?? []),
          ...(r?.warnings ? Object.values(r.warnings) : []),
          ...(r?.info ? Object.values(r.info) : []),
        ].filter(Boolean).join("; ") || "NP error";
        return json(200, { error: msg, raw: r });
      }
      const created = r.data[0];
      const ttn: string = created.IntDocNumber;
      const ref: string = created.Ref;
      const ttnCost = Number(created.CostOnSite ?? 0);
      const estDate = created.EstimatedDeliveryDate ? String(created.EstimatedDeliveryDate).split(" ")[0] : null;

      // Save to registration (use service role to avoid policy nuances)
      const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { error: updErr } = await serviceClient
        .from("registrations")
        .update({
          np_ttn_number: ttn,
          np_ttn_ref: ref,
          np_ttn_cost: ttnCost,
          np_ttn_estimated_delivery_date: estDate,
          np_ttn_created_at: new Date().toISOString(),
          np_ttn_created_by: user.id,
        })
        .eq("id", registrationId);
      if (updErr) return json(500, { error: "Failed to save TTN: " + updErr.message, ttn });

      return json(200, { ttn, ref, cost: ttnCost, estimated_delivery_date: estDate });
    }

    if (action === "deleteTtn") {
      const registrationId = String(body.registration_id ?? "");
      if (!registrationId) return json(400, { error: "registration_id required" });

      const { data: reg } = await supabase
        .from("registrations")
        .select("id, event_id, np_ttn_ref")
        .eq("id", registrationId)
        .maybeSingle();
      if (!reg || reg.event_id !== eventId) return json(404, { error: "Not found" });
      if (!reg.np_ttn_ref) return json(400, { error: "No TTN to delete" });

      const r = await npCall(apiKey, "InternetDocument", "delete", { DocumentRefs: reg.np_ttn_ref });
      if (!r?.success) return json(400, { error: r?.errors?.join("; ") || "NP delete failed" });

      const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await serviceClient.from("registrations").update({
        np_ttn_number: null, np_ttn_ref: null, np_ttn_cost: null,
        np_ttn_estimated_delivery_date: null, np_ttn_created_at: null, np_ttn_created_by: null,
      }).eq("id", registrationId);

      return json(200, { ok: true });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    return json(500, { error: String(e) });
  }
});
