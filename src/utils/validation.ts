import { Student, StudentFormErrors, StudentFormValues } from '../types/student';

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const STUDENT_ID_REGEX = /^[A-Za-z0-9_-]{3,20}$/;
const NAME_REGEX = /^[A-Za-z\s.'-]{2,80}$/;
const PHONE_ALLOWED_CHARS_REGEX = /^[0-9+\-()\s]{10,20}$/;

export function normalizeStudentId(id: string): string {
  return id.trim().toUpperCase();
}

export function validateStudentField(
  field: keyof StudentFormValues,
  value: string,
  existingStudents: Student[],
  editingOriginalId?: string
): string | undefined {
  const trimmed = value.trim();

  switch (field) {
    case 'id': {
      if (!trimmed) {
        return 'Student ID is required.';
      }
      if (!STUDENT_ID_REGEX.test(trimmed)) {
        return 'Use 3 to 20 characters (letters, numbers, hyphens, or underscores).';
      }
      const normalized = normalizeStudentId(trimmed);
      const originalNormalized = editingOriginalId
        ? normalizeStudentId(editingOriginalId)
        : null;
      const duplicate = existingStudents.some(
        (student) =>
          normalizeStudentId(student.id) === normalized &&
          normalizeStudentId(student.id) !== originalNormalized
      );
      if (duplicate) {
        return `Student ID "${normalized}" already exists. IDs must be unique.`;
      }
      return undefined;
    }

    case 'fullName': {
      if (!trimmed) {
        return 'Full Name is required.';
      }
      if (trimmed.length < 2) {
        return 'Full Name must be at least 2 characters.';
      }
      if (!NAME_REGEX.test(trimmed)) {
        return 'Enter a valid name using letters, spaces, periods, or hyphens.';
      }
      return undefined;
    }

    case 'age': {
      if (!trimmed) {
        return 'Age is required.';
      }
      if (!/^\d+$/.test(trimmed)) {
        return 'Age must be a whole number.';
      }
      const parsedAge = Number.parseInt(trimmed, 10);
      if (Number.isNaN(parsedAge) || parsedAge < 16 || parsedAge > 80) {
        return 'Age must be between 16 and 80 years.';
      }
      return undefined;
    }

    case 'course': {
      if (!trimmed) {
        return 'Please select or enter a course.';
      }
      if (trimmed.length < 2) {
        return 'Course name must be at least 2 characters.';
      }
      return undefined;
    }

    case 'email': {
      if (!trimmed) {
        return 'Email address is required.';
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        return 'Enter a valid email address (e.g., student@university.edu).';
      }
      return undefined;
    }

    case 'phone': {
      if (!trimmed) {
        return 'Phone number is required.';
      }
      if (!PHONE_ALLOWED_CHARS_REGEX.test(trimmed)) {
        return 'Enter a valid phone number (digits, spaces, +, -, or parentheses).';
      }
      const digitsOnly = trimmed.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        return 'Phone number must contain between 10 and 15 digits.';
      }
      return undefined;
    }

    default:
      return undefined;
  }
}

export function validateStudentForm(
  values: StudentFormValues,
  existingStudents: Student[],
  editingOriginalId?: string
): StudentFormErrors {
  const errors: StudentFormErrors = {};
  const fields: (keyof StudentFormValues)[] = [
    'id',
    'fullName',
    'age',
    'course',
    'email',
    'phone',
  ];

  for (const field of fields) {
    const error = validateStudentField(
      field,
      values[field],
      existingStudents,
      editingOriginalId
    );
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}
