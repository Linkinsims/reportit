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
      console.error("Auth error:", error);
      let toastTitle = "";
      if (error instanceof Error) {
        if (error.message.includes("Invalid")) {
          toastTitle = "Invalid credentials. Please try again.";
        } else {
          toastTitle =
            flow === "signIn"
              ? "Could not sign in, did you mean to sign up?"
              : "Could not sign up, did you mean to sign in?";
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
