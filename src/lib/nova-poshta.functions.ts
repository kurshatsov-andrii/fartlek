import { createServerFn } from "@tanstack/react-start";
import { adminClient, getAuthedUser } from "@/lib/server-supabase";

const NP_URL = "https://api.novaposhta.ua/v2.0/json/";

async function npCall(apiKey: string, modelName: string, calledMethod: string, methodProperties: Record<string, unknown>) {
  const res = await fetch(NP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
  });
  return await res.json();
}

type Input = {
  action: string;
  query?: string;
  cityRef?: string;
  warehouseType?: string;
  event_id?: string;
  counterpartyRef?: string;
  registration_id?: string;
};

type Result = Record<string, unknown>;

export const novaPoshta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => (input ?? {}) as Input)
  .handler(async ({ data: body }): Promise<Result> => {
    try {
      const apiKey = process.env['NOVA_POSHTA_API_KEY'];
      if (!apiKey) return { error: "Nova Poshta API key not configured" };

      const action = String(body.action ?? "");

      // Public actions (no auth needed): used during checkout
      if (action === "searchCities") {
        const query = String(body.query ?? "").trim();
        if (query.length < 2) return { data: [] };
        const r = await npCall(apiKey, "Address", "searchSettlements", { CityName: query, Limit: "20" });
        const addresses = r?.data?.[0]?.Addresses ?? [];
        const cities = addresses
          .map((a: any) => ({
            ref: a.Ref || a.DeliveryCity, name: a.MainDescription || a.Present,
            area: a.Area, region: a.Region, present: a.Present,
          }))
          .filter((c: any) => c.ref);
        return { data: cities };
      }

      if (action === "searchWarehouses") {
        const cityRef = String(body.cityRef ?? "").trim();
        const query = String(body.query ?? "").trim();
        const warehouseType = body.warehouseType;
        if (!cityRef) return { data: [] };
        const props: Record<string, unknown> = { SettlementRef: cityRef, Language: "UA", Limit: "500" };
        if (query) props['FindByString'] = query;
        if (warehouseType === "postomat") props['TypeOfWarehouseRef'] = "f9316480-5f2d-425d-bc2c-ac7cd29decf0";
        const r = await npCall(apiKey, "AddressGeneral", "getWarehouses", props);
        let warehouses = (r?.data ?? []).map((w: any) => ({
          ref: w.Ref, number: w.Number, description: w.Description, shortAddress: w.ShortAddress,
          typeRef: w.TypeOfWarehouse,
          isPostomat: w.CategoryOfWarehouse === "Postomat" || w.TypeOfWarehouse === "f9316480-5f2d-425d-bc2c-ac7cd29decf0",
        }));
        if (warehouseType === "branch") warehouses = warehouses.filter((w: any) => !w.isPostomat);
        else if (warehouseType === "postomat") warehouses = warehouses.filter((w: any) => w.isPostomat);
        return { data: warehouses };
      }

      // Protected actions: must be event manager
      const authed = await getAuthedUser();
      if (!authed) return { error: "Unauthorized" };
      const { user, client: supabase } = authed;

      const eventId = String(body.event_id ?? "");
      if (!eventId) return { error: "event_id required" };

      const { data: canManage } = await supabase.rpc("can_manage_event", {
        _event_id: eventId,
        _user_id: user.id,
      });
      if (!canManage) return { error: "Not authorized for this event" };

      if (action === "getCounterparties") {
        const r = await npCall(apiKey, "Counterparty", "getCounterparties", {
          CounterpartyProperty: "Sender",
          Page: "1",
        });
        if (!r?.success) return { error: r?.errors?.join(", ") || "NP error", raw: r };
        return { data: r.data ?? [] };
      }

      if (action === "getCounterpartyContactPersons") {
        const ref = String(body.counterpartyRef ?? "");
        if (!ref) return { error: "counterpartyRef required" };
        const r = await npCall(apiKey, "Counterparty", "getCounterpartyContactPersons", { Ref: ref, Page: "1" });
        if (!r?.success) return { error: r?.errors?.join(", ") || "NP error", raw: r };
        return { data: r.data ?? [] };
      }

      if (action === "getSenderAddresses") {
        const cityRef = String(body.cityRef ?? "");
        if (!cityRef) return { error: "cityRef required" };
        const r = await npCall(apiKey, "AddressGeneral", "getWarehouses", {
          SettlementRef: cityRef, Language: "UA", Limit: "500",
        });
        const warehouses = (r?.data ?? []).map((w: any) => ({
          ref: w.Ref, number: w.Number, description: w.Description, shortAddress: w.ShortAddress,
        }));
        return { data: warehouses };
      }

      if (action === "createTtn") {
        const registrationId = String(body.registration_id ?? "");
        if (!registrationId) return { error: "registration_id required" };

        const { data: settings } = await supabase
          .from("event_np_sender_settings")
          .select("*")
          .eq("event_id", eventId)
          .maybeSingle();
        if (!settings) return { error: "Sender settings not configured" };

        const { data: reg } = await supabase
          .from("registrations")
          .select("id, event_id, np_ttn_number, delivery_enabled, delivery_recipient_name, delivery_phone, delivery_city_ref, delivery_city_name, delivery_warehouse_ref, delivery_warehouse_name, delivery_warehouse_type")
          .eq("id", registrationId)
          .maybeSingle();
        if (!reg) return { error: "Registration not found" };
        if (reg.event_id !== eventId) return { error: "event mismatch" };
        if (!reg.delivery_enabled) return { error: "Delivery not requested" };
        if (reg.np_ttn_number) return { error: "TTN already exists", ttn: reg.np_ttn_number };
        if (!reg.delivery_city_ref || !reg.delivery_warehouse_ref) {
          return { error: "Recipient delivery address not provided" };
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
          return { error: msg, raw: cpRes };
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
          return { error: msg, raw: r };
        }
        const created = r.data[0];
        const ttn: string = created.IntDocNumber;
        const ref: string = created.Ref;
        const ttnCost = Number(created.CostOnSite ?? 0);
        const estDate = created.EstimatedDeliveryDate ? String(created.EstimatedDeliveryDate).split(" ")[0] : null;

        // Save to registration (use service role to avoid policy nuances)
        const serviceClient = adminClient();
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
        if (updErr) return { error: "Failed to save TTN: " + updErr.message, ttn };

        return { ttn, ref, cost: ttnCost, estimated_delivery_date: estDate };
      }

      if (action === "deleteTtn") {
        const registrationId = String(body.registration_id ?? "");
        if (!registrationId) return { error: "registration_id required" };

        const { data: reg } = await supabase
          .from("registrations")
          .select("id, event_id, np_ttn_ref")
          .eq("id", registrationId)
          .maybeSingle();
        if (!reg || reg.event_id !== eventId) return { error: "Not found" };
        if (!reg.np_ttn_ref) return { error: "No TTN to delete" };

        const r = await npCall(apiKey, "InternetDocument", "delete", { DocumentRefs: reg.np_ttn_ref });
        if (!r?.success) return { error: r?.errors?.join("; ") || "NP delete failed" };

        const serviceClient = adminClient();
        await serviceClient.from("registrations").update({
          np_ttn_number: null, np_ttn_ref: null, np_ttn_cost: null,
          np_ttn_estimated_delivery_date: null, np_ttn_created_at: null, np_ttn_created_by: null,
        }).eq("id", registrationId);

        return { ok: true };
      }

      return { error: "Unknown action" };
    } catch (e) {
      return { error: String(e) };
    }
  });
