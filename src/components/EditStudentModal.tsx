import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Student } from '../types/student';
import { StudentForm } from './StudentForm';

interface EditStudentModalProps {
  student: Student | null;
  existingStudents: Student[];
  courses: string[];
  onClose: () => void;
  onSave: (
    originalId: string,
    updated: {
      id: string;
      fullName: string;
      age: number;
      course: string;
      email: string;
      phone: string;
    }
  ) => void;
}

export function EditStudentModal({
  student,
  existingStudents,
  courses,
  onClose,
  onSave,
}: EditStudentModalProps) {
  useEffect(() => {
    if (!student) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [student, onClose]);

  if (!student) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px] no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-student-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="edit-student-modal-title"
              className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Update Student Record
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Editing record <span className="font-mono font-medium">{student.id}</span> · {student.fullName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit form"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          <StudentForm
            mode="edit"
            initialStudent={student}
            existingStudents={existingStudents}
            courses={courses}
            onSubmit={(data) => onSave(student.id, data)}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
