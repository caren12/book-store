import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";

export default function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const cartCount = useSelector((state) => state.cart.items.length);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className="bg-ink text-paper sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-paper">
          Booked<span className="text-accent">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/?section=store" className="hover:text-accent">Shop</Link>
          <Link to="/?section=library" className="hover:text-accent">Library</Link>
          {user && <Link to="/my-activity" className="hover:text-accent">My Activity</Link>}
          {user?.role === "admin" && <Link to="/admin" className="hover:text-accent">Admin</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <Link to="/cart" className="relative text-sm font-medium hover:text-accent">
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-accent text-ink text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <button onClick={handleLogout} className="text-sm border border-paper/40 px-3 py-1 rounded-sm hover:bg-paper hover:text-ink transition">
              Log out
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm px-3 py-1 hover:text-accent">Log in</Link>
              <Link to="/register" className="text-sm bg-accent text-ink font-medium px-3 py-1 rounded-sm hover:opacity-90 transition">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}