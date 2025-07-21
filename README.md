# 🤖 Modern Discord Register ve Destek Botu

**Made and Developed by Xedevil** - Türkçe Discord sunucuları için gelişmiş register ve ticket yönetim sistemi.

## ✨ Yeni Modern Özellikler

### 🎨 **Premium Tasarım Sistemi**
- **Modern Gradient Renkler:** Emerald, Violet, Cyan, Premium Gold
- **Şık Embed'ler:** Animated iconlar, author, thumbnail, image destekli
- **Profesyonel Görünüm:** Premium kalite tasarım ve kullanıcı deneyimi
-

### 💾 **Gelişmiş Veri Yönetimi Sistemi**
- **JSON Tabanlı Kaydetme:** Tüm sunucu verileri serverdata.json'da saklanır
- **Otomatik Yedekleme:** Her 3 dakikada bir otomatik veri kaydı
- **Sunucu Bazlı Ayarlar:** Her sunucu için ayrı tag, kanal, rol ayarları
- **Kalıcı Veri:** Bot yeniden başlatılsa da veriler korunur
- **İstatistik Takibi:** Kayıt, ticket, kural kabul sayıları

### 🏷️ **Akıllı Tag Sistemi**
- `.tag ayarla [tag]` - Sunucu tagı ayarlar (★, ◆, [VIP], {PRO}, 💎 vb.)
- `.tag kaldır` - Tag sistemini tamamen kaldırır
- `.tag` - Modern tag yönetim panelini gösterir
- **Duplicate Önleme:** Kullanıcıda tag varsa tekrar eklenmez
- **Detaylı Log Sistemi:** "Kullanıcımız tagımızı aldı!" mesajları
- **Tag Çeşitleri:** Sembol, bracket, emoji destekli taglar

### 📋 **Çok Detaylı Kurallar Sistemi**
- **8 Kategori:** 2000+ kelimelik kapsamlı kurallar
  - 🗣️ Genel Sohbet | 🚫 Yasak Davranışlar | 🔒 Güvenlik & Gizlilik
  - 👥 Kayıt & Üyelik | 🎫 Destek Sistemi | ⚖️ Yaptırımlar & Cezalar
  - 🎉 Eğlence & Etkinlik | 📞 İletişim & Şikayetler
- **İnteraktif Butonlar:**
  - ✅ **Okudum ve Anladım** - Kuralları kabul etme
  - ℹ️ **Kural Açıklaması** - Detaylı bilgi alma
  - ⚠️ **İhlal Bildir** - Kural ihlali bildirme sistemi
- **Kural Kabul Logları:** Taglog kanalında detaylı takip

## 🎯 Temel Özellikler

### 🎫 Ticket Sistemi
- `.ticket aç [konu]` - Yeni ticket oluşturur
- `.ticket kapat` - Ticket'ı kapatır  
- `.ticket ata @kullanıcı` - Ticket'ı atar
- Otomatik ticket kanalı oluşturma ve yönetimi
- Ticket loglama sistemi

### 👤 **Modern Kayıt Sistemi**
- `.register @kullanıcı [isim]` - Kullanıcıyı kayıt eder
- `.kayit @kullanıcı [isim]` - Türkçe kayıt komutu alternatifi
- **Akıllı Tag Kontrolü:** Kullanıcıda tag varsa tekrar eklenmez
- **Otomatik Rol Yönetimi:** Kayıtsız rolleri kaldırır, kayıtlı rol verir
- **Modern Welcome Embed:** Görsel hoşgeldin mesajları
- **Detaylı İstatistikler:** Kayıt sayısı, üye sırası, sunucu bilgileri
- **Çift Log Sistemi:** Hem genel mod-log hem de tag-log kanalına kayıt

### 🛡️ Moderasyon
- Otomatik küfür engelleme
- Spam koruması
- Moderasyon logları
- Otomatik mesaj silme

### ⚙️ **Gelişmiş Sunucu Yönetimi**
- `.setup` - Otomatik sunucu kurulumu (13 kanal + 5 rol)
- **Otomatik Kanal Oluşturma:** Genel, kayıt, destek, ticket, yönetim kategorileri
- **Rol Sistemi:** Admin, mod, kayıtlı, kayıtsız, vip rolleri
- **Log Sistemleri:** Mod-log ve tag-log kanalları
- **Otomatik Kurallar:** Setup sırasında detaylı kurallar yazılır

### 🤖 Oto-Cevap Sistemi
- Belirli kelimelere otomatik yanıtlar
- Özelleştirilebilir tetikleyiciler


### 1. Bot İzinleri

Bot Settings > OAuth2 > URL Generator'dan şu izinleri seçin:
- **Scopes:** `bot`
- **Bot Permissions:**
  - Send Messages
  - Manage Messages
  - Manage Channels
  - Manage Roles
  - View Channels
  - Read Message History
  - Use Slash Commands
  - Kick Members
  - Ban Members

### 2. Environment Kurulumu

1. `.env` dosyasını düzenleyin:
```env
# Gerekli (Required)
DISCORD_TOKEN=your_discord_bot_token_here

# Bot Yapılandırması (Bot Configuration)
DEVELOPER=dev                       # Geliştirici adı
BOT_ID=your_bot_id_here             # Bot ID'si
MAIN_GUILD_ID=your_main_server_id   # Ana sunucu ID'si
ADMIN_ROLE=Admin                    # Admin rol adı
MOD_ROLE=Moderatör                  # Moderatör rol adı

# İsteğe Bağlı (Optional)
LOG_LEVEL=info
AUTO_SAVE_INTERVAL=180000           # 3 dakika
```

2. Botu çalıştırın:
```bash
npm start
# veya
node index.js
```

### 3. Veri Yönetimi

Bot otomatik olarak `serverdata.json` dosyası oluşturacak ve tüm sunucu verilerini burada saklayacaktır:
- Sunucu tagları
- Kayıt istatistikleri  
- Ticket bilgileri
- Kural kabul logları

## 📋 Komutlar

### Genel Komutlar
- `.help` veya `.yardim` - Yardım menüsünü gösterir

### Ticket Komutları
- `.ticket aç [konu]` - Yeni destek ticket'ı açar
- `.ticket kapat` - Mevcut ticket'ı kapatır
- `.ticket ata @kullanıcı` - Ticket'ı belirli kullanıcıya atar

### Kayıt Komutları
- `.register @kullanıcı [isim]` - Kullanıcıyı sunucuya kayıt eder
- `.kayit @kullanıcı [isim]` - Kayıt komutu (Türkçe)

### Tag Yönetimi Komutları  
- `.tag` - Tag yönetim panelini görüntüle
- `.tag ayarla [tag]` - Sunucu tagı ayarlar (★, ◆, [VIP], {PRO} vb.)
- `.tag kaldır` - Tag sistemini tamamen kaldırır
- `.tag göster` - Mevcut tag durumunu göster

### Yönetici Komutları
- `.setup` - Sunucuyu otomatik kurar (13 kanal + 5 rol + kurallar)
- `.modlog ayarla #kanal` - Moderasyon log kanalını ayarlar

## 🔧 Yapılandırma

### Otomatik Kurulum
`.setup` komutu ile otomatik olarak şunlar oluşturulur:

**Roller:**
- 👑 Yönetici
- 🛡️ Moderatör  
- 🎫 Destek Ekibi
- ✅ Kayıtlı
- 📱 Boost

**Kanallar:**
- 📋 BİLGİLER kategorisi
- 💬 GENEL kategorisi
- 🎫 DESTEK kategorisi
- 🔧 YÖNETİM kategorisi

## 🛠️ Gereksinimler

- Node.js 16.0.0 veya üzeri
- Discord.js v14
- Discord Bot Token

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Botun gerekli izinlere sahip olduğundan emin olun
2. Token'ın doğru girildiğini kontrol edin
3. Bot'un sunucuda aktif olduğunu kontrol edin

## 🎯 Kullanım İpuçları

- Bot komutları `.` (nokta) ile başlar
- Ticket sistemini kullanmak için önce `.setup` komutunu çalıştırın
- Moderasyon için bot'a gerekli rolleri verin
- Log kanallarını ayarlamayı unutmayın

## 🌟 **Yeni Modern Özellikler Özeti**

### 🎨 **Görsel Yenilikler**
✅ Modern gradient renk paleti (Emerald, Violet, Cyan)  
✅ Animated Discord emojileri tüm embed'lerde  
✅ Premium kalite tasarım ve kullanıcı deneyimi  
✅ "Made and Developed by Xedevil" imzası tüm mesajlarda  

### 💾 **Veri Yönetimi**
✅ JSON tabanlı kalıcı veri saklama sistemi  
✅ Otomatik 3 dakikalık yedekleme  
✅ Sunucu bazlı ayrı ayarlar ve istatistikler  
✅ Bot yeniden başlatıldığında veriler korunur  

### 🏷️ **Tag Sistemi**
✅ Akıllı duplicate önleme sistemi  
✅ Modern tag yönetim paneli  
✅ "Kullanıcımız tagımızı aldı!" detaylı loglar  
✅ ★, ◆, [VIP], {PRO}, 💎 gibi çeşitli tag desteği  

### 📋 **Kurallar Sistemi**
✅ 2000+ kelimelik 8 kategoride detaylı kurallar  
✅ İnteraktif buton sistemi (Okudum Anladım, İhlal Bildir)  
✅ Kural kabul logları ve takip sistemi  
✅ Modern görsel kurallar sunumu  

### 📊 **İstatistikler & Loglar**
✅ Kayıt, ticket, kural kabul sayı takibi  
✅ Çift log sistemi (mod-log + tag-log)  
✅ Detaylı kullanıcı ve işlem bilgileri  
✅ Modern log embed tasarımları  

---

**Made and Developed by Xedevil** - 
