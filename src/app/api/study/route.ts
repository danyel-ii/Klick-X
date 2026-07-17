import { NextResponse } from "next/server";
import { isAuthorizedRequest, unauthorized } from "@/lib/server/api-auth";
import { ApiValidationError, validateAction, validateStatsFilters } from "@/lib/server/api-validation";
import { assertSameOrigin, readJsonBody, RequestSecurityError } from "@/lib/server/request-security";
import * as repo from "@/lib/server/study-repository";
import type { ExportPayload, Locale, Subject, Tag } from "@/lib/types";

export const dynamic = "force-dynamic";

function requestDateKey(request: Request) {
  const candidate = request.headers.get("x-study-date");
  if (!candidate || !/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return undefined;
  const parsed = new Date(`${candidate}T00:00:00.000Z`);
  const withinTimezoneBoundary = Math.abs(parsed.getTime() - Date.now()) <= 2 * 86_400_000;
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== candidate || !withinTimezoneBoundary ? undefined : candidate;
}

function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Database unavailable.";
  if (
    error instanceof ApiValidationError ||
    error instanceof RequestSecurityError ||
    message.startsWith("Invalid import payload") ||
    message === "Every planned block needs a subject." ||
    message === "Subject is required." ||
    message === "Active blocks cannot be deleted." ||
    message === "Studied blocks cannot be deleted."
  ) {
    return NextResponse.json({ error: message }, { status: error instanceof RequestSecurityError ? error.status : 400 });
  }
  console.error("Study API request failed", error);
  return NextResponse.json({ error: "The study database is temporarily unavailable." }, { status: 503 });
}

export async function GET(request: Request) {
  if (!(await isAuthorizedRequest(request))) return unauthorized();

  try {
    return NextResponse.json(await repo.getSnapshot(requestDateKey(request)));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorizedRequest(request))) return unauthorized();

  try {
    assertSameOrigin(request);
    const body = validateAction(await readJsonBody(request, 6 * 1024 * 1024));
    const payload = body.payload as Record<string, unknown>;

    switch (body.action) {
      case "setLocale":
        await repo.setLocale(payload?.locale as Locale);
        break;
      case "updateSettings":
        await repo.updateSettings(payload?.patch as Parameters<typeof repo.updateSettings>[0]);
        break;
      case "completeOnboarding":
        await repo.completeOnboarding();
        break;
      case "resetOnboarding":
        await repo.resetOnboarding();
        break;
      case "createSubject":
        await repo.createSubject(payload?.input as { name: string; color: string; icon?: string });
        break;
      case "updateSubject":
        await repo.updateSubject(payload?.id as string, payload?.input as Partial<Pick<Subject, "name" | "color" | "icon">>);
        break;
      case "archiveSubject":
        await repo.archiveSubject(payload?.id as string);
        break;
      case "restoreSubject":
        await repo.restoreSubject(payload?.id as string);
        break;
      case "deleteSubject":
        await repo.deleteSubject(payload?.id as string, Boolean(payload?.force));
        break;
      case "createTag":
        await repo.createTag(payload?.input as { name: string; color: string; description?: string });
        break;
      case "updateTag":
        await repo.updateTag(payload?.id as string, payload?.input as Partial<Pick<Tag, "name" | "color" | "description">>);
        break;
      case "archiveTag":
        await repo.archiveTag(payload?.id as string);
        break;
      case "restoreTag":
        await repo.restoreTag(payload?.id as string);
        break;
      case "deleteTag":
        await repo.deleteTag(payload?.id as string, Boolean(payload?.force));
        break;
      case "createOrUpdateDayPlan":
        await repo.createOrUpdateDayPlan(payload?.date as string, payload?.plannedBlockCount as number, payload?.assignments as Parameters<typeof repo.createOrUpdateDayPlan>[2]);
        break;
      case "addBlockToDay":
        await repo.addBlockToDay(payload?.date as string, payload?.input as Parameters<typeof repo.addBlockToDay>[1]);
        break;
      case "deleteBlock":
        await repo.deleteBlock(payload?.id as string);
        break;
      case "startBlock":
        return NextResponse.json({ blocks: await repo.startBlock(payload?.id as string) });
      case "pauseBlock":
        return NextResponse.json({ blocks: await repo.pauseBlock(payload?.id as string) });
      case "completeBlock":
        return NextResponse.json(await repo.completeBlock(payload?.id as string));
      case "skipBlock":
        return NextResponse.json({ blocks: await repo.skipBlock(payload?.id as string) });
      case "updateBlockSubject":
        return NextResponse.json({ blocks: await repo.updateBlockSubject(payload?.id as string, payload?.subjectId as string) });
      case "updateBlockTags":
        return NextResponse.json({ blocks: await repo.updateBlockTags(payload?.id as string, payload?.tagIds as string[]) });
      case "updateBlockNote":
        {
          const block = await repo.updateBlockNote(payload?.id as string, payload?.note as string);
          if (!block) return NextResponse.json({ error: "Block not found." }, { status: 404 });
          return NextResponse.json({ block });
        }
      case "importLocalData":
        await repo.importLocalData(payload?.payload as ExportPayload);
        break;
      case "resetLocalData":
        if (payload?.confirm !== "RESET") return NextResponse.json({ error: "Reset confirmation is required." }, { status: 400 });
        await repo.resetLocalData();
        break;
    }

    return NextResponse.json(await repo.getSnapshot(requestDateKey(request)));
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthorizedRequest(request))) return unauthorized();

  try {
    assertSameOrigin(request);
    const filters = validateStatsFilters(await readJsonBody(request, 16 * 1024));
    return NextResponse.json(await repo.getStats(filters, requestDateKey(request)));
  } catch (error) {
    return apiError(error);
  }
}
