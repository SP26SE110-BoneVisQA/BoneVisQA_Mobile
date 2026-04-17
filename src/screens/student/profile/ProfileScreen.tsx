import React, { useCallback } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Calendar,
  ChevronRight,
  GraduationCap,
  Hash,
  Heart,
  LogOut,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings as SettingsIcon,
  User as UserIcon,
  Users,
} from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import Card from '../../../components/common/Card';
import ProfileHeader from '../../../components/profile/ProfileHeader';
import ProfileSection from '../../../components/profile/ProfileSection';
import ProfileField from '../../../components/profile/ProfileField';
import { useProfile } from '../../../hooks/useProfile';
import { useAuthStore } from '../../../stores/authStore';
import type { ProfileStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

function formatGender(gender: string | null): string | null {
  if (!gender) {
    return null;
  }
  const normalized = gender.toLowerCase();
  if (normalized === 'male' || normalized === 'nam') {
    return 'Nam';
  }
  if (normalized === 'female' || normalized === 'nữ' || normalized === 'nu') {
    return 'Nữ';
  }
  if (normalized === 'other' || normalized === 'khác') {
    return 'Khác';
  }
  return gender;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

export default function ProfileScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const { data, isPending, isError, error, refetch, isRefetching } =
    useProfile();

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất khỏi tài khoản?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await useAuthStore.getState().logout();
              queryClient.clear();
            })();
          },
        },
      ],
      { cancelable: true },
    );
  }, [queryClient]);

  const menu: MenuItem[] = [
    {
      key: 'edit',
      label: 'Chỉnh sửa hồ sơ',
      icon: <Pencil size={20} color="#14b8a6" />,
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      key: 'medical',
      label: 'Xác minh y khoa',
      icon: <BadgeCheck size={20} color="#14b8a6" />,
      onPress: () => navigation.navigate('MedicalVerification'),
    },
    {
      key: 'settings',
      label: 'Cài đặt',
      icon: <SettingsIcon size={20} color="#14b8a6" />,
      onPress: () => navigation.navigate('Settings'),
    },
    {
      key: 'password',
      label: 'Đổi mật khẩu',
      icon: <Lock size={20} color="#14b8a6" />,
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogOut size={20} color="#ef4444" />,
      onPress: handleLogout,
      destructive: true,
    },
  ];

  if (isPending) {
    return (
      <Screen>
        <Loading text="Đang tải hồ sơ..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refresh={{ refreshing: isRefetching, onRefresh: () => void refetch() }}
    >
      <View className="flex-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Hồ sơ
        </Text>

        <ProfileHeader
          fullName={data.fullName}
          email={data.email}
          avatarUrl={data.avatarUrl}
          role={data.role}
          cohort={data.schoolCohort}
        />

        <ProfileSection title="Thông tin cá nhân">
          <ProfileField
            label="Họ và tên"
            value={data.fullName}
            icon={<UserIcon size={16} color="#14b8a6" />}
          />
          <ProfileField
            label="Ngày sinh"
            value={data.dateOfBirth}
            icon={<Calendar size={16} color="#14b8a6" />}
          />
          <ProfileField
            label="Giới tính"
            value={formatGender(data.gender)}
            icon={<Users size={16} color="#14b8a6" />}
          />
          <ProfileField
            label="Số điện thoại"
            value={data.phoneNumber}
            icon={<Phone size={16} color="#14b8a6" />}
          />
          <ProfileField
            label="Email"
            value={data.email}
            icon={<Mail size={16} color="#14b8a6" />}
          />
        </ProfileSection>

        <ProfileSection title="Học tập">
          <ProfileField
            label="Mã sinh viên"
            value={data.studentSchoolId}
            icon={<Hash size={16} color="#14b8a6" />}
          />
          <ProfileField
            label="Khóa"
            value={data.schoolCohort}
            icon={<GraduationCap size={16} color="#14b8a6" />}
          />
          <ProfileField
            label="Lớp"
            value={data.classCode}
            icon={<Users size={16} color="#14b8a6" />}
          />
        </ProfileSection>

        <ProfileSection title="Liên hệ">
          <ProfileField
            label="Địa chỉ"
            value={data.address}
            icon={<MapPin size={16} color="#14b8a6" />}
          />
          <ProfileField
            label="Liên hệ khẩn cấp"
            value={data.emergencyContact}
            icon={<Heart size={16} color="#14b8a6" />}
          />
        </ProfileSection>

        <ProfileSection title="Giới thiệu">
          <ProfileField label="Tiểu sử" value={data.bio} />
        </ProfileSection>

        <View className="mb-4">
          <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
            Thao tác
          </Text>
          <Card className="py-0 px-0">
            {menu.map((item, idx) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                className={[
                  'flex-row items-center px-4 py-4',
                  idx < menu.length - 1
                    ? 'border-b border-slate-100 dark:border-slate-700/60'
                    : '',
                ].join(' ')}
              >
                <View
                  className={[
                    'w-9 h-9 rounded-lg items-center justify-center mr-3',
                    item.destructive ? 'bg-destructive/10' : 'bg-primary/10',
                  ].join(' ')}
                >
                  {item.icon}
                </View>
                <Text
                  className={[
                    'flex-1 text-base font-medium',
                    item.destructive
                      ? 'text-destructive'
                      : 'text-slate-900 dark:text-white',
                  ].join(' ')}
                >
                  {item.label}
                </Text>
                {!item.destructive ? (
                  <ChevronRight size={18} color="#94a3b8" />
                ) : null}
              </Pressable>
            ))}
          </Card>
        </View>
      </View>
    </Screen>
  );
}
