"use client";
// search slice — keyword input (shadcn Input; theme tokens only).
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_QUERY_LENGTH } from "../config/limits";
import type { SearchCopy } from "../config/copy";

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  copy: SearchCopy;
  autoFocus?: boolean;
};

export function SearchInput({ value, onChange, copy, autoFocus }: SearchInputProps) {
  return (
    <div className="relative">
      <Label htmlFor="search-q" className="sr-only">
        {copy.inputLabel}
      </Label>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id="search-q"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={copy.placeholder}
        maxLength={MAX_QUERY_LENGTH}
        autoFocus={autoFocus}
        autoComplete="off"
        className="pl-9"
      />
    </div>
  );
}
