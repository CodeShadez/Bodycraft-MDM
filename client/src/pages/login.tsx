import { useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, AlertCircle, Eye, EyeOff, Zap } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        await response.json();
        window.location.href = "/";
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || "Login failed. Please check your credentials.",
        );
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminLogin = () => {
    setCredentials({ username: "admin", password: "admin123" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative px-4">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#6366f1] animate-gradient-shift"></div>

      {/* Animated Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* BODYCRAFT Branding */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Brand Name with Gradient */}
            <h1
              className="text-5xl font-bold tracking-tight transform hover:scale-105 transition-transform duration-500"
              style={{
                background:
                  "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 30px rgba(168, 85, 247, 0.4))",
              }}
            >
              BODYCRAFT
            </h1>

            {/* Tagline with Dividers */}
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent"></div>
              <p className="text-purple-300/90 text-xs font-light tracking-[0.3em] uppercase">
                Salon · Skin · Clinic · Spa
              </p>
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent"></div>
            </div>

            {/* Subtitle */}
            <p className="text-white/70 text-base font-light mt-2">
              Master Data Management System
            </p>
          </div>
        </div>

        {/* Glassmorphism Login Card */}
        <div
          className="glass-card rounded-3xl p-8 shadow-2xl backdrop-blur-xl border border-white/10 animate-slide-up"
          style={{
            background: "rgba(255, 255, 255, 0.13)",
            boxShadow: "0 0 40px rgba(8, 7, 16, 0.6)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-light text-white">Sign In</h2>
            </div>
            <p className="text-white/50 text-sm font-light">
              Access your secure management portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-500/20 border-red-500/50 backdrop-blur-sm animate-shake"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-white">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Username Field with Floating Label */}
            <div className="relative">
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300/60 z-10 transition-colors duration-300" />
                <Input
                  id="username"
                  type="text"
                  placeholder=" "
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({ ...credentials, username: e.target.value })
                  }
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  required
                  autoComplete="username"
                  data-testid="input-username"
                  className="glass-input pl-12 pr-4 py-6 w-full rounded-xl border border-white/30 bg-white/10 placeholder-transparent focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40 transition-all duration-300"
                  style={{
                    backdropFilter: "blur(10px)",
                    color: "#e0e7ff",
                    fontWeight: "500",
                  }}
                />
                <label
                  htmlFor="username"
                  className={`absolute left-12 transition-all duration-300 pointer-events-none ${
                    usernameFocused || credentials.username
                      ? "opacity-0 invisible"
                      : "top-1/2 -translate-y-1/2 text-sm text-white/60 opacity-100 visible"
                  }`}
                >
                  Username
                </label>
              </div>
            </div>

            {/* Password Field with Floating Label */}
            <div className="relative">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300/60 z-10 transition-colors duration-300" />
                <Input
                  id="password"
                  type="password"
                  placeholder=" "
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  autoComplete="current-password"
                  data-testid="input-password"
                  className="glass-input pl-12 pr-12 py-6 w-full rounded-xl border border-white/30 bg-white/10 placeholder-transparent focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40 transition-all duration-300"
                  style={{
                    backdropFilter: "blur(10px)",
                    color: "#e0e7ff",
                    fontWeight: "500",
                    letterSpacing: "0.1em",
                  }}
                />
                <label
                  htmlFor="password"
                  className={`absolute left-12 transition-all duration-300 pointer-events-none ${
                    passwordFocused || credentials.password
                      ? "opacity-0 invisible"
                      : "top-1/2 -translate-y-1/2 text-sm text-white/60 opacity-100 visible"
                  }`}
                >
                  Password
                </label>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-purple-300/40 text-xs z-10 pointer-events-none">
                  <Lock className="h-3 w-3" />
                  <span className="font-light">Encrypted</span>
                </div>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                    rememberMe
                      ? "bg-gradient-to-r from-purple-500 to-blue-500"
                      : "bg-white/20"
                  }`}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                      rememberMe ? "transform translate-x-5" : ""
                    }`}
                  ></div>
                </div>
                <span className="text-white/60 text-sm font-light group-hover:text-white/90 transition-colors duration-300">
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="text-purple-300 text-sm font-light hover:text-purple-200 transition-colors duration-300"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={loading}
              data-testid="button-signin"
              className="w-full py-6 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium text-lg shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-4 text-white/40 bg-transparent font-light tracking-wider">
                  Quick Access
                </span>
              </div>
            </div>

            {/* Quick Admin Login Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleSuperAdminLogin}
              data-testid="button-superadmin-login"
              className="w-full py-5 rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white font-light backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300"
            >
              <Zap className="h-4 w-4 mr-2" />
              Super Admin Login
            </Button>

            <p className="text-center text-white/30 text-xs font-light mt-3">
              Credentials: <span className="text-purple-300/80">admin</span> /{" "}
              <span className="text-purple-300/80">admin123</span>
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2 animate-fade-in-delay">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400/90 text-xs font-light">
              Secure Connection
            </span>
          </div>
          <p className="text-white/30 text-xs font-light">
            © 2025 BODYCRAFT. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(20px); }
        }
        
        @keyframes float-slower {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(20px) translateX(-20px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-delay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-slower {
          animation: float-slower 10s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in-delay 1s ease-out 0.5s both;
        }
        
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        
        .glass-input:focus {
          background: rgba(255, 255, 255, 0.15) !important;
        }
        
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #e0e7ff !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.1) inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}
