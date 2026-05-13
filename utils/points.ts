import { doc, increment, updateDoc, getDoc, writeBatch, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';

export const addPointsForWaste = async (wasteType: string, points: number) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      // console.warn('Kullanıcı giriş yapmamış, puan eklenemedi.');
      return false;
    }

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      points: increment(points)
    });
    
    // console.log(`${wasteType} atığı için ${points} puan eklendi.`);
    return true;
  } catch (error) {
    // console.error('Puan eklerken hata oluştu:', error);
    return false;
  }
};

/**
 * AI Taraması sonucuna göre kazanılacak XP'yi hesaplar.
 * @param wasteType Atığın türü (örn: plastik, pil, metal)
 * @param confidence AI tahmininin güven skoru (0 ile 1 arasında, örn: 0.85)
 * @returns Hesaplanmış XP miktarı
 */
export const calculateScanPoints = (wasteType: string, confidence: number): number => {
  let xp = 10; // Temel Puan

  // Güven (Confidence) Bonusu
  if (confidence >= 0.90) {
    xp += 5;
  } else if (confidence >= 0.80) {
    xp += 3;
  }

  // Nadirlik Bonusu
  const type = wasteType.toLowerCase();
  
  const commonTypes = ['plastik', 'kagit', 'kağıt', 'cam'];
  const mediumTypes = ['metal', 'karton', 'organik', 'kompozit', 'tekstil', 'ahsap', 'ahşap'];
  const rareTypes = ['pil', 'elektronik', 'kimyasal', 'atik_yag', 'atık_yağ', 'boya', 'tibbi', 'tıbbi'];

  if (rareTypes.includes(type)) {
    xp += 5;
  } else if (mediumTypes.includes(type)) {
    xp += 3;
  }
  // Yaygın olanlar (commonTypes) için +0 XP (xp değişmez)

  return xp;
};

/**
 * AI Taraması sonrasında veritabanı işlemlerini ve hile koruması (anti-cheat) mantığını yürütür.
 * @param userId İşlemi yapan kullanıcının ID'si
 * @param wasteType Atığın türü
 * @param confidence Güven skoru
 */
export const processScanAction = async (userId: string, wasteType: string, confidence: number) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('Kullanıcı bulunamadı.');
  }

  const userData = userSnap.data();
  const now = new Date();
  
  let lastScanDate = userData.lastScanDate;
  // Eğer lastScanDate Firestore Timestamp ise Date'e çevir, string ise parse et
  if (lastScanDate && typeof lastScanDate.toDate === 'function') {
    lastScanDate = lastScanDate.toDate();
  } else if (typeof lastScanDate === 'string' || typeof lastScanDate === 'number') {
    lastScanDate = new Date(lastScanDate);
  }

  let dailyScanCount = userData.dailyScanCount || 0;
  let earnedXp = 0;
  let isNewDay = true;

  if (lastScanDate && lastScanDate instanceof Date && !isNaN(lastScanDate.getTime())) {
    const timeDiffInSeconds = (now.getTime() - lastScanDate.getTime()) / 1000;
    
    // 1. Cooldown Kontrolü (60 saniye)
    if (timeDiffInSeconds < 60) {
      throw new Error('Çok hızlı tarama yapıyorsunuz. Lütfen 60 saniye bekleyin.');
    }

    // Aynı gün mü kontrolü
    const lastScanDay = lastScanDate.toDateString();
    const today = now.toDateString();

    if (lastScanDay === today) {
      isNewDay = false;
    }
  }

  // Yeni günse limiti sıfırla
  if (isNewDay) {
    dailyScanCount = 0;
  }

  // 2. Günlük Limit Kontrolü (Günde max 5 tarama puan verir)
  if (dailyScanCount >= 5) {
    earnedXp = 0; // Limit aşıldı, tarama kabul edilir ama XP verilmez
  } else {
    earnedXp = calculateScanPoints(wasteType, confidence);
  }

  // 3. Veritabanı Yazma İşlemleri (Batch)
  const batch = writeBatch(db);

  // Kullanıcıyı güncelle
  batch.update(userRef, {
    xp: increment(earnedXp),
    dailyScanCount: isNewDay ? 1 : increment(1),
    lastScanDate: now,
  });

  // Log kaydı oluştur (scans koleksiyonu)
  const scanRef = doc(collection(db, 'scans'));
  batch.set(scanRef, {
    userId,
    timestamp: now,
    wasteType,
    confidence,
    pointsEarned: earnedXp,
    isPhysicalDropoff: false
  });

  await batch.commit();

  return {
    earnedXp,
    wasteType,
    confidence,
    dailyScanCount: isNewDay ? 1 : dailyScanCount + 1,
    limitReached: dailyScanCount >= 5
  };
};

/**
 * İki koordinat arasındaki mesafeyi metre cinsinden hesaplar (Haversine Formülü).
 */
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Dünya'nın yarıçapı (metre)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Taranan atığı fiziksel bir kutuya atma işlemini doğrular (Smart Drop-off).
 * @param userId Kullanıcı ID
 * @param userLat Kullanıcının enlemi
 * @param userLng Kullanıcının boylamı
 * @param selectedPointId Kullanıcının haritadan seçtiği kutunun ID'si
 * @param scannedWasteType Taranan atığın kategorisi
 */
export const verifyPhysicalDropoff = async (
  userId: string, 
  userLat: number, 
  userLng: number, 
  selectedPointId: string, 
  scannedWasteType: string
) => {
  const pointRef = doc(db, 'recyclingPoints', selectedPointId);
  const pointSnap = await getDoc(pointRef);

  if (!pointSnap.exists()) {
    throw new Error('Seçilen geri dönüşüm noktası bulunamadı.');
  }

  const pointData = pointSnap.data();
  const pointLat = pointData.latitude;
  const pointLng = pointData.longitude;

  if (!pointLat || !pointLng) {
    throw new Error('Kutunun konum bilgisi eksik.');
  }

  // 1. Mesafe Kontrolü (50 metre)
  const distance = getDistanceFromLatLonInMeters(userLat, userLng, pointLat, pointLng);
  if (distance > 50) {
    throw new Error('Seçtiğiniz kutudan çok uzaktasınız. Lütfen kutunun yanına gidin.');
  }

  // 2. Kategori Eşleştirme (Kritik)
  // 'mixed' veya projede sık kullanılan 'diger' türlerini joker kabul ediyoruz.
  const allowedTypes = [pointData.type, 'mixed', 'diger'];
  if (!allowedTypes.includes(scannedWasteType)) {
    throw new Error(`Yanlış Kutu! Taramış olduğunuz atık ${scannedWasteType}, ancak seçtiğiniz kutu ${pointData.type} kategorisine ait.`);
  }

  const batch = writeBatch(db);
  const userRef = doc(db, 'users', userId);

  // 3. Puanlama ve Veri Güncelleme
  let totalXpToGive = 20;
  let dropoffMessage = 'Tebrikler! +20 XP kazandınız.';
  let pointUpdates: any = { dropoffCount: increment(1) };
  let isVerifying = false;

  if (pointData.status === 'pending') {
    const verifiedBy = pointData.verifiedBy || [];
    
    // Kullanıcı bu noktayı daha önce doğrulamadıysa ekle
    if (!verifiedBy.includes(userId)) {
      verifiedBy.push(userId);
      pointUpdates.verifiedBy = verifiedBy; 
      
      // Başkasının noktasını onaylamak +15 XP verir
      if (pointData.createdBy !== userId) {
        totalXpToGive += 15;
        dropoffMessage = 'Tebrikler! +35 XP kazandınız. (Kutu Onaylama Bonusu dahil!)';
        isVerifying = true;
      }
    }

    // Eğer onaylayan kişi sayısı 5'e ulaştıysa harita noktasını onaylı duruma geçir
    if (verifiedBy.length >= 5) {
      pointUpdates.status = 'approved';

      // Noktayı ilk ekleyen kişiye +10 XP Doğrulanma Bonusu (Crowdsourcing)
      if (pointData.createdBy && pointData.createdBy !== 'system') {
        const creatorRef = doc(db, 'users', pointData.createdBy);
        batch.set(creatorRef, { xp: increment(10) }, { merge: true });
      }
    }
  } else {
    // Eğer nokta zaten approved ise (normal pasif gelir: +5 XP)
    if (pointData.createdBy && pointData.createdBy !== 'system' && pointData.createdBy !== userId) {
      const creatorRef = doc(db, 'users', pointData.createdBy);
      batch.set(creatorRef, { xp: increment(5) }, { merge: true });
    }
  }

  batch.set(userRef, { xp: increment(totalXpToGive) }, { merge: true });
  batch.update(pointRef, pointUpdates);

  await batch.commit();

  return {
    success: true,
    message: dropoffMessage,
    distanceMeters: distance,
    pointId: selectedPointId,
    verifiedPoint: isVerifying
  };
};

/**
 * Kullanıcının konumuna 50 metre mesafedeki geri dönüşüm kutularını getirir.
 * scan.tsx içerisindeki kutu seçim ekranı (Smart Drop-off) için kullanılır.
 */
export const getNearbyPoints = async (userLat: number, userLng: number, radiusMeters: number = 50) => {
  const pointsRef = collection(db, 'recyclingPoints');
  // Tüm noktaları çekiyoruz ki eski (status alanı olmayan ama verified: false olan) pasif noktalar da gelsin.
  const snapshot = await getDocs(pointsRef);

  const nearbyPoints: any[] = [];

  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    
    // Eğer reddedilmiş bir noktaysa atla
    if (data.status === 'rejected') return;

    if (data.latitude && data.longitude) {
      const distance = getDistanceFromLatLonInMeters(userLat, userLng, data.latitude, data.longitude);
      if (distance <= radiusMeters) {
        nearbyPoints.push({ id: docSnap.id, distance, ...data });
      }
    }
  });

  // Mesafeye göre sırala (en yakın en üstte)
  nearbyPoints.sort((a, b) => a.distance - b.distance);

  return nearbyPoints;
};

/**
 * Haftalık görev ilerlemelerini günceller ve hedef ulaşıldığında ödül (XP) verir.
 * @param userId Kullanıcı ID
 * @param taskType Görev Tipi ('plastic_scan', 'paper_scan', 'point_added', 'point_verified', 'dropoff')
 * @param payload Ek veriler (Gelecekteki genişletmeler için)
 */
export const updateWeeklyTaskProgress = async (userId: string, taskType: string, payload?: any) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const now = new Date();
  
  let weekly = userData.weeklyTasks;
  let needsReset = false;

  // 1. Haftalık Sıfırlama (Reset Mechanic) Kontrolü
  if (!weekly || !weekly.lastResetDate) {
    needsReset = true;
  } else {
    let lastReset = weekly.lastResetDate;
    if (typeof lastReset.toDate === 'function') lastReset = lastReset.toDate();
    else if (typeof lastReset === 'string' || typeof lastReset === 'number') lastReset = new Date(lastReset);

    // 7 gün (7 * 24 * 60 * 60 * 1000 ms) geçmişse sıfırla
    const timeDiff = now.getTime() - lastReset.getTime();
    if (timeDiff >= 7 * 24 * 60 * 60 * 1000) {
      needsReset = true;
    }
  }

  // Eğer 7 gün geçmişse veya ilk kez oluşturuluyorsa sayaçları sıfırla
  if (needsReset) {
    weekly = {
      plastic_count: 0,
      paper_count: 0,
      points_added: 0,
      points_verified: 0,
      total_dropoffs: 0,
      tips_read: 0,
      categories_dropped: [],
      isPlasticsClaimed: false,
      isPaperClaimed: false,
      isPointsAddedClaimed: false,
      isPointsVerifiedClaimed: false,
      isDropoffsClaimed: false,
      isTipsClaimed: false,
      isKarmaClaimed: false,
      lastResetDate: now
    };
  }

  let earnedXp = 0;
  let taskUpdated = false;

  // 2. Gelen eyleme göre görev sayaçlarını artır
  switch (taskType) {
    case 'plastic_scan':
      weekly.plastic_count += 1;
      taskUpdated = true;
      break;
    case 'paper_scan':
      weekly.paper_count += 1;
      taskUpdated = true;
      break;
    case 'point_added':
      weekly.points_added += 1;
      taskUpdated = true;
      break;
    case 'point_verified':
      weekly.points_verified += 1;
      taskUpdated = true;
      break;
    case 'tip_read':
      weekly.tips_read = (weekly.tips_read || 0) + 1;
      taskUpdated = true;
      break;
    case 'dropoff':
      weekly.total_dropoffs += 1;
      if (payload?.category) {
        if (!weekly.categories_dropped) weekly.categories_dropped = [];
        if (!weekly.categories_dropped.includes(payload.category)) {
          weekly.categories_dropped.push(payload.category);
        }
      }
      taskUpdated = true;
      break;
  }

  // Eğer takip edilen bir görev tipi değilse işlemi sonlandır
  if (!taskUpdated) return;

  // 2. Hedefleri Kontrol Et ve Ödülleri Ver
  if (weekly.plastic_count >= 10 && !weekly.isPlasticsClaimed) {
    earnedXp += 50;
    weekly.isPlasticsClaimed = true;
  }
  
  if (weekly.paper_count >= 10 && !weekly.isPaperClaimed) {
    earnedXp += 50;
    weekly.isPaperClaimed = true;
  }

  if (weekly.points_added >= 2 && !weekly.isPointsAddedClaimed) {
    earnedXp += 100;
    weekly.isPointsAddedClaimed = true;
  }

  if (weekly.points_verified >= 5 && !weekly.isPointsVerifiedClaimed) {
    earnedXp += 60;
    weekly.isPointsVerifiedClaimed = true;
  }

  if (weekly.total_dropoffs >= 25 && !weekly.isDropoffsClaimed) {
    earnedXp += 150;
    weekly.isDropoffsClaimed = true;
  }

  if ((weekly.tips_read || 0) >= 7 && !weekly.isTipsClaimed) {
    earnedXp += 40;
    weekly.isTipsClaimed = true;
  }

  if ((weekly.categories_dropped?.length || 0) >= 5 && !weekly.isKarmaClaimed) {
    earnedXp += 80;
    weekly.isKarmaClaimed = true;
  }

  // 3. Veritabanını Güncelle
  const updates: any = {
    weeklyTasks: weekly
  };

  // Eğer ödül kazanıldıysa toplam XP'ye ekle
  if (earnedXp > 0) {
    updates.xp = increment(earnedXp);
  }

  await updateDoc(userRef, updates);

  return {
    success: true,
    earnedXp,
    weeklyTasks: weekly
  };
};

/**
 * Kullanıcının mevcut XP'sine göre Seviye, Rütbe ve Sonraki Seviye İlerlemesini hesaplar.
 * @param xp Kullanıcının toplam XP'si
 */
export const getLevelAndRankInfo = (xp: number) => {
  let level = 1;
  let rank = 'Çaylak';
  let nextLevelXp = 150;
  let currentLevelBaseXp = 0;

  if (xp >= 12000) {
    return { level: 8, rank: 'Gezegen Muhafızı', nextLevelXp: xp, progress: 100, isMax: true };
  } else if (xp >= 6000) {
    level = 7; rank = 'Eko Avcısı'; nextLevelXp = 12000; currentLevelBaseXp = 6000;
  } else if (xp >= 3000) {
    level = 6; rank = 'Doğa Koruyucu'; nextLevelXp = 6000; currentLevelBaseXp = 3000;
  } else if (xp >= 1500) {
    level = 5; rank = 'Doğa Koruyucu'; nextLevelXp = 3000; currentLevelBaseXp = 1500;
  } else if (xp >= 800) {
    level = 4; rank = 'Çevreci'; nextLevelXp = 1500; currentLevelBaseXp = 800;
  } else if (xp >= 300) {
    level = 3; rank = 'Çevreci'; nextLevelXp = 800; currentLevelBaseXp = 300;
  } else if (xp >= 150) {
    level = 2; rank = 'Çaylak'; nextLevelXp = 300; currentLevelBaseXp = 150;
  } else {
    level = 1; rank = 'Çaylak'; nextLevelXp = 150; currentLevelBaseXp = 0;
  }

  const progress = Math.min(((xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100, 100);

  return { level, rank, nextLevelXp, progress, currentLevelBaseXp, isMax: false };
};
