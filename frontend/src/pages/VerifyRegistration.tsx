import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import { authApi } from "../services/api/auth";
import { errorMessage } from "../utils/errors";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import AuthLayout from "../components/ui/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyRegistration() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [resending, setResending] = useState(false);
    // Seconds until another code may be requested; the server enforces the same minute
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        const emailParam = searchParams.get("email");
        const stateEmail = location.state?.email;
        if (emailParam) {
            setEmail(emailParam);
        } else if (stateEmail) {
            setEmail(stateEmail);
            // Arriving from the form means a code was only just sent
            setCooldown(RESEND_COOLDOWN_SECONDS);
        }
    }, [searchParams, location]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleResend = async () => {
        if (!email) {
            setError("Enter your email address first.");
            return;
        }
        setResending(true);
        setError(null);
        try {
            await authApi.resendRegistrationOtp({ email });
            // The same message for every address, so it is never a hint that one is (un)registered
            toast.success("If that address has a pending registration, a new code is on its way.");
            setCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            toast.error(errorMessage(err, "Could not resend the code. Please try again."));
        } finally {
            setResending(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authApi.verifyRegistrationOtp({ email, otp });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError(errorMessage(err, "Verification failed. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    // Same look as the other sign-in pages: AuthLayout supplies the page, card, heading and the light/dark theme
    const linkClass =
        "font-medium text-brand-orange hover:text-brand-red dark:text-brand-yellow dark:hover:text-brand-orange";

    return (
        <AuthLayout
            title="Verify your email"
            subtitle="Enter the code we sent to your email address to activate your account."
        >
            {success ? (
                <div className="mt-8 flex flex-col items-center rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
                    <CheckCircle2 className="mb-4 h-12 w-12 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">Verified!</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Redirecting to login...</p>
                </div>
            ) : (
                <form onSubmit={handleVerify} className="mt-8 space-y-4">
                    <Input
                        id="email"
                        type="email"
                        label="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        id="otp"
                        type="text"
                        label="One-Time Password (OTP)"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                        className="text-center font-mono text-lg tracking-widest"
                    />

                    {error && (
                        <div className="flex items-center rounded-lg bg-brand-red/10 p-3 text-sm text-brand-red dark:bg-brand-red/5">
                            <AlertCircle className="mr-2 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            "Verifying..."
                        ) : (
                            <span className="flex items-center gap-2">
                                Verify Account <ArrowRight className="h-4 w-4" />
                            </span>
                        )}
                    </Button>

                    <div className="space-y-2 pt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resending || cooldown > 0}
                            className={`${linkClass} disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-gray-500`}
                        >
                            {resending
                                ? "Sending..."
                                : cooldown > 0
                                    ? `Resend code in ${cooldown}s`
                                    : "Resend code"}
                        </button>
                        <p>
                            Registrations that are not verified within 7 days are removed. No code? If you already have an account, try{" "}
                            <Link to="/login" className={linkClass}>logging in</Link> or{" "}
                            <Link to="/forgot-password" className={linkClass}>resetting your password</Link>.
                        </p>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
}
