import { NextResponse } from "next/server";
import {
  getAvailableFreeModels,
  getAvailableModelsByCategory,
  syncAllFreeCombos,
  getFreeSyncState,
} from "@/lib/services/freeComboSync";

export const dynamic = "force-dynamic";

// GET /api/combos/sync-free - Get available models by category & sync status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "free";
    const freeOnly = searchParams.get("freeOnly") === "true" || category === "free";

    let models = [];
    if (category === "free") {
      models = await getAvailableFreeModels();
    } else {
      models = await getAvailableModelsByCategory(category, { freeOnly });
    }

    const state = getFreeSyncState();
    return NextResponse.json({
      category,
      freeOnly,
      models,
      freeModels: models, // backward-compatibility
      count: models.length,
      ...state,
    });
  } catch (error) {
    console.error("Error in GET /api/combos/sync-free:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

// POST /api/combos/sync-free - Trigger immediate free models sync
export async function POST() {
  try {
    const result = await syncAllFreeCombos();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/combos/sync-free:", error);
    return NextResponse.json({ error: "Failed to sync free combos" }, { status: 500 });
  }
}
