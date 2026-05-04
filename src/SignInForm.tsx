import { useAuth } from "./contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn: signInAction, signUp: signUpAction } = useAuth();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (flow === "signIn") {
        await signInAction(email, password);
      } else {
        await signUpAction(email, password);
      }
    } catch (error: unknown) {
      let toastTitle = "";
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
          toastTitle = "Wrong email or password.";
        } else if (msg.includes("user already registered") || msg.includes("already registered")) {
          toastTitle = "Account already exists. Sign in instead.";
        } else if (msg.includes("email not confirmed")) {
          toastTitle = "Please confirm your email first.";
        } else {
          toastTitle = error.message;
        }
      }
      toast.error(toastTitle);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
    </div>
  );
}
