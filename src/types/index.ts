export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  firebaseUid?: string;
  supabaseId?: string;
  email?: string;
  authProvider?: 'google' | 'supabase';
  kakshaId: string; // e.g. "KLB-T-4021" or "KLB-S-9812"
  name: string;
  phone: string;
  role: UserRole;
  activeDeviceId: string;
  avatarUrl?: string;
  blockedKakshaIds?: string[];
  createdAt: string;
}

export interface Batch {
  id: string;
  code: string; // e.g. "MATH-7XQ2"
  teacherId: string;
  teacherKakshaId: string;
  teacherName: string;
  name: string; // e.g. "Class 10 Mathematics"
  subject: string;
  studentCapacity: number;
  validUntil: string;
  description?: string;
  createdAt: string;
}

export interface BatchMembership {
  id: string;
  batchId: string;
  studentId: string;
  studentName: string;
  studentKakshaId: string;
  studentPhone: string;
  joinedAt: string;
  paymentStatus: 'paid' | 'pending';
  lastPaymentPeriod: string;
  paymentMode?: 'Cash' | 'UPI' | 'Bank' | 'Pending';
  paymentDate?: string;
}

export interface ScheduleClass {
  id: string;
  batchId: string;
  batchCode: string;
  batchName: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  classType: 'online' | 'in_person';
  meetingUrl?: string;
  roomNo?: string;
  resources?: ClassResource[];
  topicCovered?: string;
  classEndedAt?: string;
  recurringSlotId?: string;
  isPermanent?: boolean;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface RecurringTimetableSlot {
  id: string;
  teacherId: string;
  batchId: string;
  batchCode: string;
  batchName: string;
  subject: string;
  title: string;
  recurrenceType: 'weekly' | 'monthly';
  dayOfWeek?: DayOfWeek;
  dayOfMonth?: number; // 1 - 31 for monthly recurrence
  startTime: string;
  endTime: string;
  classType: 'online' | 'in_person';
  meetingUrl?: string;
  roomNo?: string;
  createdAt: string;
}

export interface ClassResource {
  id: string;
  batchId: string;
  classId?: string;
  title: string;
  type: 'notes' | 'homework' | 'question_paper' | 'solution';
  fileUrl: string;
  fileSize?: string;
  compressedDataUrl?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface BatchContent {
  id: string;
  batchId: string;
  batchName: string;
  title: string;
  description: string;
  youtubeId: string;
  thumbnailUrl?: string;
  duration: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  batchId: string;
  batchName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  content: string;
  postedAt: string;
}

export interface KakshaMail {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  type: 'join_request' | 'direct_message' | 'announcement' | 'system';
  subject: string;
  body: string;
  batchCode?: string;
  status: 'unread' | 'read' | 'accepted' | 'declined';
  sentAt: string;
}

export interface StudentAttendanceItem {
  studentId: string;
  studentName: string;
  studentKakshaId: string;
  status: 'present' | 'absent' | 'excused';
}

export interface AttendanceRecord {
  id: string;
  batchId: string;
  batchName?: string;
  date: string; // YYYY-MM-DD
  records: StudentAttendanceItem[];
  markedAt: string;
}
