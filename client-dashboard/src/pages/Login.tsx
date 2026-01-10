import { useState, useEffect } from "react";
import { Shield, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type UserType = "admin" | "client" | null;

export default function Login() {
    const [userType, setUserType] = useState<UserType>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    // Check if already logged in
    useEffect(() => {
        const authToken = localStorage.getItem("auth_token");
        const adminKey = localStorage.getItem("admin_key");

        if (authToken) {
            navigate("/client");
        } else if (adminKey) {
            navigate("/admin");
        }
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use different endpoint for admin vs client
            const endpoint = userType === "admin"
                ? "/api/auth/admin/login"
                : "/api/auth/login";

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle different error formats from API
                let errorMessage = "Login failed. Please try again.";

                if (typeof data.detail === "string") {
                    errorMessage = data.detail;
                } else if (data.detail?.message) {
                    errorMessage = data.detail.message;
                } else if (data.message) {
                    errorMessage = data.message;
                }

                throw new Error(errorMessage);
            }

            if (data.success && data.token) {
                // Store token and client info
                if (userType === "client") {
                    localStorage.setItem("auth_token", data.token);
                    localStorage.setItem("client_id", data.client_id);
                    localStorage.setItem("business_name", data.business_name);
                    navigate("/client");
                } else if (userType === "admin") {
                    localStorage.setItem("admin_key", data.token);
                    navigate("/admin");
                }
            }
        } catch (error: any) {
            const errorMessage = error.message || "An unexpected error occurred";
            setError(errorMessage);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };


    /* ---------------- ACCOUNT SELECTION ---------------- */

    if (!userType) {
        return (
            <div className="login-container">
                <div style={{ maxWidth: 900, width: "100%", textAlign: "center" }}>
                    <p style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
                        Instagram DM Agent
                    </p>

                    <h1
                        style={{
                            fontSize: "2.5rem",
                            fontWeight: 700,
                            marginBottom: 8,
                        }}
                    >
                        Welcome Back
                    </h1>

                    <p style={{ color: "var(--text-secondary)", marginBottom: 40 }}>
                        Select your account type to continue
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: 24,
                        }}
                    >
                        {/* Admin */}
                        <div
                            className="login-card"
                            style={{ cursor: "pointer" }}
                            onClick={() => setUserType("admin")}
                        >
                            <Shield size={28} style={{ marginBottom: 12 }} />
                            <h3 style={{ fontSize: "1.2rem", marginBottom: 6 }}>
                                Admin Login
                            </h3>
                            <p className="login-subtitle">
                                Manage clients, agents, and analytics.
                            </p>
                            <p style={{ marginTop: 12, color: "var(--accent-primary)" }}>
                                Continue as Admin →
                            </p>
                        </div>

                        {/* Client */}
                        <div
                            className="login-card"
                            style={{ cursor: "pointer" }}
                            onClick={() => setUserType("client")}
                        >
                            <User size={28} style={{ marginBottom: 12 }} />
                            <h3 style={{ fontSize: "1.2rem", marginBottom: 6 }}>
                                Client Login
                            </h3>
                            <p className="login-subtitle">
                                View leads and agent performance.
                            </p>
                            <p style={{ marginTop: 12, color: "var(--accent-teal)" }}>
                                Continue as Client →
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ---------------- LOGIN FORM ---------------- */

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        {userType === "admin" ? <Shield /> : <User />}
                    </div>
                    <h2 className="login-title">Sign In</h2>
                    <p className="login-subtitle">
                        {userType === "admin"
                            ? "Admin panel access"
                            : "Client dashboard access"}
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 16px",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: 8,
                        marginBottom: 16,
                        color: "#ef4444"
                    }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: 14 }}>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--text-muted)",
                                }}
                            >
                                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                        </div>
                    </div>

                    <button className="btn-login" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
                    <p
                        style={{
                            marginTop: 8,
                            color: "var(--text-muted)",
                            cursor: "pointer",
                        }}
                        onClick={() => setUserType(null)}
                    >
                        ← Back to account selection
                    </p>
                </div>
            </div>
        </div>
    );
}
