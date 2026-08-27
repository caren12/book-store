import { useDispatch } from "react-redux";

// DEV-ONLY: lets you fake an admin login to test /admin routes
// before real auth/backend is finished. Automatically hidden in
// production builds (import.meta.env.DEV is false when built).
// Safe to leave in the codebase — just never gets rendered outside
// a local dev server.
export default function DevAdminToggle() {
  const dispatch = useDispatch();

  if (!import.meta.env.DEV) return null;

  function loginAsFakeAdmin() {
    dispatch({
      type: "auth/devFakeLogin",
      payload: {
        user: {
          id: "dev-admin",
          name: "Dev Admin",
          email: "admin@dev.local",
          role: "admin",
        },
        access_token: "dev-fake-token",
      },
    });
  }

  return (
    <button
      onClick={loginAsFakeAdmin}
      className="fixed bottom-4 right-4 z-50 bg-red-800 text-white text-xs px-3 py-2 rounded-sm shadow-lg hover:bg-red-900"
      title="Dev only: fake admin login"
    >
      🛠 Fake Admin Login
    </button>
  );
}