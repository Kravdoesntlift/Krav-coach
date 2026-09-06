import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kravcoaching.com";

// Generates a personalised iOS .shortcut file for the authenticated client.
// The shortcut reads today's step count from Apple Health and sends it to
// the client's unique sync URL via a GET request: no JSON body, no POST.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from("health_tokens")
    .select("sync_token")
    .eq("client_id", user.id)
    .maybeSingle();

  if (!tokenRow?.sync_token) {
    return NextResponse.json({ error: "Token não encontrado. Abre as Integrações primeiro." }, { status: 404 });
  }

  const { buildShortcut, actionOutput, withVariables } = require("@joshfarrant/shortcuts-js");

  const syncUrlBase = `${SITE_URL}/api/health/sync?token=${tokenRow.sync_token}&steps=`;

  // Magic variable that captures the output of the health action
  const stepsVar = actionOutput("Steps");

  // Action 1: Read Health Data, steps count for today (sum)
  const healthAction = {
    WFWorkflowActionIdentifier: "is.workflow.actions.health.quantity.requestrecent",
    WFWorkflowActionParameters: {
      WFHealthQuantityIdentifier: "HKQuantityTypeIdentifierStepCount",
      WFQuantityAggregationStyle: "Sum",
      WFHealthStartDate: {
        Value: { WFDateType: "StartOfDay" },
        WFSerializationType: "WFDate",
      },
      WFHealthEndDate: {
        Value: { WFDateType: "Now" },
        WFSerializationType: "WFDate",
      },
      UUID: stepsVar.Value.OutputUUID,
      CustomOutputName: "Steps",
    },
  };

  // Action 2: URL, base URL + steps magic variable appended
  // withVariables called as a function: strings array + variable args
  const urlWithSteps = withVariables([syncUrlBase, ""], stepsVar);

  const urlAction = {
    WFWorkflowActionIdentifier: "is.workflow.actions.url",
    WFWorkflowActionParameters: {
      WFURLActionURL: urlWithSteps,
    },
  };

  // Action 3: Get Contents of URL (GET, uses the URL from action 2)
  const getAction = {
    WFWorkflowActionIdentifier: "is.workflow.actions.downloadurl",
    WFWorkflowActionParameters: {
      WFHTTPMethod: "GET",
      Advanced: false,
      ShowHeaders: false,
      WFHTTPHeaders: { Value: { WFDictionaryFieldValueItems: [] }, WFSerializationType: "WFDictionaryFieldValue" },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: any = buildShortcut(
    [healthAction, urlAction, getAction],
    { icon: { color: 4274264319, glyph: 59613 } } // gold-ish, heart-activity glyph
  );

  // Buffer from bplist-creator: cast to avoid TS body type mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="KRAV Sync.shortcut"`,
      "Cache-Control": "no-store",
    },
  });
}
