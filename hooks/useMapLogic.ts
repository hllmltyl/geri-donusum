import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { RecyclingPoint } from '@/constants/types';
import { db } from '@/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

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
            if (isAdmin) return true;
            if (p.verified) return true;
            if (user && p.createdBy === user.uid) return true;
            return false;
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
        await addDoc(collection(db, 'recyclingPoints'), {
          title: newPointTitle,
          description: newPointDescription,
          type: newPointType,
          latitude: centerCoordinate.latitude,
          longitude: centerCoordinate.longitude,
          verified: false,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });
        showAlert("Başarılı", "Geri dönüşüm noktası onaya gönderildi! Teşekkür ederiz.", 'success');
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
