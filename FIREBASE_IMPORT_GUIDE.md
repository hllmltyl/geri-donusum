# Firebase'e Toplu Veri Yükleme Rehberi

## Yöntem 1: Firestore Güvenlik Kurallarını Düzelt + Script Çalıştır

### Adım 1: Güvenlik Kurallarını Güncelle
1. Firebase Console → Firestore Database → Rules
2. Şu kuralları yapıştır:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Publish → Birkaç dakika bekle

### Adım 2: Script'i Çalıştır
```bash
npm run upload-waste-data
```

---

## Yöntem 2: Firebase CLI ile Import

### Kurulum:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
```

### Import:
```bash
firebase firestore:import firestore-export/ --project geri-donusum-ab5af
```

---

## Yöntem 3: Manuel JSON Import (Firebase Console)

1. Firebase Console → Firestore Database
2. wastes collection → ⋮ (üç nokta) → Import
3. JSON dosyasını seç
4. Import

**NOT:** Firebase Console'da doğrudan JSON import özelliği olmayabilir. 
Bu durumda Yöntem 1'i kullanın.

---

## Sorun Giderme

### "PERMISSION_DENIED" Hatası:
- Firestore güvenlik kurallarını kontrol edin
- Test mode'da olduğundan emin olun
- Kuralları güncelledikten sonra 2-3 dakika bekleyin

### Script Çalışmıyor:
- .env dosyasının doğru olduğundan emin olun
- Firebase config değerlerini kontrol edin
- Firestore Database'in oluşturulduğunu doğrulayın

### Tüm Verileri Yüklemek İçin:
`scripts/uploadWasteData.js` dosyasındaki `WASTE_ITEMS` dizisini 
`constants/waste.ts` dosyasından kopyalayın (95 atık).
