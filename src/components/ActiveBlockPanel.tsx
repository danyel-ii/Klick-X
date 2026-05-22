"use client";

import type { StudyBlock, Subject, Tag } from "../lib/types";
import { TagPill, TimerRing } from "./ui";

export function ActiveBlockPanel({
  block,
  now,
  subject,
  tags,
}: {
  block: StudyBlock;
  now: Date;
  subject?: Subject;
  tags: Tag[];
}) {
  return (
    <div className="mt-5 grid place-items-center text-center">
      <TimerRing block={block} now={now} />
      <h3 className="mt-4 text-xl font-bold">{subject?.name}</h3>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {tags.map((tag) => (
          <TagPill key={tag.id} tag={tag} />
        ))}
      </div>
    </div>
  );
}
