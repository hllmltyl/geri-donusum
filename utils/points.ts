import { doc, increment, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';

export const addPointsForWaste = async (wasteType: string, points: number) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('Kullanıcı giriş yapmamış, puan eklenemedi.');
      return false;
    }

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      points: increment(points)
    });
    
    console.log(`${wasteType} atığı için ${points} puan eklendi.`);
    return true;
  } catch (error) {
    console.error('Puan eklerken hata oluştu:', error);
    return false;
  }
};
