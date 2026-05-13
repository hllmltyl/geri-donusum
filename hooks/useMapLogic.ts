import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { RecyclingPoint } from '@/constants/types';
import { db } from '@/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import { updateWeeklyTaskProgress } from '@/utils/points';
export function useMapLogic(user: any, isAdmin: boolean, retryCount: number, showAlert: any) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [points, setPoints] = useState<RecyclingPoint[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let unsubscribe: any;

    (async () => {
      setLoading(true);
      setErrorMsg(null);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Haritayı kullanmak için konum izni gereklidir. Lütfen ayarlardan izin verip tekrar deneyin.');
        showAlert('İzin Gerekli', 'Haritayı kullanmak için konum izni gereklidir.', 'error');
        setLoading(false);
        return;
      }

      try {
        // Hızlı başlangıç için son bilinen konumu al
        let lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          setLocation(lastKnown);
          setLoading(false); // Konum gelince spinner'ı kaldırabiliriz
        }

        // Daha hassas konum için arka planda güncelle (Balanced hız/doğruluk dengesi için iyidir)
        let userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(userLocation);
      } catch (error) {
        // Eğer hiç konum yoksa ve hata alındıysa
        if (!location) {
          setErrorMsg('Konum alınamadı. Lütfen GPS özelliğinin açık olduğundan emin olun.');
          setLoading(false);
          return;
        }
      }

      try {
        unsubscribe = onSnapshot(collection(db, 'recyclingPoints'), (snapshot: any) => {
          const pointsData = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          })) as RecyclingPoint[];

          const validPoints = pointsData.filter(p => {
            // Eğer gelecekte 'rejected' statüsü eklenirse, sadece admin görebilsin
            if (p.status === 'rejected') return isAdmin;
            
            // Bunun dışında kalan tüm noktaları (Eski 'verified: false' olanlar dahil) 
            // herkes görebilsin ki imece (crowdsourcing) onayı çalışsın.
            return true;
          });

          setPoints(validPoints);
          setLoading(false);
        }, (error: any) => {
          console.error("Points listen error:", error);
          showAlert("Hata", "Veri çekilirken bir sorun oluştu: " + error.message, 'error');
          setLoading(false);
        });
      } catch (error: any) {
        console.error("Setup listen error:", error);
        setLoading(false);
      }
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, retryCount]);

  const submitPoint = useCallback(async (
    editingPoint: RecyclingPoint | null,
    newPointTitle: string,
    newPointDescription: string,
    newPointType: string,
    centerCoordinate: { latitude: number, longitude: number }
  ) => {
    if (!newPointTitle || !newPointType || !centerCoordinate || !user) {
      showAlert("Eksik Bilgi", "Lütfen başlık ve kategori seçiniz.", 'warning');
      return false;
    }

    setSubmitting(true);
    try {
      if (editingPoint) {
        await updateDoc(doc(db, 'recyclingPoints', editingPoint.id), {
          title: newPointTitle,
          description: newPointDescription,
          type: newPointType,
          updatedAt: serverTimestamp(),
        });
        showAlert("Başarılı", "Nokta bilgileri güncellendi.", 'success');
      } else {
        const batch = writeBatch(db);
        const newPointRef = doc(collection(db, 'recyclingPoints'));
        
        batch.set(newPointRef, {
          title: newPointTitle,
          description: newPointDescription,
          type: newPointType,
          latitude: centerCoordinate.latitude,
          longitude: centerCoordinate.longitude,
          verified: false,
          status: 'pending',
          verifiedBy: [],
          dropoffCount: 0,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });

        const userRef = doc(db, 'users', user.uid);
        batch.set(userRef, { xp: increment(50) }, { merge: true });

        await batch.commit();

        updateWeeklyTaskProgress(user.uid, 'point_added').catch(console.error);

        showAlert("Başarılı", "Nokta onaya gönderildi! +50 XP kazandınız.", 'success');
      }
      return true;
    } catch (error: any) {
      console.error("Submit point error:", error);
      showAlert("Hata", "İşlem sırasında bir sorun oluştu.", 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, showAlert]);

  const verifyPoint = useCallback(async (id: string) => {
    if (!isAdmin) return false;
    try {
      await updateDoc(doc(db, 'recyclingPoints', id), {
        verified: true,
        updatedAt: serverTimestamp(),
      });
      showAlert("Başarılı", "Nokta onaylandı.", 'success');
      return true;
    } catch (error) {
      console.error("Verify error:", error);
      showAlert("Hata", "Onaylama işlemi başarısız.", 'error');
      return false;
    }
  }, [isAdmin, showAlert]);

  const deletePoint = useCallback(async (id: string) => {
    if (!isAdmin) return false;
    try {
      await deleteDoc(doc(db, 'recyclingPoints', id));
      showAlert("Başarılı", "Nokta başarıyla silindi.", 'success');
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      showAlert("Hata", "Silme işlemi başarısız.", 'error');
      return false;
    }
  }, [isAdmin, showAlert]);

  return {
    location,
    points,
    errorMsg,
    loading,
    submitting,
    submitPoint,
    verifyPoint,
    deletePoint
  };
}
