import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

const countries = [
  "Nigeria",
  "Ghana",
  "South Africa",
  "Kenya",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "United Arab Emirates",
  "Other",
];

const countryPhoneData: Record<
  string,
  {
    code: string;
    placeholder: string;
  }
> = {
  Nigeria: {
    code: "+234",
    placeholder: "+234 801 234 5678",
  },
  Ghana: {
    code: "+233",
    placeholder: "+233 24 123 4567",
  },
  "South Africa": {
    code: "+27",
    placeholder: "+27 82 123 4567",
  },
  Kenya: {
    code: "+254",
    placeholder: "+254 712 345678",
  },
  "United Kingdom": {
    code: "+44",
    placeholder: "+44 7911 123456",
  },
  "United States": {
    code: "+1",
    placeholder: "+1 201 555 0123",
  },
  Canada: {
    code: "+1",
    placeholder: "+1 416 555 0123",
  },
  Australia: {
    code: "+61",
    placeholder: "+61 412 345 678",
  },
  Germany: {
    code: "+49",
    placeholder: "+49 151 23456789",
  },
  France: {
    code: "+33",
    placeholder: "+33 6 12 34 56 78",
  },
  "United Arab Emirates": {
    code: "+971",
    placeholder: "+971 50 123 4567",
  },
  Other: {
    code: "",
    placeholder: "+1 201 555 0123",
  },
};

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(
    {}
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const selectedPhoneData =
    countryPhoneData[form.country] || {
      code: "+1",
      placeholder: "+1 201 555 0123",
    };

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    setForm((f) => ({
      ...f,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));

    setFieldErrors((fe) => ({
      ...fe,
      [name]: "",
    }));

    setError("");
    setSuccess("");
  }

  function handleCountryChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const country = e.target.value;

    setForm((f) => ({
      ...f,
      country,
      phone: "",
    }));

    setFieldErrors((fe) => ({
      ...fe,
      country: "",
      phone: "",
    }));

    setError("");
    setSuccess("");
  }

  function handlePhoneChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    let value = e.target.value;

    /*
     * If the selected country has a country code,
     * automatically keep it at the beginning.
     */
    if (selectedPhoneData.code) {
      if (!value.startsWith(selectedPhoneData.code)) {
        value = `${selectedPhoneData.code} ${value.replace(/^\+?\d*\s*/, "")}`;
      }
    }

    setForm((f) => ({
      ...f,
      phone: value,
    }));

    setFieldErrors((fe) => ({
      ...fe,
      phone: "",
    }));

    setError("");
    setSuccess("");
  }

  function validate() {
    const errs: Record<string, string> = {};

    if (!form.firstName.trim()) {
      errs.firstName = "First name is required.";
    }

    if (!form.lastName.trim()) {
      errs.lastName = "Last name is required.";
    }

    if (!form.email.trim() || !form.email.includes("@")) {
      errs.email = "Enter a valid email address.";
    }

    if (!form.country) {
      errs.country = "Please select your country.";
    }

    if (!form.phone.trim()) {
      errs.phone = "Phone number is required.";
    }

    if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (!form.agreed) {
      errs.agreed = "You must agree to the terms to continue.";
    }

    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");
    setFieldErrors({});

    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);

    try {
      const email = form.email.trim().toLowerCase();
      const firstName = form.firstName.trim();
      const lastName = form.lastName.trim();
      const country = form.country;
      const phone = form.phone.trim();

      /*
       * Create the Supabase Auth account.
       *
       * The information below is stored in
       * auth.users.raw_user_meta_data.
       *
       * Our database trigger:
       *
       * on_auth_user_created
       *
       * reads this metadata and automatically creates
       * the user's profile and wallet.
       */
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              country,
              phone,
            },
          },
        });

      if (signUpError) {
        console.error("SIGNUP ERROR:", signUpError);
        throw signUpError;
      }

      if (!data.user) {
        throw new Error(
          "Registration failed. No user account was created."
        );
      }

      /*
       * IMPORTANT:
       *
       * We do NOT insert into profiles here.
       *
       * The database trigger automatically creates:
       *
       * profiles:
       * - id
       * - first_name
       * - last_name
       * - email
       * - country
       * - phone
       *
       * wallets:
       * - user_id
       * - available_balance = 0
       * - invested_balance = 0
       * - total_profit = 0
       */

      /*
       * Email confirmation is enabled.
       *
       * Supabase creates the Auth user but does not give
       * the browser an active session until the email
       * is confirmed.
       */
      if (!data.session) {
        setSuccess(
          "Account created successfully. Please check your email to confirm your account."
        );

        setForm({
          firstName: "",
          lastName: "",
          email: "",
          country: "",
          phone: "",
          password: "",
          confirmPassword: "",
          agreed: false,
        });

        setShowPassword(false);
        setShowConfirmPassword(false);

        return;
      }

      /*
       * Email confirmation is disabled, so the user
       * already has an active session.
       */
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("REGISTRATION ERROR:", err);

      let message =
        "Unable to create your account. Please try again.";

      if (err instanceof Error) {
        message = err.message;
      }

      /*
       * Make Supabase's rate-limit message easier to understand.
       */
      if (
        message.toLowerCase().includes("too many requests") ||
        message.includes("429")
      ) {
        message =
          "Too many signup attempts. Please wait a few minutes and try again.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasError?: boolean) => ({
    background: "rgba(255,255,255,0.03)",
    color: "#f5f0e8",
    border: `1px solid ${hasError
      ? "rgba(220,80,80,0.5)"
      : "rgba(212,160,23,0.2)"
      }`,
    outline: "none",
    width: "100%",
    padding: "0.875rem 1rem",
    fontSize: "0.875rem",
    fontFamily: "'Hanken Grotesk', sans-serif",
  });

  return (
    <div className="fade-up min-h-screen flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-lg">

        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{ background: "#d4a017" }}
            >
              <span
                className="text-sm font-black"
                style={{ color: "#09090e" }}
              >
                ME
              </span>
            </div>

            <span className="font-bold text-lg tracking-tight">
              Musk Enterprise
            </span>
          </Link>

          <h1
            className="text-2xl font-black tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            Create your account
          </h1>

          <p
            className="text-sm mt-2"
            style={{ color: "#9090a8" }}
          >
            Create your account to access your investment dashboard.
          </p>
        </div>

        <div
          className="p-8 border"
          style={{
            background: "#111118",
            borderColor: "rgba(212,160,23,0.2)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div
                className="px-4 py-3 text-xs border"
                style={{
                  background: "rgba(220,80,80,0.06)",
                  borderColor: "rgba(220,80,80,0.25)",
                  color: "#e05050",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="px-4 py-3 text-xs border"
                style={{
                  background: "rgba(212,160,23,0.06)",
                  borderColor: "rgba(212,160,23,0.2)",
                  color: "#d4a017",
                }}
              >
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>
                <label className="block text-xs font-semibold mb-2">
                  First Name
                </label>

                <input
                  type="text"
                  name="firstName"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  style={inputStyle(!!fieldErrors.firstName)}
                  placeholder="First"
                  autoComplete="given-name"
                />

                {fieldErrors.firstName && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: "#e05050" }}
                  >
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">
                  Last Name
                </label>

                <input
                  type="text"
                  name="lastName"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  style={inputStyle(!!fieldErrors.lastName)}
                  placeholder="Last"
                  autoComplete="family-name"
                />

                {fieldErrors.lastName && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: "#e05050" }}
                  >
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>

            </div>

            <div>
              <label className="block text-xs font-semibold mb-2">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                style={inputStyle(!!fieldErrors.email)}
                placeholder="you@example.com"
                autoComplete="email"
              />

              {fieldErrors.email && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "#e05050" }}
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2">
                Country
              </label>

              <select
                name="country"
                required
                value={form.country}
                onChange={handleCountryChange}
                style={inputStyle(!!fieldErrors.country)}
              >
                <option
                  value=""
                  style={{ background: "#111118" }}
                >
                  Select your country
                </option>

                {countries.map((country) => (
                  <option
                    key={country}
                    value={country}
                    style={{ background: "#111118" }}
                  >
                    {country}
                  </option>
                ))}
              </select>

              {fieldErrors.country && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "#e05050" }}
                >
                  {fieldErrors.country}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2">
                Phone Number
              </label>

              <div className="relative">
                {selectedPhoneData.code && (
                  <div
                    className="absolute left-0 top-0 bottom-0 flex items-center px-3"
                    style={{
                      color: "#d4a017",
                      borderRight: "1px solid rgba(212,160,23,0.2)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      pointerEvents: "none",
                    }}
                  >
                    {selectedPhoneData.code}
                  </div>
                )}

                <input
                  type="tel"
                  name="phone"
                  required
                  value={
                    selectedPhoneData.code &&
                      form.phone.startsWith(selectedPhoneData.code)
                      ? form.phone.slice(selectedPhoneData.code.length).trimStart()
                      : form.phone
                  }
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    if (selectedPhoneData.code) {
                      setForm((f) => ({
                        ...f,
                        phone: `${selectedPhoneData.code} ${inputValue}`,
                      }));
                    } else {
                      handlePhoneChange(e);
                    }

                    setFieldErrors((fe) => ({
                      ...fe,
                      phone: "",
                    }));

                    setError("");
                    setSuccess("");
                  }}
                  style={{
                    ...inputStyle(!!fieldErrors.phone),
                    paddingLeft: selectedPhoneData.code
                      ? "4.5rem"
                      : "1rem",
                  }}
                  placeholder={
                    selectedPhoneData.code
                      ? selectedPhoneData.placeholder.replace(
                        selectedPhoneData.code,
                        ""
                      ).trim()
                      : selectedPhoneData.placeholder
                  }
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>

              {fieldErrors.phone && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "#e05050" }}
                >
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  style={{
                    ...inputStyle(!!fieldErrors.password),
                    paddingRight: "3rem",
                  }}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((visible) => !visible)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#9090a8",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={1.8} />
                  ) : (
                    <Eye size={18} strokeWidth={1.8} />
                  )}
                </button>
              </div>

              {fieldErrors.password && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "#e05050" }}
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  style={{
                    ...inputStyle(
                      !!fieldErrors.confirmPassword
                    ),
                    paddingRight: "3rem",
                  }}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (visible) => !visible
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#9090a8",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} strokeWidth={1.8} />
                  ) : (
                    <Eye size={18} strokeWidth={1.8} />
                  )}
                </button>
              </div>

              {fieldErrors.confirmPassword && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "#e05050" }}
                >
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <div className="pt-2">

              <label className="flex items-start gap-3 cursor-pointer">

                <input
                  type="checkbox"
                  name="agreed"
                  checked={form.agreed}
                  onChange={handleChange}
                  className="mt-0.5 flex-shrink-0"
                  style={{ accentColor: "#d4a017" }}
                />

                <span
                  className="text-xs leading-relaxed"
                  style={{ color: "#9090a8" }}
                >
                  I have read and agree to the{" "}
                  <Link
                    to="/terms"
                    style={{ color: "#d4a017" }}
                  >
                    Terms of Service
                  </Link>
                  ,{" "}
                  <Link
                    to="/privacy"
                    style={{ color: "#d4a017" }}
                  >
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link
                    to="/risk-disclosure"
                    style={{ color: "#d4a017" }}
                  >
                    Risk Disclosure
                  </Link>
                  . I understand that investment involves risk and
                  returns are not guaranteed.
                </span>

              </label>

              {fieldErrors.agreed && (
                <p
                  className="text-xs mt-2"
                  style={{ color: "#e05050" }}
                >
                  {fieldErrors.agreed}
                </p>
              )}

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-sm font-bold tracking-wide transition-all mt-2"
              style={{
                background: loading ? "#a07c10" : "#d4a017",
                color: "#09090e",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>

          </form>
        </div>

        <p
          className="text-center text-sm mt-6"
          style={{ color: "#9090a8" }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "#d4a017", fontWeight: 600 }}
          >
            Sign in →
          </Link>
        </p>

      </div>
    </div>
  );
}