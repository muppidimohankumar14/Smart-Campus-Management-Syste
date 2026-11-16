import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, RotateCcw } from 'lucide-react';
import {
  Student,
  StudentFormErrors,
  StudentFormValues,
} from '../types/student';
import {
  normalizeStudentId,
  validateStudentField,
  validateStudentForm,
} from '../utils/validation';

interface StudentFormProps {
  mode: 'create' | 'edit';
  initialStudent?: Student | null;
  prefillId?: string;
  existingStudents: Student[];
  courses: string[];
  onSubmit: (data: {
    id: string;
    fullName: string;
    age: number;
    course: string;
    email: string;
    phone: string;
  }) => void;
  onCancel?: () => void;
}

const EMPTY_VALUES: StudentFormValues = {
  id: '',
  fullName: '',
  age: '',
  course: '',
  email: '',
  phone: '',
};

export function StudentForm({
  mode,
  initialStudent,
  prefillId,
  existingStudents,
  courses,
  onSubmit,
  onCancel,
}: StudentFormProps) {
  const [values, setValues] = useState<StudentFormValues>(() => {
    if (mode === 'edit' && initialStudent) {
      return {
        id: initialStudent.id,
        fullName: initialStudent.fullName,
        age: String(initialStudent.age),
        course: initialStudent.course,
        email: initialStudent.email,
        phone: initialStudent.phone,
      };
    }
    return {
      ...EMPTY_VALUES,
      id: prefillId || '',
      course: courses[0] || '',
    };
  });

  const [useCustomCourse, setUseCustomCourse] = useState<boolean>(() => {
    if (mode === 'edit' && initialStudent) {
      return !courses.includes(initialStudent.course);
    }
    return false;
  });

  const [errors, setErrors] = useState<StudentFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof StudentFormValues, boolean>>>({});

  useEffect(() => {
    if (mode === 'edit' && initialStudent) {
      setValues({
        id: initialStudent.id,
        fullName: initialStudent.fullName,
        age: String(initialStudent.age),
        course: initialStudent.course,
        email: initialStudent.email,
        phone: initialStudent.phone,
      });
      setUseCustomCourse(!courses.includes(initialStudent.course));
      setErrors({});
      setTouched({});
    }
  }, [mode, initialStudent, courses]);

  useEffect(() => {
    if (mode === 'create' && prefillId) {
      setValues((prev) => ({ ...prev, id: prefillId }));
    }
  }, [mode, prefillId]);

  const editingOriginalId = mode === 'edit' ? initialStudent?.id : undefined;

  const handleFieldChange = (
    field: keyof StudentFormValues,
    nextValue: string
  ) => {
    const updated = { ...values, [field]: nextValue };
    setValues(updated);

    if (touched[field]) {
      const fieldError = validateStudentField(
        field,
        nextValue,
        existingStudents,
        editingOriginalId
      );
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    }
  };

  const handleFieldBlur = (field: keyof StudentFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldError = validateStudentField(
      field,
      values[field],
      existingStudents,
      editingOriginalId
    );
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const handleReset = () => {
    if (mode === 'edit' && initialStudent) {
      setValues({
        id: initialStudent.id,
        fullName: initialStudent.fullName,
        age: String(initialStudent.age),
        course: initialStudent.course,
        email: initialStudent.email,
        phone: initialStudent.phone,
      });
      setUseCustomCourse(!courses.includes(initialStudent.course));
    } else {
      setValues({
        ...EMPTY_VALUES,
        course: courses[0] || '',
      });
      setUseCustomCourse(false);
    }
    setErrors({});
    setTouched({});
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const allTouched: Record<keyof StudentFormValues, boolean> = {
      id: true,
      fullName: true,
      age: true,
      course: true,
      email: true,
      phone: true,
    };
    setTouched(allTouched);

    const validationErrors = validateStudentForm(
      values,
      existingStudents,
      editingOriginalId
    );
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSubmit({
      id: normalizeStudentId(values.id),
      fullName: values.fullName.trim(),
      age: Number.parseInt(values.age.trim(), 10),
      course: values.course.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    });

    if (mode === 'create') {
      setValues({
        ...EMPTY_VALUES,
        course: courses[0] || '',
      });
      setUseCustomCourse(false);
      setErrors({});
      setTouched({});
    }
  };

  const inputBaseClass = (hasError?: string) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 ${
      hasError
        ? 'border-red-400 bg-red-50/40 text-slate-900 focus-visible:ring-red-500 dark:border-red-700 dark:bg-red-950/20 dark:text-slate-100'
        : 'border-slate-200 bg-white text-slate-900 focus-visible:border-blue-600 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus-visible:border-blue-500'
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${mode}-student-id`}
            className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Student ID <span className="text-red-600">*</span>
          </label>
          <input
            id={`${mode}-student-id`}
            type="text"
            value={values.id}
            onChange={(e) => handleFieldChange('id', e.target.value)}
            onBlur={() => handleFieldBlur('id')}
            placeholder="e.g., STU202611"
            className={`${inputBaseClass(errors.id)} font-mono uppercase`}
            aria-invalid={Boolean(errors.id)}
            aria-describedby={errors.id ? `${mode}-id-error` : undefined}
          />
          {errors.id ? (
            <p
              id={`${mode}-id-error`}
              className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.id}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Unique identifier (3–20 alphanumeric characters).
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${mode}-student-name`}
            className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            id={`${mode}-student-name`}
            type="text"
            value={values.fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            onBlur={() => handleFieldBlur('fullName')}
            placeholder="e.g., Ananya Verma"
            className={inputBaseClass(errors.fullName)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? `${mode}-name-error` : undefined}
          />
          {errors.fullName && (
            <p
              id={`${mode}-name-error`}
              className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.fullName}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${mode}-student-age`}
            className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Age <span className="text-red-600">*</span>
          </label>
          <input
            id={`${mode}-student-age`}
            type="number"
            min={16}
            max={80}
            value={values.age}
            onChange={(e) => handleFieldChange('age', e.target.value)}
            onBlur={() => handleFieldBlur('age')}
            placeholder="e.g., 20"
            className={`${inputBaseClass(errors.age)} tabular-nums`}
            aria-invalid={Boolean(errors.age)}
            aria-describedby={errors.age ? `${mode}-age-error` : undefined}
          />
          {errors.age ? (
            <p
              id={`${mode}-age-error`}
              className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.age}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Valid college enrollment age (16–80).
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor={`${mode}-student-course`}
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Course / Program <span className="text-red-600">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setUseCustomCourse((prev) => !prev);
                if (useCustomCourse && courses.length > 0) {
                  handleFieldChange('course', courses[0]);
                } else {
                  handleFieldChange('course', '');
                }
              }}
              className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-400 whitespace-nowrap shrink-0"
            >
              {useCustomCourse ? 'Select from catalog' : 'Enter custom course'}
            </button>
          </div>
          {useCustomCourse ? (
            <input
              id={`${mode}-student-course`}
              type="text"
              value={values.course}
              onChange={(e) => handleFieldChange('course', e.target.value)}
              onBlur={() => handleFieldBlur('course')}
              placeholder="e.g., M.Sc Artificial Intelligence"
              className={inputBaseClass(errors.course)}
              aria-invalid={Boolean(errors.course)}
              aria-describedby={errors.course ? `${mode}-course-error` : undefined}
            />
          ) : (
            <select
              id={`${mode}-student-course`}
              value={values.course}
              onChange={(e) => handleFieldChange('course', e.target.value)}
              onBlur={() => handleFieldBlur('course')}
              className={inputBaseClass(errors.course)}
              aria-invalid={Boolean(errors.course)}
              aria-describedby={errors.course ? `${mode}-course-error` : undefined}
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          )}
          {errors.course && (
            <p
              id={`${mode}-course-error`}
              className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.course}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${mode}-student-email`}
            className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Email Address <span className="text-red-600">*</span>
          </label>
          <input
            id={`${mode}-student-email`}
            type="email"
            value={values.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            onBlur={() => handleFieldBlur('email')}
            placeholder="e.g., student@northbridge.edu"
            className={inputBaseClass(errors.email)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${mode}-email-error` : undefined}
          />
          {errors.email && (
            <p
              id={`${mode}-email-error`}
              className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${mode}-student-phone`}
            className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Phone Number <span className="text-red-600">*</span>
          </label>
          <input
            id={`${mode}-student-phone`}
            type="tel"
            value={values.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            onBlur={() => handleFieldBlur('phone')}
            placeholder="e.g., +1 (415) 555-0192"
            className={`${inputBaseClass(errors.phone)} font-mono`}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${mode}-phone-error` : undefined}
          />
          {errors.phone ? (
            <p
              id={`${mode}-phone-error`}
              className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.phone}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              10 to 15 digits (supports country code and spacing).
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Reset</span>
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          <span>{mode === 'create' ? 'Save Student Record' : 'Update Student'}</span>
        </button>
      </div>
    </form>
  );
}
