import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { MessageSquare, Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

// Simple Card components if not available locally, but assuming they might exist.
// If not, standard HTML/Tailwind works. using Tailwind classes for "Wow" factor.

export default function VerifyRegistration() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get("email");
        const stateEmail = location.state?.email;
        if (emailParam) {
            setEmail(emailParam);
        } else if (stateEmail) {
            setEmail(stateEmail);
        }
    }, [searchParams, location]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Logic based on AuthController: verifyRegistrationOtp(email, otp)
            await axios.post("http://localhost:8080/api/auth/verify-registration-otp", null, {
                params: { email, otp },
                withCredentials: true
            });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-secondary/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary/20 text-brand-primary mb-4 ring-1 ring-brand-primary/50">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">
                        Verify Your Email
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Enter the OTP sent to your email address to activate your account.
                    </p>
                </div>

                {success ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold text-green-500">Verified!</h3>
                        <p className="text-muted-foreground text-sm mt-1">Redirecting to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                id="email"
                                type="email"
                                label="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background/50 border-white/10 focus:border-brand-primary/50 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="otp"
                                type="text"
                                label="One-Time Password (OTP)"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={6}
                                className="bg-background/50 border-white/10 tracking-widest text-center font-mono text-lg focus:border-brand-primary/50 transition-all"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Verify Account <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
