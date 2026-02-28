'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  AtSign,
  Shield,
  CalendarDays,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  X,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';
import {
  getUserProfile,
  updateProfile,
  changePassword,
  type UserProfile,
} from '@/lib/actions/profile';

// ─── Shared color tokens (matching Header.tsx & auth pages) ─────────────────

const cn = {
  textPrimary: 'text-[hsl(222.2,47.4%,11.2%)]',
  textMuted: 'text-[hsl(215.4,16.3%,46.9%)]',
  accent: 'text-[hsl(270,70%,50%)]',
  bgCard: 'bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.08),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.04)]',
  inputBase:
    'font-secondary pl-11 py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]',
  inputReadonly:
    'font-secondary pl-11 py-3 rounded-xl h-auto text-sm bg-[hsl(210,40%,96.1%)] border-2 border-[hsl(214.3,31.8%,91.4%)] text-[hsl(222.2,47.4%,11.2%)] cursor-not-allowed opacity-70',
  btnGradient:
    'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]',
  textGradient:
    'bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]',
  bgGradient:
    'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]',
} as const;

// ─── Sub-components ─────────────────────────────────────────────────────────

function ProfileAvatar({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={96}
        height={96}
        className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
      />
    );
  }
  return (
    <div
      className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg ${cn.bgGradient}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${cn.bgGradient}`}
      >
        <Icon className="w-4 h-4 text-white" aria-hidden="true" />
      </div>
      <h2
        className={`font-primary text-lg sm:text-xl font-semibold ${cn.textPrimary}`}
      >
        {title}
      </h2>
    </div>
  );
}

function ReadOnlyField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Label className={`font-secondary text-xs mb-1.5 block ${cn.textMuted}`}>
        {label}
      </Label>
      <div className="relative">
        <Icon
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215.4,16.3%,46.9%)] pointer-events-none"
          aria-hidden="true"
        />
        <Input value={value} disabled className={cn.inputReadonly} />
      </div>
    </div>
  );
}

// ─── Page loading skeleton ──────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Avatar skeleton */}
      <div className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-gray-200" />
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-4 w-48 rounded bg-gray-100" />
        </div>
      </div>

      {/* Info card skeleton */}
      <div className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
          <div className="h-5 w-40 rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-gray-100" />
              <div className="h-10 w-full rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Security card skeleton */}
      <div className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
          <div className="h-5 w-24 rounded bg-gray-200" />
        </div>
        <div className="h-4 w-72 rounded bg-gray-100" />
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable form state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ─── Data fetching ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const res = await getUserProfile();
      if (cancelled) return;

      if (res.success && res.data) {
        setProfile(res.data);
        setName(res.data.name);
        setMobile(res.data.mobile);
        setImageUrl(res.data.image_url ?? '');
      } else {
        Toast('Error', res.message, 'error');
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleCancelEdit = useCallback(() => {
    if (!profile) return;
    setName(profile.name);
    setMobile(profile.mobile);
    setImageUrl(profile.image_url ?? '');
    setEditing(false);
  }, [profile]);

  const handleSaveProfile = useCallback(async () => {
    setSaving(true);
    try {
      const res = await updateProfile({
        name,
        mobile,
        image_url: imageUrl || null,
      });

      if (res.success) {
        Toast('Success', res.message, 'success');
        setProfile((prev) =>
          prev ? { ...prev, name: name.trim(), mobile, image_url: imageUrl || null } : prev
        );
        setEditing(false);
      } else {
        Toast('Error', res.message, 'error');
      }
    } catch {
      Toast('Error', 'An unexpected error occurred.', 'error');
    } finally {
      setSaving(false);
    }
  }, [name, mobile, imageUrl]);

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      Toast('Error', 'New passwords do not match.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        Toast('Success', res.message, 'success');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Toast('Error', res.message, 'error');
      }
    } catch {
      Toast('Error', 'An unexpected error occurred.', 'error');
    } finally {
      setChangingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const focused = (field: string) => focusedField === field;

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <section className="w-full min-h-[80dvh] bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-28 sm:pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
        {/* Page header */}
        <div>
          <h1
            className={`font-primary text-2xl sm:text-3xl font-semibold ${cn.textPrimary}`}
          >
            My <span className={cn.textGradient}>Profile</span>
          </h1>
          <div className={`h-1.5 w-20 rounded-full mt-2 ${cn.bgGradient}`} />
        </div>

        {loading ? (
          <ProfileSkeleton />
        ) : !profile ? (
          <div className="text-center py-20">
            <p className={`font-secondary text-base ${cn.textMuted}`}>
              Unable to load profile. Please try again.
            </p>
          </div>
        ) : (
          <>
            {/* ── Avatar card ────────────────────────────────────────── */}
            <div
              className={`rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] p-6 sm:p-8 ${cn.bgCard}`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <ProfileAvatar
                    imageUrl={profile.image_url}
                    name={profile.name}
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Enter image URL:');
                        if (url !== null) setImageUrl(url);
                      }}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-[hsl(214.3,31.8%,91.4%)] flex items-center justify-center shadow-sm hover:bg-[hsl(210,40%,96.1%)] transition-colors"
                      aria-label="Change profile picture"
                    >
                      <Camera className="w-3.5 h-3.5 text-[hsl(270,70%,50%)]" />
                    </button>
                  )}
                </div>
                <div className="text-center">
                  <h2
                    className={`font-primary text-lg font-semibold ${cn.textPrimary}`}
                  >
                    {profile.name}
                  </h2>
                  <p className={`font-secondary text-sm ${cn.textMuted}`}>
                    @{profile.username}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Personal info card ─────────────────────────────────── */}
            <div
              className={`rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] p-6 sm:p-8 ${cn.bgCard}`}
            >
              <div className="flex items-center justify-between mb-5">
                <SectionHeading icon={User} title="Personal Information" />
                {!editing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className={`font-secondary text-xs gap-1.5 ${cn.accent} hover:bg-[hsl(270,70%,97%)] hover:text-[hsl(270,70%,50%)]`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="font-secondary text-xs gap-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className={`font-secondary text-xs gap-1 text-white border-none ${cn.btnGradient} transition-all duration-300 disabled:opacity-70`}
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name — editable */}
                <div>
                  <Label
                    className={`font-secondary text-xs mb-1.5 block ${cn.textMuted}`}
                  >
                    Full Name
                  </Label>
                  <div className="relative">
                    <User
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${
                        focused('name')
                          ? 'text-[hsl(270,70%,50%)]'
                          : 'text-[hsl(215.4,16.3%,46.9%)]'
                      }`}
                      aria-hidden="true"
                    />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      disabled={!editing}
                      className={
                        editing
                          ? `${cn.inputBase} ${focused('name') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`
                          : cn.inputReadonly
                      }
                    />
                  </div>
                </div>

                {/* Email — read only */}
                <ReadOnlyField
                  icon={Mail}
                  label="Email"
                  value={profile.email}
                />

                {/* Mobile — editable */}
                <div>
                  <Label
                    className={`font-secondary text-xs mb-1.5 block ${cn.textMuted}`}
                  >
                    Mobile
                  </Label>
                  <div className="relative">
                    <Phone
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${
                        focused('mobile')
                          ? 'text-[hsl(270,70%,50%)]'
                          : 'text-[hsl(215.4,16.3%,46.9%)]'
                      }`}
                      aria-hidden="true"
                    />
                    <Input
                      value={mobile}
                      onChange={(e) =>
                        setMobile(e.target.value.replace(/\D/g, ''))
                      }
                      onFocus={() => setFocusedField('mobile')}
                      onBlur={() => setFocusedField(null)}
                      disabled={!editing}
                      maxLength={10}
                      className={
                        editing
                          ? `${cn.inputBase} ${focused('mobile') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`
                          : cn.inputReadonly
                      }
                    />
                  </div>
                </div>

                {/* Username — read only */}
                <ReadOnlyField
                  icon={AtSign}
                  label="Username"
                  value={`@${profile.username}`}
                />

                {/* Role — read only */}
                <ReadOnlyField
                  icon={Shield}
                  label="Role"
                  value={profile.role}
                />

                {/* Member since — read only */}
                <ReadOnlyField
                  icon={CalendarDays}
                  label="Member Since"
                  value={new Date(profile.created_at).toLocaleDateString(
                    'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                />
              </div>

              {/* Image URL field (visible in edit mode) */}
              {editing && (
                <div className="mt-4">
                  <Label
                    className={`font-secondary text-xs mb-1.5 block ${cn.textMuted}`}
                  >
                    Profile Image URL
                  </Label>
                  <div className="relative">
                    <Camera
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${
                        focused('imageUrl')
                          ? 'text-[hsl(270,70%,50%)]'
                          : 'text-[hsl(215.4,16.3%,46.9%)]'
                      }`}
                      aria-hidden="true"
                    />
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onFocus={() => setFocusedField('imageUrl')}
                      onBlur={() => setFocusedField(null)}
                      className={`${cn.inputBase} ${focused('imageUrl') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Change password card ────────────────────────────────── */}
            <div
              className={`rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] p-6 sm:p-8 ${cn.bgCard}`}
            >
              <div className="flex items-center justify-between mb-2">
                <SectionHeading icon={Lock} title="Security" />
                {!showPasswordForm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswordForm(true)}
                    className={`font-secondary text-xs gap-1.5 ${cn.accent} hover:bg-[hsl(270,70%,97%)] hover:text-[hsl(270,70%,50%)]`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Change Password
                  </Button>
                )}
              </div>

              {!showPasswordForm ? (
                <p className={`font-secondary text-sm ${cn.textMuted}`}>
                  Secure your account by updating your password regularly.
                </p>
              ) : (
                <form
                  onSubmit={handleChangePassword}
                  className="space-y-4 mt-3"
                >
                  {/* Current password */}
                  <div>
                    <Label
                      className={`font-secondary text-xs mb-1.5 block ${cn.textMuted}`}
                    >
                      Current Password
                    </Label>
                    <div className="relative">
                      <Lock
                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${
                          focused('currentPassword')
                            ? 'text-[hsl(270,70%,50%)]'
                            : 'text-[hsl(215.4,16.3%,46.9%)]'
                        }`}
                        aria-hidden="true"
                      />
                      <Input
                        type={showCurrent ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        onFocus={() => setFocusedField('currentPassword')}
                        onBlur={() => setFocusedField(null)}
                        className={`${cn.inputBase} pr-11 ${focused('currentPassword') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCurrent((p) => !p)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-[hsl(215.4,16.3%,46.9%)]"
                        aria-label={
                          showCurrent ? 'Hide password' : 'Show password'
                        }
                      >
                        {showCurrent ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* New password */}
                  <div>
                    <Label
                      className={`font-secondary text-xs mb-1.5 block ${cn.textMuted}`}
                    >
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock
                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${
                          focused('newPassword')
                            ? 'text-[hsl(270,70%,50%)]'
                            : 'text-[hsl(215.4,16.3%,46.9%)]'
                        }`}
                        aria-hidden="true"
                      />
                      <Input
                        type={showNew ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onFocus={() => setFocusedField('newPassword')}
                        onBlur={() => setFocusedField(null)}
                        className={`${cn.inputBase} pr-11 ${focused('newPassword') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowNew((p) => !p)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-[hsl(215.4,16.3%,46.9%)]"
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Confirm new password */}
                  <div>
                    <Label
                      className={`font-secondary text-xs mb-1.5 block ${cn.textMuted}`}
                    >
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Lock
                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${
                          focused('confirmPassword')
                            ? 'text-[hsl(270,70%,50%)]'
                            : 'text-[hsl(215.4,16.3%,46.9%)]'
                        }`}
                        aria-hidden="true"
                      />
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        className={`${cn.inputBase} pr-11 ${focused('confirmPassword') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-[hsl(215.4,16.3%,46.9%)]"
                        aria-label={
                          showConfirm ? 'Hide password' : 'Show password'
                        }
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      disabled={changingPassword}
                      className="font-secondary text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={changingPassword}
                      className={`font-primary text-sm text-white border-none h-auto py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 ${cn.btnGradient}`}
                    >
                      {changingPassword ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    </section>
  );
}
