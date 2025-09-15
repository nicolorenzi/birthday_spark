import {
    Timestamp,
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    updateDoc
} from 'firebase/firestore';
import { auth, db } from '../FirebaseConfig';

export interface Birthday {
  id?: string;
  name: string;
  date: Date;
  time?: Date;
  includeTime: boolean;
  createdAt: Date;
}

// Get current user ID
const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

// Add a new birthday for the current user
export const addBirthday = async (birthdayData: Omit<Birthday, 'id' | 'createdAt'>): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const birthdayDoc = {
    ...birthdayData,
    date: Timestamp.fromDate(birthdayData.date),
    time: birthdayData.time ? Timestamp.fromDate(birthdayData.time) : null,
    createdAt: Timestamp.fromDate(new Date())
  };

  const docRef = await addDoc(
    collection(db, 'users', userId, 'birthdays'), 
    birthdayDoc
  );

  return docRef.id;
};

// Get all birthdays for the current user
export const getBirthdays = async (): Promise<Birthday[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const q = query(
    collection(db, 'users', userId, 'birthdays'),
    orderBy('date', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const birthdays: Birthday[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    birthdays.push({
      id: doc.id,
      name: data.name,
      date: data.date.toDate(),
      time: data.time?.toDate(),
      includeTime: data.includeTime,
      createdAt: data.createdAt.toDate()
    });
  });

  return birthdays;
};

// Delete a birthday
export const deleteBirthday = async (birthdayId: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  await deleteDoc(doc(db, 'users', userId, 'birthdays', birthdayId));
};

// Update a birthday
export const updateBirthday = async (birthdayId: string, updates: Partial<Birthday>): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const updateData: any = { ...updates };
  
  // Convert Date objects to Timestamps
  if (updates.date) {
    updateData.date = Timestamp.fromDate(updates.date);
  }
  if (updates.time) {
    updateData.time = Timestamp.fromDate(updates.time);
  }

  await updateDoc(doc(db, 'users', userId, 'birthdays', birthdayId), updateData);
};

// Listen to real-time updates for birthdays
export const subscribeToBirthdays = (
  callback: (birthdays: Birthday[]) => void
): (() => void) => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const q = query(
    collection(db, 'users', userId, 'birthdays'),
    orderBy('date', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const birthdays: Birthday[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      birthdays.push({
        id: doc.id,
        name: data.name,
        date: data.date.toDate(),
        time: data.time?.toDate(),
        includeTime: data.includeTime,
        createdAt: data.createdAt.toDate()
      });
    });
    callback(birthdays);
  });
};
