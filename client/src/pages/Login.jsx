import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Home() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Return to the brief after auth; the reader can save into their own
        // account-specific saved list once logged in.
        navigate(location.state?.from || "/");
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-950 border-b border-zinc-800">
        <header className="flex items-center gap-3 px-5 py-4 shadow-md bg-zinc-950 border-b border-zinc-800">
            <h1 className="font-bold text-2xl !text-white font-oswald">Daily News Brief</h1>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-8 font-heebo" >
            <h2 className="!text-5xl !font-medium !text-white py-6">Login</h2>
            <div className="w-full max-w-xl">
                <form className= "flex flex-col gap-10" onSubmit={handleLogin}>
                    <div>
                        <input id="email" type="email" placeholder="Email" value = {email} 
                        onChange= {(e) => setEmail(e.target.value)}
                        className="w-full border-0 border-b-2 border-blue-600 bg-transparent text-xl outline-none"/>
                    </div>
                    <div>
                        <input id="password" type="password" placeholder="Password" value = {password}
                        onChange = {(e) => setPassword(e.target.value)}
                        className="w-full border-0 border-b-2 border-blue-600 bg-transparent text-xl outline-none py-4"/>
                    </div>
                    <button type="submit" 
                    disabled = {loading}
                    className="bg-blue-600 border rounded-[20px] text-3xl py-2 m-4 text-white font-medium">{loading ? "Logging in ..." : "Log in"}</button>
                    {error && (<p style={{ color: "red", marginTop: "10px" }}>{error}</p>)}
                </form>
            </div>
            <p className="mt-4 text-xl font-light text-white py-4">Don't have an account?
                <Link to="/signup" state={location.state} className="font-semibold text-white"> Sign up</Link>
            </p>
        
        </main>
    </div>
  );
}
