import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Batch,
  BatchMembership,
  ScheduleClass,
  BatchContent,
  Announcement,
  KakshaMail,
  ClassResource,
  UserRole,
  AttendanceRecord,
  StudentAttendanceItem,
  RecurringTimetableSlot,
  DayOfWeek,
} from '../types';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  INITIAL_USERS,
  INITIAL_BATCHES,
  INITIAL_MEMBERSHIPS,
  INITIAL_CLASSES,
  INITIAL_CONTENT,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_MAILS,
  INITIAL_RESOURCES,
  INITIAL_ATTENDANCES,
  INITIAL_RECURRING_SLOTS,
} from './mockData';

interface KakshaContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  batches: Batch[];
  memberships: BatchMembership[];
  classes: ScheduleClass[];
  content: BatchContent[];
  announcements: Announcement[];
  mails: KakshaMail[];
  resources: ClassResource[];
  attendances: AttendanceRecord[];
  recurringSlots: RecurringTimetableSlot[];
  sessionWarning: string | null;
  isFirestoreConnected: boolean;
  setSessionWarning: (warning: string | null) => void;
  setCurrentUser: (user: User | null) => void;
  switchUser: (userId: string) => void;
  loginWithGoogleUser: (googleUser: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }, role: UserRole, deviceId: string) => User;
  loginWithSupabaseEmailUser: (supabaseUser: { id: string; email?: string | null; user_metadata?: any }, role: UserRole, deviceId: string) => User;
  registerNewUser: (name: string, phone: string, role: UserRole, deviceId: string, firebaseUid?: string) => User;
  logout: () => void;
  createBatch: (name: string, subject: string, capacity: number, validUntil: string, description: string) => { success: boolean; message: string; batch?: Batch };
  deleteBatch: (batchId: string) => { success: boolean; message: string };
  joinBatchByCode: (code: string) => { success: boolean; message: string; batch?: Batch; isPending?: boolean };
  createScheduleClass: (classData: Omit<ScheduleClass, 'id' | 'teacherId' | 'teacherName'>) => ScheduleClass;
  updateScheduleClass: (classId: string, classData: Partial<ScheduleClass>) => void;
  deleteScheduleClass: (classId: string) => void;
  createRecurringSlot: (slotData: Omit<RecurringTimetableSlot, 'id' | 'createdAt' | 'teacherId'>) => RecurringTimetableSlot;
  updateRecurringSlot: (slotId: string, slotData: Partial<RecurringTimetableSlot>) => void;
  deleteRecurringSlot: (slotId: string) => void;
  getTeacherRecurringSlots: (teacherId: string) => RecurringTimetableSlot[];
  getTeacherDailySchedule: (teacherId: string, dateStr: string) => ScheduleClass[];
  togglePaymentStatus: (membershipId: string) => void;
  updateMembershipPayment: (membershipId: string, status: 'paid' | 'pending', mode?: 'Cash' | 'UPI' | 'Bank' | 'Pending', period?: string) => void;
  resetAllFeesForTeacher: (teacherId: string) => void;
  removeStudentFromBatch: (membershipId: string) => void;
  addBatchContent: (contentData: Omit<BatchContent, 'id' | 'createdAt'>) => BatchContent;
  postAnnouncement: (batchId: string, title: string, content: string) => Announcement;
  sendKakshaMail: (receiverId: string, subject: string, body: string, type?: KakshaMail['type'], batchCode?: string) => { success: boolean; message: string };
  markMailAsRead: (mailId: string) => void;
  markChatThreadAsRead: (otherKakshaId: string) => void;
  respondToMailRequest: (mailId: string, action: 'accept' | 'decline') => void;
  blockUserKakshaId: (kakshaIdToBlock: string) => void;
  addClassResource: (resource: Omit<ClassResource, 'id' | 'uploadedAt'>) => ClassResource;
  deleteClassResource: (resourceId: string) => void;
  markAttendance: (batchId: string, date: string, records: StudentAttendanceItem[]) => AttendanceRecord;
  getBatchAttendanceStats: (batchId: string) => { totalSessions: number; averageAttendancePct: number };
  getStudentCumulativeAttendance: (batchId: string, studentId: string) => { totalSessions: number; attendedSessions: number; attendancePct: number };
  getPendingJoinRequestsForTeacher: (teacherKakshaId: string) => KakshaMail[];
  getStudentUnifiedSchedule: (studentId: string, targetDate?: string) => ScheduleClass[];
  getTeacherBatches: (teacherId: string) => Batch[];
  getStudentBatches: (studentId: string) => Batch[];
  getBatchResources: (batchId: string) => ClassResource[];
  getClassResources: (classId: string) => ClassResource[];
  isResourceUploadLocked: (cls: ScheduleClass, lockHours?: number) => boolean;
  updateClassTopic: (classId: string, topic: string) => void;
  updateUserAvatar: (avatarUrl: string) => void;
}

const KakshaContext = createContext<KakshaContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kaksha_state_v1';

export const KakshaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_current_user');
    if (saved) return JSON.parse(saved);
    return users[0] || null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_authed');
    return saved === 'true';
  });

  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_batches');
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [memberships, setMemberships] = useState<BatchMembership[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_memberships');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERSHIPS;
  });

  const [classes, setClasses] = useState<ScheduleClass[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [content, setContent] = useState<BatchContent[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_content');
    return saved ? JSON.parse(saved) : INITIAL_CONTENT;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [mails, setMails] = useState<KakshaMail[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_mails');
    return saved ? JSON.parse(saved) : INITIAL_MAILS;
  });

  const [resources, setResources] = useState<ClassResource[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_resources');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_attendances');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCES;
  });

  const [recurringSlots, setRecurringSlots] = useState<RecurringTimetableSlot[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_recurring_slots');
    return saved ? JSON.parse(saved) : INITIAL_RECURRING_SLOTS;
  });

  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_users', JSON.stringify(users));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_current_user', JSON.stringify(currentUser));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_authed', isAuthenticated ? 'true' : 'false');
    localStorage.setItem(LOCAL_STORAGE_KEY + '_batches', JSON.stringify(batches));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_memberships', JSON.stringify(memberships));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_classes', JSON.stringify(classes));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_content', JSON.stringify(content));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_announcements', JSON.stringify(announcements));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_mails', JSON.stringify(mails));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_resources', JSON.stringify(resources));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_attendances', JSON.stringify(attendances));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_recurring_slots', JSON.stringify(recurringSlots));
  }, [users, currentUser, isAuthenticated, batches, memberships, classes, content, announcements, mails, resources, attendances, recurringSlots]);

  // Real-time Cloud Firestore listener for Kaksha Mails & Messages
  useEffect(() => {
    try {
      const mailsCollection = collection(db, 'kaksha_mails');
      const unsubscribe = onSnapshot(
        mailsCollection,
        (snapshot) => {
          setIsFirestoreConnected(true);
          if (!snapshot.empty) {
            const cloudMails: KakshaMail[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as KakshaMail;
              cloudMails.push({ ...data, id: docSnap.id });
            });

            // Sort by newest first
            cloudMails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

            setMails((prevLocal) => {
              // Merge cloud mails with any local mock mails that haven't been pushed
              const cloudIds = new Set(cloudMails.map((m) => m.id));
              const nonCloudLocal = prevLocal.filter((m) => !cloudIds.has(m.id));
              return [...cloudMails, ...nonCloudLocal];
            });
          }
        },
        (error) => {
          console.warn('Firebase Firestore real-time messaging fallback active:', error.message);
          setIsFirestoreConnected(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not initialize Firestore real-time listener:', err);
    }
  }, []);

  // Real-time Cloud Firestore listener for Users (cross-device contact lookup)
  useEffect(() => {
    try {
      const usersCollection = collection(db, 'kaksha_users');
      const unsubscribe = onSnapshot(
        usersCollection,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudUsers: User[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as User;
              cloudUsers.push({ ...data, id: docSnap.id });
            });

            setUsers((prevLocal) => {
              const cloudIds = new Set(cloudUsers.map((u) => u.id));
              const localOnlyUsers = prevLocal.filter((u) => !cloudIds.has(u.id));
              const merged = cloudUsers.map((cu) => {
                const local = prevLocal.find((lu) => lu.id === cu.id);
                return local ? { ...cu, ...local } : cu;
              });
              return [...merged, ...localOnlyUsers];
            });
          }
        },
        (error) => {
          console.warn('Firestore users sync fallback active:', error.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not initialize Firestore users listener:', err);
    }
  }, []);

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
      setSessionWarning(null);
    }
  };

  const logout = () => {
    signOut(auth).catch(() => {});
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSessionWarning(null);
  };

  const loginWithGoogleUser = (
    googleUser: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null },
    role: UserRole,
    deviceId: string
  ): User => {
    const existing = users.find((u) => u.firebaseUid === googleUser.uid || (u.email && googleUser.email && u.email.toLowerCase() === googleUser.email.toLowerCase()));

    if (existing) {
      const updatedUser: User = {
        ...existing,
        firebaseUid: googleUser.uid,
        email: googleUser.email || existing.email,
        name: existing.name || googleUser.displayName || 'Google User',
        avatarUrl: existing.avatarUrl || googleUser.photoURL || undefined,
        activeDeviceId: deviceId,
        authProvider: 'google'
      };
      setUsers((prev) => prev.map((u) => (u.id === existing.id ? updatedUser : u)));
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);

      // Sync to Firestore on login
      try {
        setDoc(doc(db, 'kaksha_users', updatedUser.id), {
          id: updatedUser.id,
          kakshaId: updatedUser.kakshaId || '',
          name: updatedUser.name || 'User',
          email: updatedUser.email || '',
          role: updatedUser.role || 'student',
          authProvider: updatedUser.authProvider || 'google',
          avatarUrl: updatedUser.avatarUrl || '',
          phone: updatedUser.phone || '',
          createdAt: updatedUser.createdAt || new Date().toISOString(),
        }, { merge: true }).catch(() => {});
      } catch (_) {}

      return updatedUser;
    }

    // New Google User
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    const kakshaId = role === 'teacher' ? `KLB-T-${nextNum}` : `KLB-S-${nextNum}`;
    const newUser: User = {
      id: 'usr_' + googleUser.uid,
      firebaseUid: googleUser.uid,
      email: googleUser.email || undefined,
      kakshaId,
      name: googleUser.displayName || (role === 'teacher' ? 'Teacher' : 'Student'),
      phone: '',
      role,
      activeDeviceId: deviceId,
      authProvider: 'google',
      avatarUrl: googleUser.photoURL || `https://images.unsplash.com/photo-${role === 'teacher' ? '1534528741775-53994a69daeb' : '1539571696357-5a69c17a67c6'}?auto=format&fit=crop&q=80&w=250`,
      blockedKakshaIds: [],
      createdAt: new Date().toISOString()
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);

    // Save profile to Firestore so other devices can find this user by Kaksha ID
    try {
      const safeDocId = newUser.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      setDoc(doc(db, 'kaksha_users', safeDocId), {
        id: newUser.id,
        kakshaId: newUser.kakshaId,
        name: newUser.name,
        email: newUser.email || '',
        role: newUser.role,
        authProvider: newUser.authProvider,
        avatarUrl: newUser.avatarUrl || '',
        phone: newUser.phone || '',
        createdAt: newUser.createdAt,
      }, { merge: true }).catch((err) => {
        console.error('Firestore save new user error:', err);
      });
    } catch (err) {
      console.error('Firestore save new user exception:', err);
    }

    return newUser;
  };

  const loginWithSupabaseEmailUser = (
    supabaseUser: { id: string; email?: string | null; user_metadata?: any },
    role: UserRole,
    deviceId: string
  ): User => {
    const userEmail = supabaseUser.email?.toLowerCase();
    const existing = users.find((u) => u.supabaseId === supabaseUser.id || (u.email && userEmail && u.email.toLowerCase() === userEmail));

    if (existing) {
      const updatedUser: User = {
        ...existing,
        supabaseId: supabaseUser.id,
        email: userEmail || existing.email,
        activeDeviceId: deviceId,
        authProvider: 'supabase'
      };
      setUsers((prev) => prev.map((u) => (u.id === existing.id ? updatedUser : u)));
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);

      // Sync to Firestore on login
      try {
        setDoc(doc(db, 'kaksha_users', updatedUser.id), {
          id: updatedUser.id,
          kakshaId: updatedUser.kakshaId || '',
          name: updatedUser.name || 'User',
          email: updatedUser.email || '',
          role: updatedUser.role || 'student',
          authProvider: updatedUser.authProvider || 'supabase',
          avatarUrl: updatedUser.avatarUrl || '',
          phone: updatedUser.phone || '',
          createdAt: updatedUser.createdAt || new Date().toISOString(),
        }, { merge: true }).catch(() => {});
      } catch (_) {}

      return updatedUser;
    }

    // New Supabase Email User
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    const kakshaId = role === 'teacher' ? `KLB-T-${nextNum}` : `KLB-S-${nextNum}`;
    const metaName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name;

    const newUser: User = {
      id: 'usr_sb_' + supabaseUser.id,
      supabaseId: supabaseUser.id,
      email: userEmail || undefined,
      kakshaId,
      name: metaName || userEmail?.split('@')[0] || (role === 'teacher' ? 'Teacher' : 'Student'),
      phone: '',
      role,
      activeDeviceId: deviceId,
      authProvider: 'supabase',
      avatarUrl: `https://images.unsplash.com/photo-${role === 'teacher' ? '1534528741775-53994a69daeb' : '1539571696357-5a69c17a67c6'}?auto=format&fit=crop&q=80&w=250`,
      blockedKakshaIds: [],
      createdAt: new Date().toISOString()
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);

    // Save profile to Firestore so other devices can find this user by Kaksha ID
    try {
      setDoc(doc(db, 'kaksha_users', newUser.id), {
        id: newUser.id,
        kakshaId: newUser.kakshaId,
        name: newUser.name,
        email: newUser.email || '',
        role: newUser.role,
        authProvider: newUser.authProvider,
        avatarUrl: newUser.avatarUrl || '',
        phone: newUser.phone || '',
        createdAt: newUser.createdAt,
      }, { merge: true }).catch(() => {});
    } catch (_) {}

    return newUser;
  };

  const registerNewUser = (name: string, phone: string, role: UserRole, deviceId: string, firebaseUid?: string): User => {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    const kakshaId = role === 'teacher' ? `KLB-T-${nextNum}` : `KLB-S-${nextNum}`;

    const newUser: User = {
      id: 'user-' + Date.now(),
      firebaseUid,
      kakshaId,
      name,
      phone,
      role,
      activeDeviceId: deviceId || 'device-primary',
      avatarUrl: `https://images.unsplash.com/photo-${role === 'teacher' ? '1534528741775-53994a69daeb' : '1539571696357-5a69c17a67c6'}?auto=format&fit=crop&q=80&w=250`,
      blockedKakshaIds: [],
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  };

  const createBatch = (
    name: string,
    subject: string,
    capacity: number,
    validUntil: string,
    description: string
  ): { success: boolean; message: string; batch?: Batch } => {
    if (!currentUser) return { success: false, message: 'Unauthenticated' };

    const cleanName = name.trim();
    if (!cleanName) {
      return { success: false, message: 'Batch name cannot be empty.' };
    }

    // Restriction: Reject creation if a batch with the same name already exists for this teacher/account
    const existing = batches.find(
      (b) => b.teacherId === currentUser.id && b.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (existing) {
      return {
        success: false,
        message: `A batch named "${cleanName}" already exists. Batch names must be unique; creating multiple batches with the same name is not allowed.`,
      };
    }

    const randomCode = subject.slice(0, 4).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newBatch: Batch = {
      id: 'batch-' + Date.now(),
      code: randomCode,
      teacherId: currentUser.id,
      teacherKakshaId: currentUser.kakshaId,
      teacherName: currentUser.name,
      name: cleanName,
      subject,
      studentCapacity: capacity || 50,
      validUntil: validUntil || '2027-03-31',
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };

    setBatches((prev) => [newBatch, ...prev]);
    return {
      success: true,
      message: `Batch "${cleanName}" created successfully with Batch Code ${randomCode}!`,
      batch: newBatch,
    };
  };

  const deleteBatch = (batchId: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Unauthenticated' };
    const targetBatch = batches.find((b) => b.id === batchId);
    if (!targetBatch) return { success: false, message: 'Batch not found' };

    // Remove batch and all associated memberships, classes, content, announcements, resources, attendances, and recurring slots
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    setMemberships((prev) => prev.filter((m) => m.batchId !== batchId));
    setClasses((prev) => prev.filter((c) => c.batchId !== batchId));
    setContent((prev) => prev.filter((cnt) => cnt.batchId !== batchId));
    setAnnouncements((prev) => prev.filter((a) => a.batchId !== batchId));
    setResources((prev) => prev.filter((r) => r.batchId !== batchId));
    setAttendances((prev) => prev.filter((att) => att.batchId !== batchId));
    setRecurringSlots((prev) => prev.filter((slot) => slot.batchId !== batchId));

    return { success: true, message: `Batch "${targetBatch.name}" was permanently deleted.` };
  };

  // Anti-leak Batch Join: Creates a Pending Join Request Mail sent to the Teacher in Cloud Firestore & Local
  const joinBatchByCode = (code: string) => {
    if (!currentUser) return { success: false, message: 'Must be logged in to join batch.' };
    const cleanCode = code.trim().toUpperCase();
    const batch = batches.find((b) => b.code === cleanCode);

    if (!batch) {
      return { success: false, message: 'Invalid Batch Code. Please check the code provided by your teacher.' };
    }

    const existingMem = memberships.find((m) => m.batchId === batch.id && m.studentId === currentUser.id);
    if (existingMem) {
      return { success: false, message: `You are already enrolled in "${batch.name}".` };
    }

    // Check if there is already a pending join request
    const existingPendingRequest = mails.find(
      (m) =>
        m.type === 'join_request' &&
        m.senderId === currentUser.kakshaId &&
        m.batchCode === batch.code &&
        m.status === 'unread'
    );

    if (existingPendingRequest) {
      return {
        success: true,
        isPending: true,
        message: `Your request to join "${batch.name}" is already pending teacher approval.`,
        batch,
      };
    }

    const currentCount = memberships.filter((m) => m.batchId === batch.id).length;
    if (currentCount >= batch.studentCapacity) {
      return { success: false, message: 'This batch has reached its maximum student capacity.' };
    }

    // Send Join Request Mail to Teacher
    const requestMail: KakshaMail = {
      id: 'mail-' + Date.now(),
      senderId: currentUser.kakshaId,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      receiverId: batch.teacherKakshaId,
      type: 'join_request',
      subject: `Batch Join Request: ${batch.name}`,
      body: `Student ${currentUser.name} (Kaksha ID: ${currentUser.kakshaId}, Phone: ${currentUser.phone}) has requested to join your batch "${batch.name}" (${batch.code}). Please review and approve to grant access.`,
      batchCode: batch.code,
      status: 'unread',
      sentAt: new Date().toISOString(),
    };

    setMails((prev) => [requestMail, ...prev]);

    // Push to Firebase Cloud Firestore
    setDoc(doc(db, 'kaksha_mails', requestMail.id), requestMail).catch((err) => {
      console.warn('Firebase Firestore write warning:', err.message);
    });

    return {
      success: true,
      isPending: true,
      message: `Join request sent to ${batch.teacherName}! You will be enrolled once the teacher approves.`,
      batch,
    };
  };

  const createScheduleClass = (
    classData: Omit<ScheduleClass, 'id' | 'teacherId' | 'teacherName'>
  ): ScheduleClass => {
    if (!currentUser) throw new Error('Unauthenticated');
    const newClass: ScheduleClass = {
      ...classData,
      id: 'cls-' + Date.now(),
      teacherId: currentUser.id,
      teacherName: currentUser.name,
    };

    setClasses((prev) => [...prev, newClass]);

    // Auto-generate notice for student live updates feed when teacher schedules a new/unscheduled class
    const targetBatch = batches.find((b) => b.id === classData.batchId);
    if (targetBatch && currentUser) {
      const autoNotice: Announcement = {
        id: 'anc-cls-' + Date.now(),
        batchId: classData.batchId,
        batchName: targetBatch.name,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        title: `📅 Class Update: ${classData.title}`,
        content: `Special class scheduled for ${classData.date} (${classData.startTime} - ${classData.endTime}): "${classData.title}". Mode: ${classData.classType === 'online' ? 'Live Online' : 'In-Person'}.`,
        postedAt: new Date().toISOString(),
      };
      setAnnouncements((prev) => [autoNotice, ...prev]);
    }

    return newClass;
  };

  const updateScheduleClass = (classId: string, classData: Partial<ScheduleClass>) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, ...classData } : c))
    );
  };

  const deleteScheduleClass = (classId: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
  };

  const createRecurringSlot = (
    slotData: Omit<RecurringTimetableSlot, 'id' | 'createdAt' | 'teacherId'>
  ): RecurringTimetableSlot => {
    if (!currentUser) throw new Error('Unauthenticated');
    const newSlot: RecurringTimetableSlot = {
      ...slotData,
      id: 'rec-' + Date.now(),
      teacherId: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    setRecurringSlots((prev) => [...prev, newSlot]);
    return newSlot;
  };

  const updateRecurringSlot = (slotId: string, slotData: Partial<RecurringTimetableSlot>) => {
    setRecurringSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, ...slotData } : s))
    );
  };

  const deleteRecurringSlot = (slotId: string) => {
    setRecurringSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  const togglePaymentStatus = (membershipId: string) => {
    setMemberships((prev) =>
      prev.map((m) => {
        if (m.id === membershipId) {
          const newStatus = m.paymentStatus === 'paid' ? 'pending' : 'paid';
          return {
            ...m,
            paymentStatus: newStatus,
            paymentMode: newStatus === 'paid' ? (m.paymentMode || 'UPI') : 'Pending',
            paymentDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return m;
      })
    );
  };

  const updateMembershipPayment = (
    membershipId: string,
    status: 'paid' | 'pending',
    mode: 'Cash' | 'UPI' | 'Bank' | 'Pending' = 'UPI',
    period?: string
  ) => {
    setMemberships((prev) =>
      prev.map((m) => {
        if (m.id === membershipId) {
          return {
            ...m,
            paymentStatus: status,
            paymentMode: mode,
            lastPaymentPeriod: period || m.lastPaymentPeriod,
            paymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return m;
      })
    );
  };

  const resetAllFeesForTeacher = (teacherId: string) => {
    const teacherBatchIds = batches.filter((b) => b.teacherId === teacherId).map((b) => b.id);
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    setMemberships((prev) =>
      prev.map((m) =>
        teacherBatchIds.includes(m.batchId)
          ? { ...m, paymentStatus: 'pending', paymentMode: 'Pending', lastPaymentPeriod: currentMonth }
          : m
      )
    );
  };

  const removeStudentFromBatch = (membershipId: string) => {
    setMemberships((prev) => prev.filter((m) => m.id !== membershipId));
  };

  const addBatchContent = (contentData: Omit<BatchContent, 'id' | 'createdAt'>): BatchContent => {
    const newContent: BatchContent = {
      ...contentData,
      id: 'cnt-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setContent((prev) => [newContent, ...prev]);
    return newContent;
  };

  const postAnnouncement = (batchId: string, title: string, bodyContent: string): Announcement => {
    if (!currentUser) throw new Error('Unauthenticated');
    const targetBatch = batches.find((b) => b.id === batchId);
    const newAnnouncement: Announcement = {
      id: 'anc-' + Date.now(),
      batchId,
      batchName: targetBatch ? targetBatch.name : 'Batch',
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      title,
      content: bodyContent,
      postedAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    return newAnnouncement;
  };

  const sendKakshaMail = (
    receiverIdOrPhone: string,
    subject: string,
    body: string,
    type: KakshaMail['type'] = 'direct_message',
    batchCode?: string
  ) => {
    if (!currentUser) return { success: false, message: 'Unauthenticated' };
    const cleanInput = receiverIdOrPhone.trim();
    const cleanUpperInput = cleanInput.toUpperCase();
    const digitsOnlyInput = cleanInput.replace(/\D/g, ''); // Extract numbers for phone search

    // Search by Kaksha ID OR by Mobile Phone Number
    const targetUser = users.find((u) => {
      const userKakshaId = u.kakshaId.toUpperCase();
      if (userKakshaId === cleanUpperInput) return true;

      // Phone matching logic (matching raw digits e.g. 9876543210 or formatted +91 98765 43210)
      const userPhoneDigits = u.phone.replace(/\D/g, '');
      if (digitsOnlyInput.length >= 10 && userPhoneDigits.endsWith(digitsOnlyInput.slice(-10))) {
        return true;
      }

      return false;
    });

    if (!targetUser) {
      return {
        success: false,
        message: `No Kaksha user found with ID or Phone number '${cleanInput}'. Please check the ID or mobile number.`,
      };
    }

    if (targetUser.blockedKakshaIds?.includes(currentUser.kakshaId)) {
      return { success: false, message: 'Your message could not be delivered due to privacy settings.' };
    }

    const cleanReceiverId = targetUser.kakshaId;

    const newMail: KakshaMail = {
      id: 'mail-' + Date.now(),
      senderId: currentUser.kakshaId,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      receiverId: cleanReceiverId,
      type,
      subject,
      body,
      batchCode,
      status: 'unread',
      sentAt: new Date().toISOString(),
    };

    setMails((prev) => [newMail, ...prev]);

    // Push real-time to Firebase Cloud Firestore
    setDoc(doc(db, 'kaksha_mails', newMail.id), newMail).catch((err) => {
      console.warn('Firebase Firestore mail write error:', err.message);
    });

    return { success: true, message: 'Message sent successfully to ' + targetUser.name + ' (' + cleanReceiverId + ').' };
  };

  const markMailAsRead = (mailId: string) => {
    setMails((prev) =>
      prev.map((m) => {
        if (m.id === mailId && m.status === 'unread') {
          updateDoc(doc(db, 'kaksha_mails', mailId), { status: 'read' }).catch((err) => {
            console.warn('Firestore mark read warning:', err.message);
          });
          return { ...m, status: 'read' };
        }
        return m;
      })
    );
  };

  const markChatThreadAsRead = (otherKakshaId: string) => {
    if (!currentUser) return;
    setMails((prev) =>
      prev.map((m) => {
        if (m.receiverId === currentUser.kakshaId && m.senderId === otherKakshaId && m.status === 'unread') {
          updateDoc(doc(db, 'kaksha_mails', m.id), { status: 'read' }).catch((err) => {
            console.warn('Firestore mark thread read warning:', err.message);
          });
          return { ...m, status: 'read' };
        }
        return m;
      })
    );
  };

  const respondToMailRequest = (mailId: string, action: 'accept' | 'decline') => {
    const targetMail = mails.find((m) => m.id === mailId);
    if (!targetMail) return;

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    setMails((prev) =>
      prev.map((m) => (m.id === mailId ? { ...m, status: newStatus } : m))
    );

    // Update Firestore in real time
    updateDoc(doc(db, 'kaksha_mails', mailId), { status: newStatus }).catch((err) => {
      console.warn('Firestore updateDoc warning:', err.message);
    });

    if (action === 'accept' && targetMail.batchCode) {
      const student = users.find((u) => u.kakshaId === targetMail.senderId);
      const batch = batches.find((b) => b.code === targetMail.batchCode);
      if (student && batch) {
        const existing = memberships.find((mem) => mem.batchId === batch.id && mem.studentId === student.id);
        if (!existing) {
          const newMem: BatchMembership = {
            id: 'mem-' + Date.now(),
            batchId: batch.id,
            studentId: student.id,
            studentName: student.name,
            studentKakshaId: student.kakshaId,
            studentPhone: student.phone,
            joinedAt: new Date().toISOString(),
            paymentStatus: 'pending',
            paymentMode: 'Pending',
            lastPaymentPeriod: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          };
          setMemberships((prev) => [...prev, newMem]);

          // Send automated acceptance confirmation to student
          const confirmMail: KakshaMail = {
            id: 'mail-' + Date.now() + '-confirm',
            senderId: targetMail.receiverId,
            senderName: currentUser ? currentUser.name : 'Teacher',
            senderRole: 'teacher',
            receiverId: student.kakshaId,
            type: 'system',
            subject: `Enrolled: Request to join "${batch.name}" Approved!`,
            body: `Congratulations ${student.name}! Your request to join batch "${batch.name}" (${batch.code}) has been approved by ${currentUser?.name || 'your teacher'}. You can now view class schedules, join live lectures, and access study notes.`,
            batchCode: batch.code,
            status: 'unread',
            sentAt: new Date().toISOString(),
          };

          setMails((prev) => [confirmMail, ...prev]);

          // Save confirmation to Firestore
          setDoc(doc(db, 'kaksha_mails', confirmMail.id), confirmMail).catch((err) => {
            console.warn('Firestore confirm write warning:', err.message);
          });
        }
      }
    } else if (action === 'decline') {
      const student = users.find((u) => u.kakshaId === targetMail.senderId);
      if (student) {
        const declineMail: KakshaMail = {
          id: 'mail-' + Date.now() + '-declined',
          senderId: targetMail.receiverId,
          senderName: currentUser ? currentUser.name : 'Teacher',
          senderRole: 'teacher',
          receiverId: student.kakshaId,
          type: 'system',
          subject: `Update on Batch Join Request`,
          body: `Hello ${student.name}, your request to join batch code ${targetMail.batchCode || ''} was not approved at this time. Please contact your tuition teacher directly.`,
          batchCode: targetMail.batchCode,
          status: 'unread',
          sentAt: new Date().toISOString(),
        };

        setMails((prev) => [declineMail, ...prev]);

        // Save decline to Firestore
        setDoc(doc(db, 'kaksha_mails', declineMail.id), declineMail).catch((err) => {
          console.warn('Firestore decline write warning:', err.message);
        });
      }
    }
  };

  const blockUserKakshaId = (targetKakshaId: string) => {
    if (!currentUser) return;
    const updatedBlocked = [...(currentUser.blockedKakshaIds || []), targetKakshaId];
    const updatedUser = { ...currentUser, blockedKakshaIds: updatedBlocked };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  const addClassResource = (resourceData: Omit<ClassResource, 'id' | 'uploadedAt'>): ClassResource => {
    const newRes: ClassResource = {
      ...resourceData,
      id: 'res-' + Date.now(),
      uploadedAt: new Date().toISOString(),
    };
    setResources((prev) => [newRes, ...prev]);

    // Auto-generate notice for student live updates feed when teacher uploads file/resource
    const targetBatch = batches.find((b) => b.id === resourceData.batchId);
    if (targetBatch && currentUser) {
      const autoNotice: Announcement = {
        id: 'anc-auto-' + Date.now(),
        batchId: resourceData.batchId,
        batchName: targetBatch.name,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        title: `📄 New Material: ${resourceData.title}`,
        content: `${currentUser.name} uploaded new ${resourceData.type.replace('_', ' ')}: "${resourceData.title}". Tap to view/download.`,
        postedAt: new Date().toISOString(),
      };
      setAnnouncements((prev) => [autoNotice, ...prev]);
    }

    return newRes;
  };

  const deleteClassResource = (resourceId: string) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
  };

  // Mark Daily Attendance for Batch
  const markAttendance = (batchId: string, date: string, records: StudentAttendanceItem[]): AttendanceRecord => {
    const targetBatch = batches.find((b) => b.id === batchId);
    const existingIndex = attendances.findIndex((a) => a.batchId === batchId && a.date === date);

    const newRecord: AttendanceRecord = {
      id: existingIndex >= 0 ? attendances[existingIndex].id : 'att-' + Date.now(),
      batchId,
      batchName: targetBatch ? targetBatch.name : 'Batch',
      date,
      records,
      markedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      setAttendances((prev) => prev.map((a, i) => (i === existingIndex ? newRecord : a)));
    } else {
      setAttendances((prev) => [newRecord, ...prev]);
    }

    return newRecord;
  };

  // Get cumulative batch attendance stats
  const getBatchAttendanceStats = (batchId: string) => {
    const batchAtts = attendances.filter((a) => a.batchId === batchId);
    const totalSessions = batchAtts.length;
    if (totalSessions === 0) return { totalSessions: 0, averageAttendancePct: 100 };

    let totalPossible = 0;
    let totalPresent = 0;

    batchAtts.forEach((att) => {
      att.records.forEach((r) => {
        totalPossible += 1;
        if (r.status === 'present') totalPresent += 1;
      });
    });

    const averageAttendancePct = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 100;
    return { totalSessions, averageAttendancePct };
  };

  // Get cumulative student attendance stats in a batch
  const getStudentCumulativeAttendance = (batchId: string, studentId: string) => {
    const batchAtts = attendances.filter((a) => a.batchId === batchId);
    const totalSessions = batchAtts.length;
    if (totalSessions === 0) return { totalSessions: 0, attendedSessions: 0, attendancePct: 100 };

    let attendedSessions = 0;
    batchAtts.forEach((att) => {
      const studentRec = att.records.find((r) => r.studentId === studentId);
      if (studentRec && studentRec.status === 'present') {
        attendedSessions += 1;
      }
    });

    const attendancePct = Math.round((attendedSessions / totalSessions) * 100);
    return { totalSessions, attendedSessions, attendancePct };
  };

  // Get pending join requests for teacher
  const getPendingJoinRequestsForTeacher = (teacherKakshaId: string): KakshaMail[] => {
    return mails.filter((m) => m.receiverId === teacherKakshaId && m.type === 'join_request' && m.status === 'unread');
  };

  const getStudentUnifiedSchedule = (studentId: string, targetDate?: string): ScheduleClass[] => {
    const studentBatchIds = memberships.filter((m) => m.studentId === studentId).map((m) => m.batchId);
    const directClasses = classes.filter((c) => studentBatchIds.includes(c.batchId));

    if (!targetDate) {
      return directClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    const dateObj = new Date(targetDate + 'T00:00:00');
    const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    const dayOfMonth = dateObj.getDate();

    const recurringForStudent = recurringSlots.filter(
      (s) =>
        studentBatchIds.includes(s.batchId) &&
        ((s.recurrenceType === 'weekly' && s.dayOfWeek === dayOfWeek) ||
          (s.recurrenceType === 'monthly' && s.dayOfMonth === dayOfMonth))
    );

    const autoFetched: ScheduleClass[] = recurringForStudent
      .filter((slot) => !directClasses.some((dc) => dc.date === targetDate && (dc.recurringSlotId === slot.id || (dc.batchId === slot.batchId && dc.startTime === slot.startTime))))
      .map((slot) => ({
        id: `auto-${slot.id}-${targetDate}`,
        batchId: slot.batchId,
        batchCode: slot.batchCode,
        batchName: slot.batchName,
        teacherId: slot.teacherId,
        teacherName: batches.find((b) => b.id === slot.batchId)?.teacherName || 'Teacher',
        subject: slot.subject,
        title: slot.title,
        date: targetDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        classType: slot.classType,
        meetingUrl: slot.meetingUrl,
        roomNo: slot.roomNo,
        recurringSlotId: slot.id,
        isPermanent: true,
      }));

    return [...directClasses.filter((c) => c.date === targetDate), ...autoFetched].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
  };

  const getTeacherBatches = (teacherId: string): Batch[] => {
    return batches.filter((b) => b.teacherId === teacherId);
  };

  const getStudentBatches = (studentId: string): Batch[] => {
    const joinedBatchIds = memberships.filter((m) => m.studentId === studentId).map((m) => m.batchId);
    return batches.filter((b) => joinedBatchIds.includes(b.id));
  };

  const getBatchResources = (batchId: string) => {
    return resources.filter((r) => r.batchId === batchId);
  };

  const getClassResources = (classId: string) => {
    return resources.filter((r) => r.classId === classId);
  };

  const isResourceUploadLocked = (cls: ScheduleClass, lockHours = 24): boolean => {
    const classEndTimeStr = `${cls.date}T${cls.endTime || '23:59'}:00`;
    const classEndMs = cls.classEndedAt ? new Date(cls.classEndedAt).getTime() : new Date(classEndTimeStr).getTime();
    const lockTimeMs = classEndMs + lockHours * 60 * 60 * 1000;
    return Date.now() > lockTimeMs;
  };

  const updateClassTopic = (classId: string, topicCovered: string) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, topicCovered } : c))
    );
  };

  const updateUserAvatar = (avatarUrl: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, avatarUrl };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  const getTeacherRecurringSlots = (teacherId: string): RecurringTimetableSlot[] => {
    return recurringSlots.filter((s) => s.teacherId === teacherId);
  };

  const getTeacherDailySchedule = (teacherId: string, dateStr: string): ScheduleClass[] => {
    // 1. Direct scheduled classes for this date
    const directClasses = classes.filter((c) => c.teacherId === teacherId && c.date === dateStr);

    // 2. Calculate day of week & day of month from dateStr
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    const dayOfMonth = dateObj.getDate();

    // 3. Weekly recurring slots matching this day of week
    const weeklySlots = recurringSlots.filter(
      (s) => s.teacherId === teacherId && s.recurrenceType === 'weekly' && s.dayOfWeek === dayOfWeek
    );

    // 4. Monthly recurring slots matching dayOfMonth
    const monthlySlots = recurringSlots.filter(
      (s) => s.teacherId === teacherId && s.recurrenceType === 'monthly' && s.dayOfMonth === dayOfMonth
    );

    // 5. Automatically fetch permanent classes into today's timetable
    const autoFetched: ScheduleClass[] = [...weeklySlots, ...monthlySlots]
      .filter((slot) => {
        return !directClasses.some(
          (dc) => dc.recurringSlotId === slot.id || (dc.batchId === slot.batchId && dc.startTime === slot.startTime)
        );
      })
      .map((slot) => ({
        id: `auto-${slot.id}-${dateStr}`,
        batchId: slot.batchId,
        batchCode: slot.batchCode,
        batchName: slot.batchName,
        teacherId: slot.teacherId,
        teacherName: currentUser?.name || 'Teacher',
        subject: slot.subject,
        title: slot.title,
        date: dateStr,
        startTime: slot.startTime,
        endTime: slot.endTime,
        classType: slot.classType,
        meetingUrl: slot.meetingUrl,
        roomNo: slot.roomNo,
        recurringSlotId: slot.id,
        isPermanent: true,
      }));

    return [...directClasses, ...autoFetched].sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <KakshaContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        users,
        batches,
        memberships,
        classes,
        content,
        announcements,
        mails,
        resources,
        attendances,
        recurringSlots,
        sessionWarning,
        isFirestoreConnected,
        setSessionWarning,
        setCurrentUser: (user: User | null) => {
          setCurrentUser(user);
          setIsAuthenticated(!!user);
          if (user) {
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === user.id);
              if (exists) return prev.map((u) => (u.id === user.id ? user : u));
              return [...prev, user];
            });
          }
        },
        switchUser,
        loginWithGoogleUser,
        loginWithSupabaseEmailUser,
        registerNewUser,
        logout,
        createBatch,
        deleteBatch,
        joinBatchByCode,
        createScheduleClass,
        updateScheduleClass,
        deleteScheduleClass,
        createRecurringSlot,
        updateRecurringSlot,
        deleteRecurringSlot,
        getTeacherRecurringSlots,
        getTeacherDailySchedule,
        togglePaymentStatus,
        updateMembershipPayment,
        resetAllFeesForTeacher,
        removeStudentFromBatch,
        addBatchContent,
        postAnnouncement,
        sendKakshaMail,
        markMailAsRead,
        markChatThreadAsRead,
        respondToMailRequest,
        blockUserKakshaId,
        addClassResource,
        deleteClassResource,
        markAttendance,
        getBatchAttendanceStats,
        getStudentCumulativeAttendance,
        getPendingJoinRequestsForTeacher,
        getStudentUnifiedSchedule,
        getTeacherBatches,
        getStudentBatches,
        getBatchResources,
        getClassResources,
        isResourceUploadLocked,
        updateClassTopic,
        updateUserAvatar,
      }}
    >
      {children}
    </KakshaContext.Provider>
  );
};

export const useKaksha = () => {
  const context = useContext(KakshaContext);
  if (!context) {
    throw new Error('useKaksha must be used within a KakshaProvider');
  }
  return context;
};
