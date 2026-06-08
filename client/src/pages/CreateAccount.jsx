import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Home() {
const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const navigate = useNavigate();
const location = useLocation();

const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const handleSignup = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        password,
        confirmPassword,
      }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Return to the brief after auth; new saves are stored under this user.
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
        <header className="flex items-center gap-3 bg-zinc-950 border-b border-zinc-800 px-10 py-6 shadow-md">
            <h1 className="!text-5xl !font-medium !text-white font-oswald">Daily News Brief</h1>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-6 font-heebo" >
            <h2 className="!text-5xl !font-bold !text-white py-6">Create Account</h2>
            <div className="w-full max-w-xl">
                <form className= "flex flex-col gap-10" onSubmit = {handleSignup}>
                    <div>
                        <input id="name" type="name" placeholder="Full Name"  
                        value = {fullName}
                        onChange = {(e) => setFullName(e.target.value)}
                        className="w-full border-0 border-b-2 border-blue-600 bg-transparent text-xl outline-none"/>
                    </div>
                    <div>
                        <input id="email" type="email" placeholder="Email" 
                        value = {email}
                        onChange = {(e) => setEmail(e.target.value)} 
                        className="w-full border-0 border-b-2 border-blue-600 bg-transparent text-xl outline-none"/>
                    </div>
                    <div>
                        <input id="password" type="password" placeholder="Password" 
                        value = {password}
                        onChange = {(e) => setPassword(e.target.value)}
                        className="w-full border-0 border-b-2 border-blue-600 bg-transparent text-xl outline-none"/>
                    </div>
                    <div>
                        <input id="confirmPassword" type="password" placeholder="Confirm Password"  
                        value = {confirmPassword}
                        onChange = {(e) => setConfirmPassword(e.target.value)}
                        className="w-full border-0 border-b-2 border-blue-600 bg-transparent text-xl outline-none py-4"/>
                    </div>
                    <button type="submit" 
                    disabled = {loading}
                    className="bg-blue-600 border rounded-[20px] text-3xl py-2 m-4 text-white font-medium"> {loading ? "Signing Up.. " : "Sign Up"} </button>
                    {error && ( <p style={{ color: "red", marginTop: "10px" }}>{error}</p>)}
                </form>
            </div>
            <p className="mt-4 text-xl font-light text-white py-4">Already have an account?
                <Link to="/login" state={location.state} className="font-semibold text-white"> Sign in</Link>
            </p>
        
        </main>
    </div>
  );
}
