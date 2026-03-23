import { create } from "zustand";

import { TOKEN_KEY, changePassword, getCurrentUser, loginWithEmail, loginWithGoogle, registerWithEmail, updateProfile, uploadAvatar } from "../services/api";

export const useAuthStore = create((set, get) => ({
  user: null,
  isLoadingUser: false,
  setSession: ({ user, access_token: token }) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ user });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null });
  },
  loadMe: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null });
      return null;
    }

    set({ isLoadingUser: true });
    try {
      const { data } = await getCurrentUser();
      set({ user: data, isLoadingUser: false });
      return data;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, isLoadingUser: false });
      return null;
    }
  },
  register: async (payload) => {
    const { data } = await registerWithEmail(payload);
    get().setSession(data);
    return data.user;
  },
  login: async (payload) => {
    const { data } = await loginWithEmail(payload);
    get().setSession(data);
    return data.user;
  },
  loginWithGoogleCredential: async (credential) => {
    const { data } = await loginWithGoogle(credential);
    get().setSession(data);
    return data.user;
  },
  updateProfile: async (payload) => {
    const { data } = await updateProfile(payload);
    set({ user: data });
    return data;
  },
  uploadAvatar: async (file) => {
    const data = await uploadAvatar(file);
    set({ user: data });
    return data;
  },
  changePassword: async (payload) => {
    await changePassword(payload);
  },
}));
