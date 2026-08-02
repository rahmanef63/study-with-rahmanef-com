// quiz slice — client-side mirror of the server bounds.
// SSOT: convex/features/quiz/validate.ts (server enforces; these only drive
// form hints/maxLength). Keep in sync when the server values change.
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;
export const MIN_QUESTIONS = 1;
export const MAX_QUESTIONS = 50;
export const MAX_PROMPT_CHARS = 500;
export const MAX_OPTION_CHARS = 200;
export const MAX_EXPLANATION_CHARS = 1000;
export const MAX_TITLE_CHARS = 120;
