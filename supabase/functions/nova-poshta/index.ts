const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NP_URL = "https://api.novaposhta.ua/v2.0/json/";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("NOVA_POSHTA_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Nova Poshta API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const query = String(body.query ?? "").trim();
    const cityRef = String(body.cityRef ?? "").trim();
    const warehouseType = body.warehouseType as string | undefined; // "branch" | "postomat" | "all"

    let payload: Record<string, unknown> | null = null;

    if (action === "searchCities") {
      if (query.length < 2) {
        return new Response(JSON.stringify({ data: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      payload = {
        apiKey,
        modelName: "Address",
        calledMethod: "searchSettlements",
        methodProperties: { CityName: query, Limit: "20" },
      };
    } else if (action === "searchWarehouses") {
      if (!cityRef) {
        return new Response(JSON.stringify({ data: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const props: Record<string, unknown> = {
        SettlementRef: cityRef,
        Language: "UA",
        Limit: "500",
      };
      if (query) props.FindByString = query;
      // TypeOfWarehouseRef filters: postomat = f9316480-5f2d-425d-bc2c-ac7cd29decf0, branch covers others
      if (warehouseType === "postomat") {
        props.TypeOfWarehouseRef = "f9316480-5f2d-425d-bc2c-ac7cd29decf0";
      }
      payload = {
        apiKey,
        modelName: "AddressGeneral",
        calledMethod: "getWarehouses",
        methodProperties: props,
      };
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const npRes = await fetch(NP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await npRes.json();

    if (action === "searchCities") {
      const addresses = json?.data?.[0]?.Addresses ?? [];
      const cities = addresses.map((a: any) => ({
        ref: a.Ref || a.DeliveryCity,
        name: a.MainDescription || a.Present,
        area: a.Area,
        region: a.Region,
        present: a.Present,
      })).filter((c: any) => c.ref);
      return new Response(JSON.stringify({ data: cities }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "searchWarehouses") {
      const list = json?.data ?? [];
      let warehouses = list.map((w: any) => ({
        ref: w.Ref,
        number: w.Number,
        description: w.Description,
        shortAddress: w.ShortAddress,
        typeRef: w.TypeOfWarehouse,
        isPostomat: w.CategoryOfWarehouse === "Postomat" ||
          w.TypeOfWarehouse === "f9316480-5f2d-425d-bc2c-ac7cd29decf0",
      }));
      if (warehouseType === "branch") {
        warehouses = warehouses.filter((w: any) => !w.isPostomat);
      } else if (warehouseType === "postomat") {
        warehouses = warehouses.filter((w: any) => w.isPostomat);
      }
      return new Response(JSON.stringify({ data: warehouses }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(json), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
