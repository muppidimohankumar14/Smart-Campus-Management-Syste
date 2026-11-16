export interface Student {
  id: string;
  fullName: string;
  age: number;
  course: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFormValues {
  id: string;
  fullName: string;
  age: string;
  course: string;
  email: string;
  phone: string;
}

export type StudentFormErrors = Partial<Record<keyof StudentFormValues, string>>;

export type NavSection =
  | 'dashboard'
  | 'add-student'
  | 'view-students'
  | 'search-student'
  | 'manage-students'
  | 'settings';

export type ThemeMode = 'light' | 'dark';

export interface AdminProfile {
  name: string;
  title: string;
  institution: string;
  email: string;
  username: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}
