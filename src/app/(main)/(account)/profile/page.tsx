// app/(main)/(account)/profile/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  AtSign,
  Shield,
  Calendar,
  Clock,
  Camera,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

import {
  getUserProfile,
  uploadProfileImage,
  updateProfile,
  changePassword,
} from "@/lib/actions/profile";

import type { UserProfile } from "@/lib/types/profile";

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  SYSTEM: "System",
  ORGANIZER: "Organizer",
  CO_ORGANIZER: "Co-Organizer",
  STAFF: "Staff",
  USER: "User",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatJoinDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Shared UI Components ────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] shadow-sm overflow-hidden",
        className,
      )}
    >
      <div className="px-6 py-4 border-b border-[hsl(214.3,31.8%,91.4%)] shrink-0">
        <h2 className="font-primary text-base font-semibold text-[hsl(222.2,47.4%,11.2%)]">
          {title}
        </h2>
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[hsl(270,70%,97%)] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[hsl(270,70%,50%)]" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-secondary text-[11px] uppercase tracking-wide text-[hsl(215.4,16.3%,46.9%)] mb-0.5">
          {label}
        </p>
        <div className="font-secondary text-sm text-[hsl(222.2,47.4%,11.2%)] flex items-center gap-2 flex-wrap">
          {value}
        </div>
      </div>
    </div>
  );
}

interface FormInputProps {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  rightElement?: React.ReactNode;
}

function FormInput({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  maxLength,
  rightElement,
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-secondary text-xs font-medium text-[hsl(215.4,16.3%,46.9%)] uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215.4,16.3%,46.9%)] pointer-events-none z-10"
          aria-hidden="true"
        />
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            "font-secondary pl-10 py-2.5 h-auto text-sm rounded-xl border-2 bg-[hsl(210,40%,98%)]",
            "text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)]",
            "focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]",
            "border-[hsl(214.3,31.8%,91.4%)] disabled:opacity-50 disabled:cursor-not-allowed",
            rightElement && "pr-10",
          )}
        />
        {rightElement}
      </div>
    </div>
  );
}

// ─── Avatar Section ──────────────────────────────────────────────────────────

interface AvatarSectionProps {
  profile: UserProfile;
  onImageChange: (newUrl: string) => void;
}

function AvatarSection({ profile, onImageChange }: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);

        const result = await uploadProfileImage(fd);

        if (result.success && result.imageUrl) {
          onImageChange(result.imageUrl);
          Toast("Success", result.message, "success");
        } else {
          Toast("Error", result.message, "error");
        }
      } catch {
        Toast("Error", "Failed to upload image.", "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onImageChange],
  );

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative shrink-0 mb-3">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[hsl(214.3,31.8%,91.4%)] bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
          {profile.image_url ? (
            <Image
              src={profile.image_url}
              alt={`${profile.name} avatar`}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-primary text-2xl font-bold text-white">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[hsl(270,70%,50%)] text-white flex items-center justify-center shadow-md hover:bg-[hsl(270,70%,45%)] transition-colors disabled:opacity-60"
          aria-label="Change profile photo"
        >
          {uploading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Camera className="w-3 h-3" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
          aria-hidden="true"
        />
      </div>

      <h3 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)] leading-tight">
        {profile.name}
      </h3>
      <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mt-0.5">
        @{profile.username}
      </p>
      <span className="font-secondary inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(270,70%,97%)] text-[hsl(270,70%,50%)]">
        <Shield className="w-3 h-3" aria-hidden="true" />
        {ROLE_LABEL[profile.role] ?? profile.role}
      </span>

      <div className="w-full border-t border-[hsl(214.3,31.8%,91.4%)] mt-4 mb-3" />

      <div className="w-full flex flex-col gap-3 text-left">
        <ProfileField
          icon={Mail}
          label="Email"
          value={
            <>
              <span className="truncate">{profile.email}</span>
              {profile.is_email_verified ? (
                <span className="font-secondary inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(142,71%,94%)] text-[hsl(142,71%,30%)] shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5" aria-hidden="true" />{" "}
                  Verified
                </span>
              ) : (
                <span className="font-secondary inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(25,95%,93%)] text-[hsl(25,95%,35%)] shrink-0">
                  Unverified
                </span>
              )}
            </>
          }
        />
        <ProfileField
          icon={Phone}
          label="Mobile"
          value={
            <>
              <span className="truncate">{profile.mobile || "—"}</span>
              {profile.mobile &&
                (profile.is_mobile_verified ? (
                  <span className="font-secondary inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(142,71%,94%)] text-[hsl(142,71%,30%)] shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5" aria-hidden="true" />{" "}
                    Verified
                  </span>
                ) : (
                  <span className="font-secondary inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(25,95%,93%)] text-[hsl(25,95%,35%)] shrink-0">
                    Unverified
                  </span>
                ))}
            </>
          }
        />
        <ProfileField
          icon={CheckCircle2}
          label="Account Status"
          value={
            profile.is_active ? (
              <span className="font-secondary inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(142,71%,94%)] text-[hsl(142,71%,30%)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(142,71%,40%)] shrink-0" />
                Active
              </span>
            ) : (
              <span className="font-secondary inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(0,86%,94%)] text-[hsl(0,72%,38%)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(0,72%,50%)] shrink-0" />
                Inactive
              </span>
            )
          }
        />
        <ProfileField
          icon={Calendar}
          label="Member Since"
          value={
            <span className="truncate">
              {formatJoinDate(profile.created_at)}
            </span>
          }
        />
        <ProfileField
          icon={Clock}
          label="Last Login"
          value={
            <span className="truncate">
              {formatLastLogin(profile.last_login_at)}
            </span>
          }
        />
      </div>
    </div>
  );
}

// ─── Edit Profile Form ───────────────────────────────────────────────────────

interface EditProfileFormProps {
  profile: UserProfile;
  onSuccess: (updated: Partial<UserProfile>) => void;
}

function EditProfileForm({ profile, onSuccess }: EditProfileFormProps) {
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [mobile, setMobile] = useState(profile.mobile);
  const [saving, setSaving] = useState(false);

  const isDirty =
    name !== profile.name ||
    username !== profile.username ||
    mobile !== profile.mobile;

  const handleReset = useCallback(() => {
    setName(profile.name);
    setUsername(profile.username);
    setMobile(profile.mobile);
  }, [profile.name, profile.username, profile.mobile]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const result = await updateProfile({
          name,
          username,
          mobile,
          image_url: profile.image_url,
        });

        if (result.success) {
          Toast("Success", result.message, "success");
          onSuccess({ name, username, mobile });
        } else {
          Toast("Error", result.message, "error");
        }
      } catch {
        Toast("Error", "Failed to update profile.", "error");
      } finally {
        setSaving(false);
      }
    },
    [name, username, mobile, profile.image_url, onSuccess],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <FormInput
        icon={User}
        label="Full Name"
        value={name}
        onChange={setName}
        placeholder="Your full name"
      />
      <FormInput
        icon={AtSign}
        label="Username"
        value={username}
        onChange={(v) =>
          setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))
        }
        placeholder="your_username"
      />
      <FormInput
        icon={Mail}
        label="Email"
        value={profile.email}
        onChange={() => {}}
        disabled
        type="email"
        placeholder="Email cannot be changed"
      />
      <FormInput
        icon={Phone}
        label="Mobile"
        value={mobile}
        onChange={(v) => setMobile(v.replace(/\D/g, ""))}
        placeholder="07XXXXXXXX"
        maxLength={10}
        type="tel"
      />

      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          onClick={handleReset}
          disabled={saving || !isDirty}
          className="h-auto py-3 flex-1 rounded-xl font-primary font-medium text-sm shadow-sm border border-[hsl(214.3,31.8%,91.4%)] bg-white text-[hsl(215.4,16.3%,46.9%)] hover:bg-[hsl(210,40%,97%)] hover:text-[hsl(222.2,47.4%,11.2%)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={saving || !isDirty}
          className="h-auto py-3 flex-[2] rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Change Password Form ────────────────────────────────────────────────────

function ChangePasswordForm({ onCancel }: { onCancel: () => void }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const result = await changePassword(formData);

        if (result.success) {
          Toast("Success", result.message, "success");
          setFormData({ currentPassword: "", newPassword: "" });
          onCancel();
        } else {
          Toast("Error", result.message, "error");
        }
      } catch {
        Toast("Error", "Failed to change password.", "error");
      } finally {
        setSaving(false);
      }
    },
    [formData, onCancel],
  );

  const toggleButton = (show: boolean, onToggle: () => void, label: string) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,47.4%,11.2%)] transition-colors"
      aria-label={label}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <FormInput
        icon={Lock}
        label="Current Password"
        value={formData.currentPassword}
        onChange={(v) => handleChange("currentPassword", v)}
        type={showCurrent ? "text" : "password"}
        placeholder="Enter current password"
        rightElement={toggleButton(
          showCurrent,
          () => setShowCurrent((p) => !p),
          "Toggle current password",
        )}
      />
      <FormInput
        icon={Lock}
        label="New Password"
        value={formData.newPassword}
        onChange={(v) => handleChange("newPassword", v)}
        type={showNew ? "text" : "password"}
        placeholder="Min. 6 characters"
        rightElement={toggleButton(
          showNew,
          () => setShowNew((p) => !p),
          "Toggle new password",
        )}
      />

      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          onClick={() => {
            setFormData({ currentPassword: "", newPassword: "" });
            onCancel();
          }}
          disabled={saving}
          className="h-auto py-3 flex-1 rounded-xl font-primary font-medium text-sm shadow-sm border border-[hsl(214.3,31.8%,91.4%)] bg-white text-[hsl(215.4,16.3%,46.9%)] hover:bg-[hsl(210,40%,97%)] hover:text-[hsl(222.2,47.4%,11.2%)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="h-auto py-3 flex-[2] rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-70"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Change Password"
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Page Skeleton ───────────────────────────────────────────────────────────

function ProfilePageSkeleton() {
  return (
    <div
      aria-label="Loading profile"
      role="status"
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start animate-pulse"
    >
      <span className="sr-only">Loading profile...</span>

      <div className="lg:col-span-5">
        <div className="bg-white rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[hsl(214.3,31.8%,91.4%)]">
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>
          <div className="p-5 flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-2xl bg-gray-200" />
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-100" />
            <div className="h-5 w-16 rounded-full bg-gray-100" />
            <div className="w-full border-t border-[hsl(214.3,31.8%,91.4%)]" />
            <div className="w-full flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="h-2.5 w-10 rounded bg-gray-100" />
                    <div className="h-3.5 w-36 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 h-full">
        <div className="bg-white rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] shadow-sm overflow-hidden h-full">
          <div className="px-6 py-4 border-b border-[hsl(214.3,31.8%,91.4%)]">
            <div className="h-4 w-28 rounded bg-gray-200" />
          </div>
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-2.5 w-20 rounded bg-gray-100" />
                <div className="h-10 w-full rounded-xl bg-gray-100" />
              </div>
            ))}
            <div className="h-11 w-full rounded-xl bg-gray-200 mt-1" />
            <div className="border-t border-[hsl(214.3,31.8%,91.4%)] mt-3 pt-4 flex justify-end">
              <div className="h-4 w-32 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const result = await getUserProfile();

        if (!cancelled) {
          if (result.success && result.profile) {
            setProfile(result.profile);
          } else {
            Toast("Error", result.message, "error");
          }
        }
      } catch {
        if (!cancelled) Toast("Error", "Failed to load profile.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileUpdate = useCallback((updated: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
  }, []);

  const handleImageChange = useCallback((imageUrl: string) => {
    setProfile((prev) => (prev ? { ...prev, image_url: imageUrl } : prev));
  }, []);

  return (
    <section className="w-full min-h-[80dvh] bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-24 pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-7">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                My{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                  Profile
                </span>
              </h1>
              <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
            </div>
          </div>
        </div>

        {loading ? (
          <ProfilePageSkeleton />
        ) : !profile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center px-4 w-full"
            role="status"
          >
            <User
              className="w-16 sm:w-20 h-16 sm:h-20 mb-4 text-[hsl(215.4,16.3%,46.9%)] opacity-50"
              aria-hidden="true"
            />
            <h3 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-2">
              Profile Unavailable
            </h3>
            <p className="font-secondary text-base sm:text-lg text-[hsl(215.4,16.3%,46.9%)] max-w-md mx-auto">
              We couldn&apos;t load your profile. Please refresh the page to try
              again.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="lg:col-span-5 h-full"
            >
              <SectionCard
                title="Profile Overview"
                className="h-full flex flex-col"
              >
                <AvatarSection
                  profile={profile}
                  onImageChange={handleImageChange}
                />
              </SectionCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.06 }}
              className="lg:col-span-7 h-full"
            >
              <SectionCard
                title="Edit Profile"
                className="h-full flex flex-col"
                bodyClassName="flex-1 flex flex-col"
              >
                <div className="flex flex-col flex-1">
                  <EditProfileForm
                    profile={profile}
                    onSuccess={handleProfileUpdate}
                  />

                  <div className="flex-1" />

                  <div className="border-t border-[hsl(214.3,31.8%,91.4%)] mt-4 pt-4">
                    {showPasswordForm ? (
                      <>
                        <p className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-3">
                          Change Password
                        </p>
                        <ChangePasswordForm
                          onCancel={() => setShowPasswordForm(false)}
                        />
                      </>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowPasswordForm(true)}
                          className="inline-flex items-center gap-1.5 font-secondary text-xs font-medium text-[hsl(270,70%,50%)] hover:text-[hsl(270,70%,40%)] transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                          Change Password
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
