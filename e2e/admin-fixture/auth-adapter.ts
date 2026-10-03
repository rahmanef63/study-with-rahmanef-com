import { navigate } from "./next-adapter";
export const useAuthFlow = () => ({ signOut: async () => navigate("?view=menu&role=anonymous") });
