// asisten slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). Integration points alpha (#35):
//   1. Window-app: <AsistenChatView lessonId={seg(payload)[0]} /> di os-shell
//      (deep-link /asisten atau /asisten/<lessonId>).
//   2. Shell Inspector (⌘I): capabilities.useChat = useAsistenChat — signature
//      (messages) => AsyncGenerator<string> memang dibuat kompatibel.
//
// Convex surface (not re-exported; call via api.features.asisten.*):
//   chat:ask — action, LOGIN WAJIB; konteks lesson member-gated server-side.

// feature descriptor
export { asistenFeature } from "./config";

// connected view (integrator mounts this)
export { AsistenChatView, type AsistenChatViewProps } from "./views/asisten-chat-view";

// presentational components (props-driven, portable)
export {
  AsistenMessageBubble,
  type AsistenMessageBubbleProps,
} from "./components/asisten-message";

// hooks
export {
  asistenErrorCode,
  useAsistenChat,
  type UseAsistenChatOptions,
} from "./hooks/use-asisten-chat";

// lib (plain, non-hook chat call — lazy consumers dynamic-import the barrel:
// os-shell alfa-chat keeps the parked slice out of the initial JS chunk)
export { sendAsistenChat } from "./lib/send-chat";

// copy (props-driven defaults)
export {
  ASISTEN_COPY,
  mergeAsistenCopy,
  type AsistenCopy,
  type AsistenCopyOverride,
} from "./config/copy";

// limits (UI mirrors of the server bounds)
export { MAX_MESSAGES, MAX_TEXT } from "./config/limits";

// types
export type { AsistenChatFn, AsistenErrorCode, AsistenMessage } from "./types";
