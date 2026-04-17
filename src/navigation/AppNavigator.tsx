import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Bell, BookOpen, FileText, Home, User } from 'lucide-react-native';

import HomeScreen from '../screens/student/home/HomeScreen';
import SearchScreen from '../screens/student/search/SearchScreen';
import AnnouncementsScreen from '../screens/student/announcements/AnnouncementsScreen';

import QuizListScreen from '../screens/student/quiz/QuizListScreen';
import QuizPlayScreen from '../screens/student/quiz/QuizPlayScreen';
import QuizReviewScreen from '../screens/student/quiz/QuizReviewScreen';
import QuizHistoryScreen from '../screens/student/quiz/QuizHistoryScreen';
import PracticeModeScreen from '../screens/student/quiz/PracticeModeScreen';
import ProgressScreen from '../screens/student/progress/ProgressScreen';
import AnalyticsScreen from '../screens/student/progress/AnalyticsScreen';

import CaseListScreen from '../screens/student/cases/CaseListScreen';
import CaseDetailScreen from '../screens/student/cases/CaseDetailScreen';
import CaseHistoryScreen from '../screens/student/cases/CaseHistoryScreen';

import NotificationsScreen from '../screens/student/notifications/NotificationsScreen';

import ProfileScreen from '../screens/student/profile/ProfileScreen';
import EditProfileScreen from '../screens/student/profile/EditProfileScreen';
import MedicalVerificationScreen from '../screens/student/profile/MedicalVerificationScreen';
import SettingsScreen from '../screens/student/settings/SettingsScreen';
import ChangePasswordScreen from '../screens/student/settings/ChangePasswordScreen';

import type {
  AppTabParamList,
  CasesStackParamList,
  HomeStackParamList,
  NotificationsStackParamList,
  ProfileStackParamList,
  QuizStackParamList,
} from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator(): React.ReactElement {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: true, title: 'Tìm kiếm' }}
      />
      <HomeStack.Screen
        name="Announcements"
        component={AnnouncementsScreen}
        options={{ headerShown: true, title: 'Thông báo chung' }}
      />
    </HomeStack.Navigator>
  );
}

const QuizStack = createNativeStackNavigator<QuizStackParamList>();
function QuizStackNavigator(): React.ReactElement {
  return (
    <QuizStack.Navigator screenOptions={{ headerShown: false }}>
      <QuizStack.Screen name="QuizList" component={QuizListScreen} />
      <QuizStack.Screen
        name="QuizPlay"
        component={QuizPlayScreen}
        options={{ headerShown: true, title: 'Làm bài' }}
      />
      <QuizStack.Screen
        name="QuizReview"
        component={QuizReviewScreen}
        options={{ headerShown: true, title: 'Xem lại' }}
      />
      <QuizStack.Screen
        name="QuizHistory"
        component={QuizHistoryScreen}
        options={{ headerShown: true, title: 'Lịch sử' }}
      />
      <QuizStack.Screen
        name="PracticeMode"
        component={PracticeModeScreen}
        options={{ headerShown: true, title: 'Luyện tập' }}
      />
      <QuizStack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ headerShown: true, title: 'Tiến độ' }}
      />
      <QuizStack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ headerShown: true, title: 'Phân tích' }}
      />
    </QuizStack.Navigator>
  );
}

const CasesStack = createNativeStackNavigator<CasesStackParamList>();
function CasesStackNavigator(): React.ReactElement {
  return (
    <CasesStack.Navigator screenOptions={{ headerShown: false }}>
      <CasesStack.Screen name="CaseList" component={CaseListScreen} />
      <CasesStack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        options={{ headerShown: true, title: 'Chi tiết ca' }}
      />
      <CasesStack.Screen
        name="CaseHistory"
        component={CaseHistoryScreen}
        options={{ headerShown: true, title: 'Lịch sử ca' }}
      />
    </CasesStack.Navigator>
  );
}

const NotificationsStack =
  createNativeStackNavigator<NotificationsStackParamList>();
function NotificationsStackNavigator(): React.ReactElement {
  return (
    <NotificationsStack.Navigator screenOptions={{ headerShown: false }}>
      <NotificationsStack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
    </NotificationsStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStackNavigator(): React.ReactElement {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: true, title: 'Chỉnh sửa hồ sơ' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Cài đặt' }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: true, title: 'Đổi mật khẩu' }}
      />
      <ProfileStack.Screen
        name="MedicalVerification"
        component={MedicalVerificationScreen}
        options={{ headerShown: true, title: 'Xác minh y tế' }}
      />
    </ProfileStack.Navigator>
  );
}

export default function AppNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#14b8a6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="QuizTab"
        component={QuizStackNavigator}
        options={{
          title: 'Quiz',
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CasesTab"
        component={CasesStackNavigator}
        options={{
          title: 'Ca lâm sàng',
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStackNavigator}
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
