// app/(main)/(account)/profile/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, AtSign, Shield, Calendar,
  Camera, Loader2, Lock, Eye, EyeOff, CheckCircle2,
} from 'lucide-react';

import { cn } from '@/lib/ui/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';

import {
  getUserProfile,
  uploadProfileImage,
  updateProfile,
  changePassword,
} from '@/lib/actions/profile';

import type { UserProfile } from '@/lib/types/profile';

const ROLE_LABEL: Record<string, string> = {
  SYSTEM: 'System',
  ORGANIZER: 'Organizer',
  CO_ORGANIZER: 'Co-Organizer',
  STAFF: 'Staff',
  USER: 'User',
};

function formatJoinDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[hsl(214.3,31.8%,91.4%)]">
        <h2 className="font-primary text-base font-semibold text-[hsl(222.2,47.4%,11.2%)]">
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
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
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[hsl(270,70%,97%)] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[hsl(270,70%,50%)]" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-secondary text-[11px] uppercase tracking-wide text-[hsl(215.4,16.3%,46.9%)] mb-0.5">
          {label}
        </p>
        <p className="font-secondary text-sm text-[hsl(222.2,47.4%,11.2%)] truncate">{value}</p>
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
  type = 'text',
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
            'font-secondary pl-10 py-2.5 h-auto text-sm rounded-xl border-2 bg-[hsl(210,40%,98%)]',
            'text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)]',
            'focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]',
            'border-[hsl(214.3,31.8%,91.4%)] disabled:opacity-50 disabled:cursor-not-allowed',
            rightElement && 'pr-10'
          )}
        />
        {rightElement}
      </div>
    </div>
  );
}

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
        fd.append('file', file);
        const result = await uploadProfileImage(fd);
        if (result.success && result.imageUrl) {
          onImageChange(result.imageUrl);
          Toast('Success', result.message, 'success');
        } else {
          Toast('Error', result.message, 'error');
        }
      } catch {
        Toast('Error', 'Failed to upload image.', 'error');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [onImageChange]
  );

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[hsl(214.3,31.8%,91.4%)] bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
          {profile.image_url ? (
            <Image
              src={profile.image_url}
              alt={`${profile.name} avatar`}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-primary text-3xl font-bold text-white">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[hsl(270,70%,50%)] text-white flex items-center justify-center shadow-md hover:bg-[hsl(270,70%,45%)] transition-colors disabled:opacity-60"
          aria-label="Change profile photo"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
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

      <div className="text-center sm:text-left">
        <h1 className="font-primary text-xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
          {profile.name}
        </h1>
        <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mt-0.5">
          @{profile.username}
        </p>
        <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(270,70%,97%)] text-[hsl(270,70%,50%)]">
          <Shield className="w-3 h-3" />
          {ROLE_LABEL[profile.role] ?? profile.role}
        </span>
      </div>
    </div>
  );
}

interface EditProfileFormProps {
  profile: UserProfile;
  onSuccess: (updated: Partial<UserProfile>) => void;
}

function EditProfileForm({ profile, onSuccess }: EditProfileFormProps) {
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [mobile, setMobile] = useState(profile.mobile);
  const [saving, setSaving] = useState(false);

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
          Toast('Success', result.message, 'success');
          onSuccess({ name, username, mobile });
        } else {
          Toast('Error', result.message, 'error');
        }
      } catch {
        Toast('Error', 'Failed to update profile.', 'error');
      } finally {
        setSaving(false);
      }
    },
    [name, username, mobile, profile.image_url, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        onChange={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
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
        onChange={(v) => setMobile(v.replace(/\D/g, ''))}
        placeholder="07XXXXXXXX"
        maxLength={10}
        type="tel"
      />

      <Button
        type="submit"
        disabled={saving}
        className="mt-2 h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-70"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
      </Button>
    </form>
  );
}

function ChangePasswordForm() {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const result = await changePassword(formData);
        if (result.success) {
          Toast('Success', result.message, 'success');
          setFormData({ currentPassword: '', newPassword: '' });
        } else {
          Toast('Error', result.message, 'error');
        }
      } catch {
        Toast('Error', 'Failed to change password.', 'error');
      } finally {
        setSaving(false);
      }
    },
    [formData]
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormInput
        icon={Lock}
        label="Current Password"
        value={formData.currentPassword}
        onChange={(v) => handleChange('currentPassword', v)}
        type={showCurrent ? 'text' : 'password'}
        placeholder="Enter current password"
        rightElement={toggleButton(showCurrent, () => setShowCurrent((p) => !p), 'Toggle current password')}
      />
      <FormInput
        icon={Lock}
        label="New Password"
        value={formData.newPassword}
        onChange={(v) => handleChange('newPassword', v)}
        type={showNew ? 'text' : 'password'}
        placeholder="Min. 6 characters"
        rightElement={toggleButton(showNew, () => setShowNew((p) => !p), 'Toggle new password')}
      />

      <Button
        type="submit"
        disabled={saving}
        className="mt-2 h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-70"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Password'}
      </Button>
    </form>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
            Toast('Error', result.message, 'error');
          }
        }
      } catch {
        if (!cancelled) Toast('Error', 'Failed to load profile.', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const handleProfileUpdate = useCallback((updated: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
  }, []);

  const handleImageChange = useCallback((imageUrl: string) => {
    setProfile((prev) => (prev ? { ...prev, image_url: imageUrl } : prev));
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-[80dvh] flex items-center justify-center pt-28">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(270,70%,50%)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full min-h-[80dvh] flex items-center justify-center pt-28">
        <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
          Failed to load profile. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <section className="w-full min-h-[80dvh] bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-28 sm:pt-32 pb-16">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            My{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
              Profile
            </span>
          </h1>
          <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
        </div>

        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <SectionCard title="Profile Overview">
              <AvatarSection profile={profile} onImageChange={handleImageChange} />

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProfileField icon={Mail} label="Email" value={profile.email} />
                <ProfileField
                  icon={Phone}
                  label="Mobile"
                  value={profile.mobile ? `${profile.mobile}${profile.is_mobile_verified ? ' ✓' : ''}` : '—'}
                />
                <ProfileField
                  icon={CheckCircle2}
                  label="Account Status"
                  value={profile.is_active ? 'Active' : 'Inactive'}
                />
                <ProfileField
                  icon={Calendar}
                  label="Member Since"
                  value={formatJoinDate(profile.created_at)}
                />
              </div>
            </SectionCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <SectionCard title="Edit Profile">
              <EditProfileForm profile={profile} onSuccess={handleProfileUpdate} />
            </SectionCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <SectionCard title="Change Password">
              <ChangePasswordForm />
            </SectionCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}