// courses slice — lesson resource links (R4: daftar link per lesson).
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseLink } from "../types";

export type LessonLinksProps = {
  links: CourseLink[];
  /** Section heading — defaults to config copy at the call site. */
  heading: string;
  className?: string;
};

export function LessonLinks({ links, heading, className }: LessonLinksProps) {
  if (links.length === 0) return null;
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{heading}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {links.map((link, i) => (
            <li key={i}>
              <Link
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                <ExternalLink className="size-4 shrink-0" aria-hidden />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
