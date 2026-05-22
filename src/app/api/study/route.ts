import { NextResponse } from "next/server";
import * as repo from "@/lib/server/study-repository";
import type { ExportPayload, Locale, StatsFilters, Subject, Tag } from "@/lib/types";

export const dynamic = "force-dynamic";

function unavailable(error: unknown) {
  const message = error instanceof Error ? error.message : "Database unavailable.";
  return NextResponse.json({ error: message }, { status: 503 });
}

export async function GET() {
  try {
    return NextResponse.json(await repo.getSnapshot());
  } catch (error) {
    return unavailable(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action: string; payload?: unknown };
    const payload = body.payload as Record<string, unknown> | undefined;

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
      case "startBlock":
        await repo.startBlock(payload?.id as string);
        break;
      case "pauseBlock":
        await repo.pauseBlock(payload?.id as string);
        break;
      case "completeBlock":
        await repo.completeBlock(payload?.id as string);
        break;
      case "skipBlock":
        await repo.skipBlock(payload?.id as string);
        break;
      case "updateBlockSubject":
        await repo.updateBlockSubject(payload?.id as string, payload?.subjectId as string);
        break;
      case "updateBlockTags":
        await repo.updateBlockTags(payload?.id as string, payload?.tagIds as string[]);
        break;
      case "updateBlockNote":
        await repo.updateBlockNote(payload?.id as string, payload?.note as string);
        break;
      case "importLocalData":
        await repo.importLocalData(payload?.payload as ExportPayload);
        break;
      case "resetLocalData":
        await repo.resetLocalData();
        break;
      default:
        return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
    }

    return NextResponse.json(await repo.getSnapshot());
  } catch (error) {
    return unavailable(error);
  }
}

export async function PUT(request: Request) {
  try {
    const filters = (await request.json()) as StatsFilters;
    return NextResponse.json(await repo.getStats(filters));
  } catch (error) {
    return unavailable(error);
  }
}
