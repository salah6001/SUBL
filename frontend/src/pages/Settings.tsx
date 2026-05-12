import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { AppLayout } from '@/components/AppLayout';
import { useAppState } from '@/hooks/useAppState';
import { userApi } from '@/api/user';
import { isDemoSession, getDemoProfileUpdate } from '@/lib/demoAuth';
import { Mail, Phone, User, Bell, Lock, ChevronRight, MessageCircle } from 'lucide-react';
import { avatarPlaceholder } from '@/lib/articlePlaceholder';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
});
type FormData = z.infer<typeof schema>;

export default function Settings() {
  const navigate = useNavigate();
  const { currentUser, setUser } = useAppState();
  const [notifications, setNotifications] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: currentUser?.name ?? '',
      email: currentUser?.email ?? '',
      phone: currentUser?.phone ?? '',
    },
  });

  useEffect(() => {
    if (currentUser) {
      reset({ name: currentUser.name, email: currentUser.email, phone: currentUser.phone });
    }
  }, [currentUser, reset]);

  const handleSave = handleSubmit(async (data) => {
    setSaving(true);
    try {
      const updated = isDemoSession() ? getDemoProfileUpdate(data) : await userApi.updateProfile(data);
      setUser(updated);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  });

  const handleNotificationsToggle = async () => {
    const next = !notifications;
    setNotifications(next);
    try {
      if (!isDemoSession()) await userApi.updateNotifications({ notifications: next });
    } catch {
      setNotifications(!next);
      toast.error('Failed to update notifications');
    }
  };

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img
                src={currentUser?.avatar || avatarPlaceholder(currentUser?.name ?? '')}
                alt={currentUser?.name ?? 'Profile'}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-subl-blue-100"
              />
              <div>
                <h3 className="text-lg font-semibold text-subl-grey-900">{currentUser?.name || 'User'}</h3>
                <p className="text-sm text-subl-grey-500">{currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={saving}
              className="px-6 py-2 bg-subl-blue-500 hover:bg-subl-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-subl-grey-800 mb-4">Personal Information</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="settings-name" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
                  <input
                    id="settings-name"
                    type="text"
                    readOnly={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border transition-all ${
                      isEditing
                        ? 'bg-white border-subl-grey-200 focus:outline-none focus:ring-2 focus:ring-subl-blue-200'
                        : 'bg-subl-grey-50 border-subl-grey-100 text-subl-grey-600'
                    }`}
                    {...register('name')}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="settings-email" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
                  <input
                    id="settings-email"
                    type="email"
                    readOnly={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border transition-all ${
                      isEditing
                        ? 'bg-white border-subl-grey-200 focus:outline-none focus:ring-2 focus:ring-subl-blue-200'
                        : 'bg-subl-grey-50 border-subl-grey-100 text-subl-grey-600'
                    }`}
                    {...register('email')}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="settings-phone" className="block text-xs font-medium text-subl-grey-600 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} />
                  <input
                    id="settings-phone"
                    type="tel"
                    readOnly={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border transition-all ${
                      isEditing
                        ? 'bg-white border-subl-grey-200 focus:outline-none focus:ring-2 focus:ring-subl-blue-200'
                        : 'bg-subl-grey-50 border-subl-grey-100 text-subl-grey-600'
                    }`}
                    {...register('phone')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-subl-grey-800 mb-4">Settings</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-subl-grey-500" />
                <span className="text-sm text-subl-grey-700">Notifications</span>
              </div>
              <button
                onClick={handleNotificationsToggle}
                aria-label={notifications ? 'Disable notifications' : 'Enable notifications'}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? 'bg-subl-blue-500' : 'bg-subl-grey-300'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full flex items-center justify-between py-3 hover:bg-subl-grey-50 rounded-xl px-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-subl-grey-500" />
                <span className="text-sm text-subl-grey-700">Change password</span>
              </div>
              <ChevronRight size={16} className="text-subl-grey-400" />
            </button>

            <a
              href="mailto:support@subl.app"
              className="w-full flex items-center justify-between py-3 hover:bg-subl-grey-50 rounded-xl px-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageCircle size={18} className="text-subl-grey-500" />
                <span className="text-sm text-subl-grey-700">Contact Us</span>
              </div>
              <ChevronRight size={16} className="text-subl-grey-400" />
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
