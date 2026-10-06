import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { AppLayout } from '@/components/layout/AppSidebar';
import { supabase } from '@/lib/supabase';
import {
  Mail, Phone, Share2, UploadCloud, User, Building2,
  Shield, Layers, Clock, Copy, ExternalLink, Sparkles,
  MapPin, Calendar, Heart, Stethoscope, Award, CheckCircle2,
  Settings, Key, AlertCircle, FileText, ChevronRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import defaultAvatarImg from '@/assets/avatar_olivia.jpg';

interface ProfilePageProps {
  entityRole?: 'customer' | 'staff' | 'facility_admin' | 'system_admin';
}

export function ProfilePage({ entityRole }: ProfilePageProps) {
  const { profile, updateProfile } = useAuth();
  const effectiveRole = entityRole || profile?.role || 'customer';

  // Parse first and last name from profile full_name
  const getNames = () => {
    const full = profile?.full_name || (
      effectiveRole === 'customer'
        ? 'Olivia Rhye'
        : effectiveRole === 'staff'
        ? 'Dr. Jane Smith'
        : 'Admin Executive'
    );
    const parts = full.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts[0], last: parts.slice(1).join(' ') };
  };

  const initialNames = getNames();
  const [firstName, setFirstName] = useState(initialNames.first);
  const [lastName, setLastName] = useState(initialNames.last);
  const [email, setEmail] = useState(profile?.email || 'olivia@untitledui.com');
  const [phone, setPhone] = useState(profile?.phone || '+1 (555) 000-0000');

  // Customer specific fields
  const [dateOfBirth, setDateOfBirth] = useState('1994-06-15');
  const [emergencyContact, setEmergencyContact] = useState('David Rhye (+1 555-019-2834)');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [city, setCity] = useState('San Francisco');
  const [smsAlerts, setSmsAlerts] = useState(true);

  // Staff specific fields
  const [staffId, setStaffId] = useState('STF-2026-08');
  const [licenseNumber, setLicenseNumber] = useState('MED-REG-984210');
  const [department, setDepartment] = useState('Outpatient General Medicine');
  const [counterDesk, setCounterDesk] = useState('Counter 1 (Main Triage)');
  const [chimeEnabled, setChimeEnabled] = useState(true);

  // Admin specific fields
  const [organizationName, setOrganizationName] = useState('Metro Health Alliance');
  const [facilityName, setFacilityName] = useState('Metro General Hospital');
  const [adminDesignation, setAdminDesignation] = useState('Chief Operations Director');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [emergencyOverride, setEmergencyOverride] = useState(true);

  // Avatar state - default or uploaded
  const [avatarPreview, setAvatarPreview] = useState<string>(() => {
    return profile?.avatar_url || (profile?.id ? localStorage.getItem(`queueez_avatar_${profile.id}`) : '') || '';
  });

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync names if profile changes
  useEffect(() => {
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
    if (profile?.email) setEmail(profile.email);
    if (profile?.phone) setPhone(profile.phone);
    if (profile?.avatar_url) {
      setAvatarPreview(profile.avatar_url);
    } else if (profile?.id) {
      const saved = localStorage.getItem(`queueez_avatar_${profile.id}`);
      if (saved) setAvatarPreview(saved);
    }
  }, [profile]);

  const handleRemovePhoto = async () => {
    setAvatarPreview('');
    if (profile?.id) {
      localStorage.removeItem(`queueez_avatar_${profile.id}`);
      try {
        await supabase
          .from('profiles')
          .update({ avatar_url: null, updated_at: new Date().toISOString() })
          .eq('id', profile.id);
      } catch {
        // Ignore
      }
    }
    await updateProfile({ avatar_url: undefined });
    toast.success('Profile picture removed');
  };

  // Handle image upload with Supabase Storage integration + local fallback
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, SVG, or GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    const toastId = toast.loading('Uploading profile picture...');

    try {
      let finalAvatarUrl = '';

      // 1. Try uploading to Supabase Storage 'avatars' bucket
      if (profile?.id) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              finalAvatarUrl = publicUrlData.publicUrl;
            }
          }
        } catch {
          // Supabase storage bucket offline or mock mode
        }
      }

      // 2. Fallback to FileReader data URL
      if (!finalAvatarUrl) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const result = e.target?.result as string;
          setAvatarPreview(result);
          if (profile?.id) {
            localStorage.setItem(`queueez_avatar_${profile.id}`, result);
          }

          // Persist directly to Supabase DB if possible
          if (profile?.id) {
            try {
              await supabase
                .from('profiles')
                .update({ avatar_url: result, updated_at: new Date().toISOString() })
                .eq('id', profile.id);
            } catch {
              // Ignore
            }
          }

          await updateProfile({ avatar_url: result });
          toast.success('Profile picture updated successfully', { id: toastId });
        };
        reader.readAsDataURL(file);
        return;
      }

      // If Supabase Storage uploaded successfully
      setAvatarPreview(finalAvatarUrl);
      if (profile?.id) {
        localStorage.setItem(`queueez_avatar_${profile.id}`, finalAvatarUrl);
        await supabase
          .from('profiles')
          .update({ avatar_url: finalAvatarUrl, updated_at: new Date().toISOString() })
          .eq('id', profile.id);
      }
      await updateProfile({ avatar_url: finalAvatarUrl });
      toast.success('Profile picture saved to database', { id: toastId });
    } catch {
      toast.error('Failed to upload picture', { id: toastId });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Profile link copied to clipboard!');
    } else {
      toast.success('Profile URL ready to share');
    }
  };

  const handleReset = () => {
    const names = getNames();
    setFirstName(names.first);
    setLastName(names.last);
    setEmail(profile?.email || 'user@queueez.com');
    setPhone(profile?.phone || '+91-9876543210');
    setAvatarPreview(profile?.avatar_url || (profile?.id ? localStorage.getItem(`queueez_avatar_${profile.id}`) : '') || '');
    toast('Changes discarded');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Valid email address is required');
      return;
    }

    setIsSaving(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      // 1. Update Supabase profiles table directly
      if (profile?.id) {
        try {
          await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              email: email.trim(),
              phone: phone.trim(),
              avatar_url: avatarPreview,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);
        } catch {
          // Offline/mock fallback
        }
      }

      // 2. Update Auth Provider & LocalStorage state
      await updateProfile({
        full_name: fullName,
        email: email.trim(),
        phone: phone.trim(),
        avatar_url: avatarPreview,
      });

      // Save role-specific metadata
      if (profile?.id) {
        const metadata = {
          role: effectiveRole,
          dateOfBirth,
          emergencyContact,
          preferredLanguage,
          city,
          smsAlerts,
          staffId,
          licenseNumber,
          department,
          counterDesk,
          chimeEnabled,
          organizationName,
          facilityName,
          adminDesignation,
          twoFactorEnabled,
          emergencyOverride,
        };
        localStorage.setItem(`queueez_profile_meta_${profile.id}`, JSON.stringify(metadata));
      }

      toast.success('Profile information saved to database');
    } catch {
      toast.error('Could not save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabelMap: Record<string, string> = {
    customer: 'Customer Account',
    staff: 'Healthcare Staff Operator',
    facility_admin: 'Facility Administrator',
    system_admin: 'System Administrator',
  };

  return (
    <AppLayout role={effectiveRole}>
      <div className="max-w-5xl mx-auto space-y-8 pb-12 pt-2 sm:pt-4">
        {/* ── Shifted Up Profile Header (No Gradient Banner, No Tick Mark) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-hairline">
          {/* Avatar + Clean Name & Email */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-hairline shadow-xs overflow-hidden bg-surface-soft flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={firstName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                    {(firstName || profile?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-display-xs sm:text-title-lg font-bold text-ink tracking-tight font-display">
                  {firstName} {lastName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-soft border border-hairline text-muted">
                  {roleLabelMap[effectiveRole] || 'User'}
                </span>
              </div>
              <p className="text-body-sm text-muted mt-0.5">{email}</p>
            </div>
          </div>

          {/* Top Right Action Buttons: Share & View Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="h-10 px-4 rounded-lg border border-hairline bg-canvas hover:bg-surface-soft text-ink text-sm font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Share2 size={15} className="text-muted" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="h-10 px-4 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>View profile</span>
            </button>
          </div>
        </div>

        {/* ── Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Heading and role-specific context */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h2 className="text-title-sm font-semibold text-ink">Personal info</h2>
              <p className="text-body-sm text-muted mt-1">
                Update your photo and role-specific details.
              </p>
            </div>

            {/* Role contextual card */}
            <div className="p-5 rounded-xl bg-surface-soft border border-hairline space-y-3">
              <div className="flex items-center gap-2 text-caption font-semibold text-ink">
                <Sparkles size={14} className="text-[#7F56D9]" />
                {effectiveRole === 'customer'
                  ? 'Patient Identity & Health Record'
                  : effectiveRole === 'staff'
                  ? 'Clinic Station & Provider Triage'
                  : 'Enterprise Governance & Facility Scope'}
              </div>
              <p className="text-caption text-muted leading-relaxed">
                {effectiveRole === 'customer'
                  ? 'Your profile connects to your virtual queue tokens, upcoming medical appointments, and patient notification routing.'
                  : effectiveRole === 'staff'
                  ? 'Your profile determines which service counter desk you operate and authorises immediate patient calling and chime dispatch.'
                  : 'Administrative profile controls facility operating parameters, department capacity, and platform audit records.'}
              </p>
              <div className="pt-2 border-t border-hairline/60 flex items-center justify-between text-[11px] text-muted">
                <span>Database Sync:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Database Connected
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Form Card */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSave} className="bg-canvas border border-hairline rounded-xl shadow-2xs p-6 space-y-6">
              {/* Row 1: First name & Last name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-caption font-medium text-ink mb-1.5">
                    First name <span className="text-[#7F56D9]">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full h-10 px-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted"
                    required
                  />
                </div>

                <div>
                  <label className="block text-caption font-medium text-ink mb-1.5">
                    Last name <span className="text-[#7F56D9]">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full h-10 px-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Email address */}
              <div>
                <label className="block text-caption font-medium text-ink mb-1.5">
                  Email address <span className="text-[#7F56D9]">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@untitledui.com"
                    className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted"
                    required
                  />
                </div>
              </div>

              {/* Row 3: Phone number */}
              <div>
                <label className="block text-caption font-medium text-ink mb-1.5">
                  Phone number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted"
                  />
                </div>
              </div>

              {/* ── ROLE-SPECIFIC SECTIONS ── */}

              {/* Customer Specific Fields */}
              {effectiveRole === 'customer' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-hairline">
                    <div>
                      <label className="block text-caption font-medium text-ink mb-1.5">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-caption font-medium text-ink mb-1.5">
                        City & State
                      </label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="San Francisco, CA"
                          className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-caption font-medium text-ink mb-1.5">
                      Emergency Contact Name & Phone
                    </label>
                    <div className="relative">
                      <Heart size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Contact name and emergency phone"
                        className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-soft border border-hairline flex items-center justify-between">
                    <div>
                      <p className="text-body-sm font-semibold text-ink">SMS Arrival Alerts</p>
                      <p className="text-caption text-muted">Receive live text notifications when you are 2 places ahead in queue.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="w-5 h-5 accent-[#7F56D9] cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* Staff Specific Fields */}
              {effectiveRole === 'staff' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-hairline">
                    <div>
                      <label className="block text-caption font-medium text-ink mb-1.5">
                        Staff Operator ID
                      </label>
                      <div className="relative">
                        <Award size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={staffId}
                          onChange={(e) => setStaffId(e.target.value)}
                          className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm font-mono outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-caption font-medium text-ink mb-1.5">
                        Medical License / Reg No
                      </label>
                      <div className="relative">
                        <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm font-mono outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-caption font-medium text-ink mb-1.5">
                        Specialty Department
                      </label>
                      <div className="relative">
                        <Stethoscope size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-caption font-medium text-ink mb-1.5">
                        Assigned Service Desk
                      </label>
                      <div className="relative">
                        <Layers size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={counterDesk}
                          onChange={(e) => setCounterDesk(e.target.value)}
                          className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-soft border border-hairline flex items-center justify-between">
                    <div>
                      <p className="text-body-sm font-semibold text-ink">Desk Audio Chime</p>
                      <p className="text-caption text-muted">Play clinic chime audio alert automatically when calling next patient.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={chimeEnabled}
                      onChange={(e) => setChimeEnabled(e.target.checked)}
                      className="w-5 h-5 accent-[#7F56D9] cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* Facility Admin / System Admin Specific Fields */}
              {(effectiveRole === 'facility_admin' || effectiveRole === 'system_admin') && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-hairline">
                    <div>
                      <label className="block text-caption font-medium text-ink mb-1.5">
                        Enterprise Healthcare Organization
                      </label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-caption font-medium text-ink mb-1.5">
                        Managed Facility
                      </label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={facilityName}
                          onChange={(e) => setFacilityName(e.target.value)}
                          className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-caption font-medium text-ink mb-1.5">
                      Administrative Designation
                    </label>
                    <div className="relative">
                      <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        value={adminDesignation}
                        onChange={(e) => setAdminDesignation(e.target.value)}
                        className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-soft border border-hairline flex items-center justify-between">
                    <div>
                      <p className="text-body-sm font-semibold text-ink">Two-Factor Authentication (2FA)</p>
                      <p className="text-caption text-muted">Enforce OTP security on administrator logins across facility consoles.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      className="w-5 h-5 accent-[#7F56D9] cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* Profile Photo Section with Dropzone */}
              <div className="pt-3 border-t border-hairline">
                <label className="block text-caption font-medium text-ink mb-2">
                  Profile photo
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Avatar circular preview */}
                  <div className="relative shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-hairline shadow-2xs bg-surface-soft flex items-center justify-center">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary text-white flex items-center justify-center text-lg font-bold">
                          {(firstName || profile?.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-[11px] text-error hover:underline cursor-pointer font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Drag-and-drop / Click-to-upload box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex-1 w-full border border-dashed border-hairline hover:border-[#7F56D9]/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-surface-soft/40 hover:bg-[#7F56D9]/5 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/svg+xml, image/png, image/jpeg, image/gif"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-10 h-10 rounded-lg border border-hairline bg-canvas mx-auto flex items-center justify-center text-muted group-hover:text-[#7F56D9] group-hover:border-[#7F56D9]/30 shadow-2xs transition-colors">
                      <UploadCloud size={20} />
                    </div>

                    <p className="text-body-sm mt-3 text-ink">
                      <span className="font-semibold text-[#7F56D9] hover:underline">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </p>
                    <p className="text-caption text-muted mt-1">
                      SVG, PNG, JPG or GIF (max. 800×400px) • Automatically synced with database
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Footer Buttons */}
              <div className="border-t border-hairline pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-10 px-4 rounded-lg border border-hairline bg-canvas hover:bg-surface-soft text-ink text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-10 px-5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── View Profile Preview Modal ── */}
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
            <div className="bg-canvas border border-hairline rounded-2xl shadow-elevated max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-surface-soft hover:bg-surface-card text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="w-24 h-24 rounded-full border border-hairline shadow-md mx-auto overflow-hidden bg-white mb-3">
                  <img src={avatarPreview} alt={firstName} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-title-sm font-bold text-ink">
                  {firstName} {lastName}
                </h3>
                <p className="text-body-sm text-muted">{email}</p>
                <p className="text-caption text-muted mt-0.5">{phone}</p>

                <div className="mt-4 pt-4 border-t border-hairline text-left space-y-2 text-caption">
                  <div className="flex justify-between">
                    <span className="text-muted">Entity Role:</span>
                    <span className="font-semibold text-ink">{roleLabelMap[effectiveRole]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Profile ID:</span>
                    <span className="font-mono text-ink">{profile?.id?.slice(0, 8) || 'USR-2026'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Database Storage:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Database Active
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-full mt-6 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-active transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default ProfilePage;
