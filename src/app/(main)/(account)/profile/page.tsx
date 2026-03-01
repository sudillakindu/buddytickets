'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AtSign, CalendarDays, Camera, Eye, EyeOff, Loader2, Lock, LogOut, Mail,
  Pencil, Phone, Shield, User, X,
} from 'lucide-react';

import { cn } from '@/lib/ui/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';

import {
  changePassword, getUserProfile, updateProfile, uploadProfileImage, type UserProfile,
} from '@/lib/actions/profile';
import { signOut } from '@/lib/actions/auth';

const formatDateTime = (value: string | null): string => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({ name: '', username: '', mobile: '', imageUrl: '' });
  const [isSaving, setIsSaving] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const result = await getUserProfile();
        if (!isMounted) return;

        if (result.success && result.profile) {
          setProfile(result.profile);
          setEditForm({
            name: result.profile.name,
            username: result.profile.username,
            mobile: result.profile.mobile,
            imageUrl: result.profile.image_url ?? '',
          });
        } else {
          Toast('Error', result.message, 'error');
        }
      } catch {
        if (isMounted) Toast('Error', 'Failed to load profile.', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfile();
    
    return () => { 
      isMounted = false; 
    };
  }, []);

  const handleEditChange = useCallback((field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePasswordChange = useCallback((field: keyof typeof passwordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  }, []);

  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    try {
      let finalImageUrl = editForm.imageUrl;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        const uploadResult = await uploadProfileImage(formData);
        
        if (uploadResult.success && uploadResult.imageUrl) {
          finalImageUrl = uploadResult.imageUrl;
          setEditForm((prev) => ({ ...prev, imageUrl: finalImageUrl }));
        } else {
          Toast('Error', uploadResult.message || 'Image upload failed', 'error');
          setIsSaving(false);
          return;
        }
      }

      const updateResult = await updateProfile({
        name: editForm.name,
        username: editForm.username,
        mobile: editForm.mobile,
        image_url: finalImageUrl || null,
      });

      if (updateResult.success) {
        Toast('Success', updateResult.message, 'success');
        setProfile((prev) => prev ? {
          ...prev,
          name: editForm.name.trim(),
          username: editForm.username.trim().toLowerCase(),
          mobile: editForm.mobile,
          is_mobile_verified: editForm.mobile !== prev.mobile ? false : prev.is_mobile_verified,
          image_url: finalImageUrl || null,
        } : prev);
        closeEditModal();
      } else {
        Toast('Error', updateResult.message, 'error');
      }
    } catch {
      Toast('Error', 'An unexpected error occurred.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [editForm, profile, selectedImage]);

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    try {
      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (result.success) {
        Toast('Success', result.message, 'success');
        closePasswordModal();
      } else {
        Toast('Error', result.message, 'error');
      }
    } catch {
      Toast('Error', 'An unexpected error occurred.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordForm]);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      window.location.href = '/sign-in';
    } catch {
      Toast('Error', 'Failed to sign out. Please try again.', 'error');
      setIsSigningOut(false);
    }
  }, []);

  const openEditModal = useCallback(() => {
    if (profile) {
      setEditForm({ name: profile.name, username: profile.username, mobile: profile.mobile, imageUrl: profile.image_url ?? '' });
      setSelectedImage(null);
      setImagePreviewUrl(null);
    }
    setIsEditModalOpen(true);
  }, [profile]);

  const closeEditModal = useCallback(() => {
    if (!isSaving) {
      setIsEditModalOpen(false);
      setSelectedImage(null);
      setImagePreviewUrl(null);
    }
  }, [isSaving]);

  const openPasswordModal = useCallback(() => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsPasswordModalOpen(true);
  }, []);

  const closePasswordModal = useCallback(() => {
    if (!isChangingPassword) {
      setIsPasswordModalOpen(false);
    }
  }, [isChangingPassword]);

  const displayName = profile?.name || '';
  const displayUsername = profile?.username || '';
  const displayImageUrl = profile?.image_url || null;
  const editAvatarUrl = imagePreviewUrl || editForm.imageUrl || displayImageUrl;

  const hasChanges = profile ? (
    editForm.name !== profile.name ||
    editForm.username !== profile.username ||
    editForm.mobile !== profile.mobile ||
    selectedImage !== null
  ) : false;

  return (
    <section className="w-full min-h-[80dvh] bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-28 pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 sm:mb-10">
          <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            My <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">Profile</span>
          </h1>
          <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
        </div>

        {isLoading ? (
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full">
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-gray-200 to-gray-300" />
                <div className="px-6 pb-6 flex flex-col items-center -mt-10 gap-3">
                  <div className="w-20 h-20 rounded-full bg-gray-300 ring-4 ring-white" />
                  <div className="h-5 w-32 rounded-md bg-gray-200" />
                  <div className="h-4 w-24 rounded-md bg-gray-100" />
                  <div className="w-full mt-2 space-y-2.5">
                    <div className="h-11 w-full rounded-xl bg-gray-200" />
                    <div className="h-11 w-full rounded-xl bg-gray-100" />
                    <div className="h-11 w-full rounded-xl bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-200" />
                  <div className="h-5 w-40 rounded-md bg-gray-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-3 w-20 rounded bg-gray-100" />
                      <div className="h-10 w-full rounded-xl bg-gray-100" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : !profile ? (
          <div className="text-center py-20">
            <p className="font-secondary text-base text-[hsl(215.4,16.3%,46.9%)]">
              Unable to load profile. Please try again.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full lg:items-stretch">
            {/* Sidebar */}
            <aside className="lg:col-span-4 h-full">
              <input 
                ref={imageInputRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageSelect} 
              />
              <div className="h-full rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.15),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.05)] overflow-hidden">
                <div className="h-24 bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] via-[hsl(255,65%,35%)] to-[hsl(270,70%,50%)] relative">
                  <div 
                    className="absolute inset-0 opacity-20" 
                    style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
                  />
                </div>
                <div className="px-6 pb-6 flex flex-col items-center">
                  <div className="relative -mt-10 mb-3">
                    {displayImageUrl ? (
                      <Image 
                        src={displayImageUrl} 
                        alt={displayName} 
                        width={96} 
                        height={96} 
                        className="w-24 h-24 text-3xl rounded-full object-cover ring-4 ring-white shadow-lg" 
                      />
                    ) : (
                      <div className="w-24 h-24 text-3xl rounded-full flex items-center justify-center text-white font-bold ring-4 ring-white shadow-lg bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                        {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                  </div>

                  <h2 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)] text-center leading-tight">
                    {displayName}
                  </h2>
                  <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] text-center mb-2">
                    @{displayUsername}
                  </p>

                  <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-secondary font-medium bg-[hsl(270,70%,96%)] text-[hsl(270,70%,40%)] border border-[hsl(270,70%,88%)]">
                      <Shield className="w-3 h-3" />
                      {profile.role}
                    </span>
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-secondary font-medium border', profile.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200')}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', profile.is_active ? 'bg-emerald-500' : 'bg-red-500')} />
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="w-full flex flex-col gap-2.5 mt-2">
                    <Button 
                      onClick={openEditModal} 
                      className="w-full h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]"
                    >
                      <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={openPasswordModal} 
                      className="w-full h-auto py-3 rounded-xl font-primary font-medium text-sm border-[hsl(214.3,31.8%,91.4%)] text-[hsl(270,70%,50%)] hover:bg-[hsl(270,70%,97%)] hover:border-[hsl(270,70%,80%)] hover:text-[hsl(270,70%,45%)] transition-all duration-200"
                    >
                      <Lock className="w-4 h-4 mr-2" /> Change Password
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleSignOut} 
                      disabled={isSigningOut} 
                      className="w-full h-auto py-3 rounded-xl font-primary font-medium text-sm border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                    >
                      {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />} 
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-8 h-full">
              <div className="h-full rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] p-6 sm:p-8 bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.15),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.05)] w-full">
                <div className="mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] shadow-sm">
                      <User className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                    <h2 className="font-primary text-lg sm:text-xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">Personal Information</h2>
                  </div>
                  <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-1 ml-[42px]">Your account details and activity</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {[
                    { icon: User, label: 'Full Name', value: profile.name },
                    { icon: Mail, label: 'Email', value: profile.email },
                    { icon: AtSign, label: 'Username', value: profile.username },
                    { icon: Phone, label: 'Mobile', value: profile.mobile || '—' },
                    { icon: Shield, label: 'Role', value: profile.role },
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] flex items-center gap-1.5">
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </span>
                      <span className="font-secondary text-sm leading-snug px-3 py-2.5 rounded-xl bg-[hsl(210,40%,96.1%)] border border-[hsl(214.3,31.8%,91.4%)] text-[hsl(222.2,47.4%,11.2%)] truncate">
                        {item.value}
                      </span>
                    </div>
                  ))}

                  <div className="flex flex-col gap-1">
                    <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Account Status
                    </span>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[hsl(210,40%,96.1%)] border border-[hsl(214.3,31.8%,91.4%)]">
                      <span className={cn('w-2 h-2 rounded-full shrink-0', profile.is_active ? 'bg-emerald-500' : 'bg-red-500')} />
                      <span className={cn('font-secondary text-sm font-medium', profile.is_active ? 'text-emerald-700' : 'text-red-600')}>
                        {profile.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {[
                    { icon: CalendarDays, label: 'Member Since', value: formatDateTime(profile.created_at) },
                    { icon: CalendarDays, label: 'Last Login', value: formatDateTime(profile.last_login_at) },
                  ].map((item, idx) => (
                    <div key={`date-${idx}`} className="flex flex-col gap-1">
                      <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] flex items-center gap-1.5">
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </span>
                      <span className="font-secondary text-sm leading-snug px-3 py-2.5 rounded-xl bg-[hsl(210,40%,96.1%)] border border-[hsl(214.3,31.8%,91.4%)] text-[hsl(222.2,47.4%,11.2%)] truncate">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" 
          onMouseDown={(e) => { 
            if (e.target === e.currentTarget) closeEditModal(); 
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-[0_32px_64px_-12px_hsl(222.2_47.4%_11.2%_/_0.18)] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] shadow-sm">
                    <Pencil className="w-4 h-4 text-white" aria-hidden="true" />
                  </div>
                  <h2 className="font-primary text-lg sm:text-xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                    Edit Profile
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={closeEditModal} 
                  disabled={isSaving} 
                  className="h-8 w-8 rounded-lg text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,47.4%,11.2%)] hover:bg-[hsl(210,40%,96.1%)]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col items-center gap-2 mb-5 pb-5 border-b border-[hsl(214.3,31.8%,91.4%)]">
                <div className="relative">
                  {editAvatarUrl ? (
                    <Image 
                      src={editAvatarUrl} 
                      alt={editForm.name || profile?.name || ''} 
                      width={96} 
                      height={96} 
                      className="w-24 h-24 text-3xl rounded-full object-cover ring-4 ring-white shadow-lg" 
                    />
                  ) : (
                    <div className="w-24 h-24 text-3xl rounded-full flex items-center justify-center text-white font-bold ring-4 ring-white shadow-lg bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                      {(editForm.name || profile?.name || '').charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => imageInputRef.current?.click()} 
                    disabled={isSaving} 
                    className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-white border-2 border-[hsl(214.3,31.8%,91.4%)] flex items-center justify-center shadow-md hover:bg-[hsl(210,40%,96.1%)] transition-colors"
                  >
                    <Camera className="w-3 h-3 text-[hsl(270,70%,50%)]" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="w-full flex flex-col gap-4">
                <div className="w-full space-y-1.5">
                  <Label className="font-secondary text-xs font-medium text-[hsl(215.4,16.3%,46.9%)] ml-1">
                    Full Name
                  </Label>
                  <div className="relative w-full">
                    <User 
                      className={cn(
                        'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none', 
                        activeField === 'name' ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'
                      )} 
                    />
                    <Input 
                      type="text" 
                      placeholder="Full Name" 
                      value={editForm.name} 
                      onChange={(e) => handleEditChange('name', e.target.value)} 
                      onFocus={() => setActiveField('name')} 
                      onBlur={() => setActiveField(null)} 
                      className={cn(
                        'font-secondary py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] w-full pl-11', 
                        activeField === 'name' ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'
                      )} 
                    />
                  </div>
                </div>

                <div className="w-full space-y-1.5">
                  <Label className="font-secondary text-xs font-medium text-[hsl(215.4,16.3%,46.9%)] ml-1">
                    Username
                  </Label>
                  <div className="relative w-full">
                    <span 
                      className={cn(
                        'absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium select-none z-10 pointer-events-none', 
                        activeField === 'username' ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'
                      )}
                    >
                      @
                    </span>
                    <Input 
                      type="text" 
                      placeholder="username" 
                      value={editForm.username} 
                      onChange={(e) => handleEditChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                      onFocus={() => setActiveField('username')} 
                      onBlur={() => setActiveField(null)} 
                      className={cn(
                        'font-secondary py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] w-full pl-9', 
                        activeField === 'username' ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'
                      )} 
                    />
                  </div>
                </div>

                <div className="w-full space-y-1.5">
                  <Label className="font-secondary text-xs font-medium text-[hsl(215.4,16.3%,46.9%)] ml-1">
                    Mobile Number
                  </Label>
                  <div className="relative w-full">
                    <Phone 
                      className={cn(
                        'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none', 
                        activeField === 'mobile' ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'
                      )} 
                    />
                    <Input 
                      type="tel" 
                      placeholder="Mobile (10 digits)" 
                      maxLength={10} 
                      value={editForm.mobile} 
                      onChange={(e) => handleEditChange('mobile', e.target.value.replace(/\D/g, ''))} 
                      onFocus={() => setActiveField('mobile')} 
                      onBlur={() => setActiveField(null)} 
                      className={cn(
                        'font-secondary py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] w-full pl-11', 
                        activeField === 'mobile' ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'
                      )} 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-[hsl(214.3,31.8%,91.4%)]">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={closeEditModal} 
                    disabled={isSaving} 
                    className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] hover:bg-[hsl(210,40%,96.1%)]"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSaving || !editForm.name || !hasChanges} 
                    className="h-10 px-6 rounded-xl font-primary text-sm text-white border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" 
          onMouseDown={(e) => { 
            if (e.target === e.currentTarget) closePasswordModal(); 
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-[0_32px_64px_-12px_hsl(222.2_47.4%_11.2%_/_0.18)] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] shadow-sm">
                    <Lock className="w-4 h-4 text-white" aria-hidden="true" />
                  </div>
                  <h2 className="font-primary text-lg sm:text-xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                    Change Password
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={closePasswordModal} 
                  disabled={isChangingPassword} 
                  className="h-8 w-8 rounded-lg text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,47.4%,11.2%)] hover:bg-[hsl(210,40%,96.1%)]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="w-full flex flex-col gap-4">
                {[
                  { id: 'currentPassword', label: 'Current Password', value: passwordForm.currentPassword, show: showCurrentPassword, setShow: setShowCurrentPassword, placeholder: 'Current Password' },
                  { id: 'newPassword', label: 'New Password', value: passwordForm.newPassword, show: showNewPassword, setShow: setShowNewPassword, placeholder: 'New Password (min 6 chars)' },
                  { id: 'confirmPassword', label: 'Confirm New Password', value: passwordForm.confirmPassword, show: showConfirmPassword, setShow: setShowConfirmPassword, placeholder: 'Confirm New Password' },
                ].map((field) => (
                  <div key={field.id} className="w-full space-y-1.5">
                    <Label className="font-secondary text-xs font-medium text-[hsl(215.4,16.3%,46.9%)] ml-1">
                      {field.label}
                    </Label>
                    <div className="relative w-full">
                      <Lock 
                        className={cn(
                          'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none', 
                          activeField === field.id ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'
                        )} 
                      />
                      <Input 
                        type={field.show ? 'text' : 'password'} 
                        placeholder={field.placeholder} 
                        value={field.value} 
                        onChange={(e) => handlePasswordChange(field.id as keyof typeof passwordForm, e.target.value)} 
                        onFocus={() => setActiveField(field.id)} 
                        onBlur={() => setActiveField(null)} 
                        className={cn(
                          'font-secondary py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] w-full pl-11 pr-11', 
                          activeField === field.id ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'
                        )} 
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => field.setShow((p: boolean) => !p)} 
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-[hsl(215.4,16.3%,46.9%)]"
                      >
                        {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-[hsl(214.3,31.8%,91.4%)]">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={closePasswordModal} 
                    disabled={isChangingPassword} 
                    className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] hover:bg-[hsl(210,40%,96.1%)]"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword} 
                    className="h-10 px-6 rounded-xl font-primary text-sm text-white border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-50"
                  >
                    {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}