import { NextResponse } from "next/server";
import { buildTrmnlPayload } from "@/lib/trmnl";

export async function POST() {
  const webhookUrl = process.env.TRMNL_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "TRMNL_WEBHOOK_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const payload = await buildTrmnlPayload();

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to push to TRMNL",
          status: response.status,
          statusText: response.statusText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      payload: payload.merge_variables,
    });
  } catch (error) {
    console.error("TRMNL push error:", error);
    return NextResponse.json(
      { error: "Failed to push to TRMNL" },
      { status: 500 }
    );
  }
}
