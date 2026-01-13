# DigitalOcean Spaces Kurulum Rehberi

## 🚀 Kurulum Adımları

### 1. DigitalOcean Spaces Oluşturma

1. [DigitalOcean](https://cloud.digitalocean.com) hesabınıza giriş yapın
2. Sol menüden **Spaces** seçeneğine tıklayın
3. **Create Space** butonuna tıklayın
4. Bir **region** seçin (örn: NYC3, AMS3, SGP1)
5. Space'inize bir isim verin (örn: `inlyne-covers`)
6. **File Listing** için "**Restrict File Listing**" seçin (güvenlik için)
7. **CDN** etkinleştirin (daha hızlı erişim için)

### 2. API Anahtarları Oluşturma

1. [API Tokens sayfasına](https://cloud.digitalocean.com/account/api/tokens) gidin
2. **Spaces Keys** sekmesine tıklayın
3. **Generate New Key** butonuna tıklayın
4. Anahtar adı girin (örn: "Inlyne Screenshot Uploader")
5. **Access Key** ve **Secret Key**'i bir yere kaydedin (Secret Key sadece bir kez gösterilir!)

### 3. Environment Variables Ayarlama

`.env` dosyanıza aşağıdaki satırları ekleyin:

```env
# DigitalOcean Spaces Configuration
DO_SPACES_ENABLED=true
DO_SPACES_BUCKET=inlyne-covers
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_KEY=YOUR_ACCESS_KEY_HERE
DO_SPACES_SECRET=YOUR_SECRET_KEY_HERE
DO_SPACES_USE_CDN=true
DELETE_LOCAL_AFTER_UPLOAD=false
```

#### Environment Variables Açıklaması:

- **DO_SPACES_ENABLED**: `true` = Spaces kullan, `false` = sadece local kaydet
- **DO_SPACES_BUCKET**: Space'inizin adı
- **DO_SPACES_REGION**: Space'inizin bulunduğu region (nyc3, ams3, sgp1, fra1, sfo2, tor1, lon1, blr1, syd1)
- **DO_SPACES_ENDPOINT**: Region'a göre endpoint URL (format: `https://REGION.digitaloceanspaces.com`)
- **DO_SPACES_KEY**: Access Key ID
- **DO_SPACES_SECRET**: Secret Access Key
- **DO_SPACES_USE_CDN**: `true` = CDN URL kullan (daha hızlı), `false` = direkt Space URL
- **DELETE_LOCAL_AFTER_UPLOAD**: `true` = upload sonrası local dosyayı sil (disk tasarrufu), `false` = local kopyayı sakla

### 4. Region Endpoint'leri

| Region | Endpoint |
|--------|----------|
| NYC3 | `https://nyc3.digitaloceanspaces.com` |
| AMS3 | `https://ams3.digitaloceanspaces.com` |
| SGP1 | `https://sgp1.digitaloceanspaces.com` |
| FRA1 | `https://fra1.digitaloceanspaces.com` |
| SFO2 | `https://sfo2.digitaloceanspaces.com` |
| SFO3 | `https://sfo3.digitaloceanspaces.com` |
| TOR1 | `https://tor1.digitaloceanspaces.com` |
| LON1 | `https://lon1.digitaloceanspaces.com` |
| BLR1 | `https://blr1.digitaloceanspaces.com` |
| SYD1 | `https://syd1.digitaloceanspaces.com` |

## 📦 Değişiklikler

### Yeni Dosyalar

- `utils/uploadToSpaces.js` - Spaces'e upload fonksiyonu
- `SPACES_SETUP.md` - Bu rehber

### Güncellenmiş Dosyalar

- `utils/site/generateCoverImage.js` - Artık screenshot'ları Spaces'e upload ediyor

## 🔄 Nasıl Çalışır?

1. Puppeteer ile screenshot alınır ve önce **local'e kaydedilir** (`uploads/sites/covers/`)
2. Eğer `DO_SPACES_ENABLED=true` ise:
   - Screenshot DigitalOcean Spaces'e **upload edilir**
   - Spaces URL'si döndürülür (örn: `https://inlyne-covers.nyc3.cdn.digitaloceanspaces.com/sites/covers/abc123.webp`)
   - Eğer `DELETE_LOCAL_AFTER_UPLOAD=true` ise local dosya silinir
3. Eğer upload başarısız olursa, **fallback** olarak local URL döndürülür

## 🧪 Test Etme

1. Server'ı yeniden başlatın: `npm run dev`
2. Yeni bir site oluşturun veya mevcut bir site için cover image generate edin
3. Console'da şu mesajları görmelisiniz:
   - `✅ File uploaded to Spaces: https://...`
   - Spaces URL'si başarıyla döndürülmüş olmalı

## 🔒 Güvenlik

- ⚠️ **Secret Key**'i asla git'e commit etmeyin!
- `.env` dosyası `.gitignore`'da olmalı
- Space'inizin **File Listing**'ini "Restrict" modunda tutun
- Sadece gerekli dosyaları `public-read` yapın (upload fonksiyonu bunu otomatik yapar)

## 💰 Fiyatlandırma

DigitalOcean Spaces fiyatlandırması:
- **$5/ay** - 250 GB storage + 1 TB transfer dahil
- Ekstra storage: $0.02/GB
- Ekstra transfer: $0.01/GB

## 🆘 Sorun Giderme

### "Access Denied" hatası
- API anahtarlarınızı kontrol edin
- Space'inizin region'unu doğrulayın
- Endpoint URL'sini kontrol edin

### "Bucket not found" hatası
- Bucket adını kontrol edin (case-sensitive)
- Space'inizin oluşturulduğundan emin olun

### Upload başarısız oluyor
- İnternet bağlantınızı kontrol edin
- DigitalOcean servis durumunu kontrol edin
- Local fallback devreye girer, screenshot yine de kaydedilir

## 📞 Destek

DigitalOcean Spaces dokümantasyonu: https://docs.digitalocean.com/products/spaces/
