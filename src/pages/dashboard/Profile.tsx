import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

const countries = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Other",
];

type ProfileData = {
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  phone: string;
};

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    email: "",
    country: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      navigate("/login", { replace: true });
      return;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, country, phone")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile loading error:", profileError);

      setProfile({
        first_name: user.user_metadata?.first_name ?? "",
        last_name: user.user_metadata?.last_name ?? "",
        email: user.email ?? "",
        country: user.user_metadata?.country ?? "",
        phone: user.user_metadata?.phone ?? "",
      });
    } else {
      setProfile({
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        email: data.email ?? user.email ?? "",
        country: data.country ?? "",
        phone: data.phone ?? "",
      });
    }

    setLoading(false);
  }

  function handleChange(
    field: keyof ProfileData,
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login", { replace: true });
        return;
      }

      /*
       * Basic validation
       */
      if (!profile.first_name.trim()) {
        setError("Please enter your first name.");
        return;
      }

      if (!profile.last_name.trim()) {
        setError("Please enter your last name.");
        return;
      }

      if (!profile.email.trim()) {
        setError("Please enter your email address.");
        return;
      }

      if (!profile.country.trim()) {
        setError("Please select your country.");
        return;
      }

      if (!profile.phone.trim()) {
        setError("Please enter your phone number.");
        return;
      }

      /*
       * Update Supabase Auth email if it changed.
       */
      const currentEmail = user.email ?? "";

      if (
        profile.email.trim().toLowerCase() !==
        currentEmail.toLowerCase()
      ) {
        const { error: emailError } =
          await supabase.auth.updateUser({
            email: profile.email.trim(),
          });

        if (emailError) {
          throw new Error(emailError.message);
        }
      }

      /*
       * Update the user's profile record.
       */
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          email: profile.email.trim(),
          country: profile.country.trim(),
          phone: profile.phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      /*
       * Keep user metadata synchronized too.
       */
      const { error: metadataError } =
        await supabase.auth.updateUser({
          data: {
            first_name: profile.first_name.trim(),
            last_name: profile.last_name.trim(),
            country: profile.country.trim(),
            phone: profile.phone.trim(),
          },
        });

      if (metadataError) {
        console.error(
          "Metadata update warning:",
          metadataError
        );
      }

      setMessage("Profile updated successfully.");

      /*
       * Reload the profile from the database so the
       * screen always displays the current saved values.
       */
      await loadProfile();
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className="py-10"
        style={{ color: "#9090a8" }}
      >
        Loading profile...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black">
          Profile
        </h1>

        <p
          className="mt-2 text-sm"
          style={{ color: "#9090a8" }}
        >
          Manage your personal account information.
        </p>
      </div>

      <div
        className="max-w-2xl p-8 border"
        style={{
          background: "#111118",
          borderColor: "rgba(212,160,23,0.15)",
        }}
      >
        <div className="space-y-6">

          {/* FIRST NAME */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "#9090a8" }}
            >
              First Name
            </label>

            <input
              type="text"
              value={profile.first_name}
              onChange={(e) =>
                handleChange(
                  "first_name",
                  e.target.value
                )
              }
              className="w-full px-4 py-3 border outline-none"
              style={{
                background: "#09090e",
                borderColor:
                  "rgba(212,160,23,0.15)",
                color: "#f5f0e8",
              }}
              placeholder="First name"
            />
          </div>

          {/* LAST NAME */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "#9090a8" }}
            >
              Last Name
            </label>

            <input
              type="text"
              value={profile.last_name}
              onChange={(e) =>
                handleChange(
                  "last_name",
                  e.target.value
                )
              }
              className="w-full px-4 py-3 border outline-none"
              style={{
                background: "#09090e",
                borderColor:
                  "rgba(212,160,23,0.15)",
                color: "#f5f0e8",
              }}
              placeholder="Last name"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "#9090a8" }}
            >
              Email Address
            </label>

            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                handleChange(
                  "email",
                  e.target.value
                )
              }
              className="w-full px-4 py-3 border outline-none"
              style={{
                background: "#09090e",
                borderColor:
                  "rgba(212,160,23,0.15)",
                color: "#f5f0e8",
              }}
              placeholder="Email address"
            />

            <p
              className="mt-2 text-xs"
              style={{ color: "#777789" }}
            >
              Changing your email may require confirmation
              from your new email address.
            </p>
          </div>

          {/* COUNTRY */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "#9090a8" }}
            >
              Country
            </label>

            <select
              value={profile.country}
              onChange={(e) =>
                handleChange(
                  "country",
                  e.target.value
                )
              }
              className="w-full px-4 py-3 border outline-none"
              style={{
                background: "#09090e",
                borderColor:
                  "rgba(212,160,23,0.15)",
                color: "#f5f0e8",
              }}
            >
              <option value="">
                Select your country
              </option>

              {countries.map((country) => (
                <option
                  key={country}
                  value={country}
                >
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* PHONE */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "#9090a8" }}
            >
              Phone Number
            </label>

            <input
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                handleChange(
                  "phone",
                  e.target.value
                )
              }
              className="w-full px-4 py-3 border outline-none"
              style={{
                background: "#09090e",
                borderColor:
                  "rgba(212,160,23,0.15)",
                color: "#f5f0e8",
              }}
              placeholder="+1 4801345678"
            />
          </div>

          {/* ERROR */}
          {error && (
            <div
              className="px-4 py-3 text-sm border"
              style={{
                background: "rgba(220,38,38,0.08)",
                borderColor:
                  "rgba(220,38,38,0.25)",
                color: "#f87171",
              }}
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {message && (
            <div
              className="px-4 py-3 text-sm border"
              style={{
                background:
                  "rgba(34,197,94,0.08)",
                borderColor:
                  "rgba(34,197,94,0.25)",
                color: "#4ade80",
              }}
            >
              {message}
            </div>
          )}

          {/* SAVE */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 font-bold transition-opacity"
            style={{
              background: "#d4a017",
              color: "#09090e",
              opacity: saving ? 0.6 : 1,
              cursor: saving
                ? "not-allowed"
                : "pointer",
            }}
          >
            {saving
              ? "Saving Changes..."
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}