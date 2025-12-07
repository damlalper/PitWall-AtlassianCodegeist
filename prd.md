# PRD: PitWall - Intelligent Incident Commander

**Proje Adı:** PitWall  
**Slogan:** Your AI Race Engineer for Critical Software Incidents  
**Hackathon:** Codegeist 2025: Atlassian Williams Racing Edition  
**Kategori:** Apps for Software Teams & Best Rovo Apps  
**Durum:** Tasarım Aşamasında  
**Versiyon:** 1.0

---

# 1. Yönetici Özeti (Executive Summary)

Formula 1'de bir araç performans kaybı yaşadığında, yarış mühendisleri (Pit Duvarı) saniyeler içinde telemetri verilerini analiz eder, sorunu tespit eder ve pilota stratejiyi iletir. Yazılım dünyasında ise kritik bir hata (Incident) oluştuğunda süreç kaotiktir: Doğru kişiyi bulmak, logları taramak ve doküman okumak saatler sürer.

**PitWall**, Jira Service Management üzerinde çalışan, Atlassian Rovo ve Forge tabanlı akıllı bir olay müdahale asistanıdır. Bir incident oluştuğunda otomatik olarak kod tabanını (Bitbucket) tarar, hatanın kök nedenini (Root Cause) analiz eder ve çözüm önerilerini (Confluence) Jira biletine *"Yarış Mühendisi"* hassasiyetiyle getirir.

---

# 2. Problem Tanımı (Problem Statement)

- **Yüksek MTTR (Mean Time To Recovery):** Yazılım ekipleri bir hatanın nedenini bulmak için ortalama %60 zaman harcar.  
- **Bağlam Kopukluğu (Context Switching):** Jira, Bitbucket ve Confluence arasında zıplamak odağı bozar.  
- **Bilgi Eksikliği:** Kritik anlarda Runbook’lar ve geçmiş deneyimler bulunamaz.

---

# 3. Çözüm ve Özellikler (Solution & Features)

## 3.1. Temel Çözüm  
PitWall, bir Jira olayı oluşturulduğu anda tetiklenen bir *Erken Uyarı ve Analiz Sistemi*dir.  
Tıpkı F1 telemetrisi gibi, yazılımın SDLC geçmişini tarar, anormallikleri analiz eder ve raporlar.

## 3.2. MVP Özellikleri (Hackathon Kapsamı)

### 🏎️ Özellik 1: Auto-Telemetry Scan (Otomatik Kod Taraması)
**İşlev:** P1/P2 seviyesinde Jira bileti açıldığında Bitbucket API'sine bağlanır.  
**Mekanizma:**  
- Son 24 saatteki commit’leri, PR’ları ve değişen dosyaları analiz eder.  
- Hata mesajındaki anahtar kelimelerle eşleştirir.  

---

### 🤖 Özellik 2: Rovo The Race Engineer (AI Analizi)
**İşlev:** Loglar + şüpheli kod bloklarını Rovo Agent'a gönderir.  
**AI Çıktısı Örneği:**  
- **Şüpheli:** "Bu hata %85 ihtimalle *auth-service.py* dosyasındaki son değişiklikten kaynaklanıyor."  
- **Neden:** "API key validasyonu kaldırılmış."

---

### 📚 Özellik 3: Strategy & Runbook Suggestion
**İşlev:** Confluence dokümanlarını tarar.  
**Mekanizma:**  
- Hata ile ilgili geçmiş çözüm dokümanı varsa, link + özet adımlar Jira’ya eklenir.

---

### 📊 Özellik 4: Incident Dashboard (Jira UI)
**İşlev:** Jira Issue panelinde özel bir *PitWall* sekmesi.  
**Gösterilenler:**  
- Hata olasılık skoru  
- İlgili commit sahibi (Developer)  
- Çözüm önerileri  

---

# 4. Kullanıcı Hikayesi (User Journey)

### 1. **Kaza (The Crash)**  
Müşteri ödeme yaparken *500 Error* alır → JSM otomatik olarak bir CRITICAL Jira bileti açar.

### 2. **Pit Duvarı Tepkisi (The Response)**  
PitWall tetiklenir:  
- Başlığı okur → "Payment"  
- Bitbucket’a bakar → Son değişiklik: **Ali** – *payment_logic.py*

### 3. **Analiz (The Analysis)**  
Rovo der ki:  
> “Timeout süresi 30 saniyeden 3 saniyeye düşürülmüş, hata buna benziyor.”

### 4. **İletişim (The Radio Call)**  
Destek mühendisi Jira biletini açtığında PitWall panelini görür:

- 🔴 **Risk:** Yüksek  
- 👨‍💻 **Şüpheli Değişiklik:** Ali (commit-hash-123)  
- 💡 **Öneri:** “Timeout değerini geri alın (Rollback).”

---

# 5. Teknik Mimari (Technical Architecture)

**Platform:** Atlassian Forge (Serverless / Node.js)  

## Modules  
- `trigger: avi:jira:created:issue`  
- `function:` Backend logic & API calls  
- `jira:issuePanel:` UI  
- `rovo:agent:` AI Prompting

## APIs  
- Jira Cloud REST API  
- Bitbucket Cloud REST API  
- Confluence Cloud REST API  

**AI Model:** Atlassian Intelligence (OpenAI GPT-4 altyapısı)

---

# 6. Williams Racing Teması ile Uyumluluk

| F1 Kavramı           | PitWall Karşılığı                              |
|----------------------|-------------------------------------------------|
| Telemetry Data       | Bitbucket Commit History & Jira Logs           |
| Race Engineer        | Rovo AI Agent                                  |
| Pit Stop Strategy    | Confluence Runbooks & Rollback Önerileri       |
| Speed                | MTTR düşürme                                   |

---

# 7. Başarı Kriterleri (Success Metrics)

- **Fonksiyonellik:** Doğru commit’i bulup Jira’ya yorum ekleyebiliyor mu?  
- **AI Doğruluğu:** Mantıklı ve bağlama uygun analiz yapıyor mu?  
- **UI/UX:** Williams Racing mavi/beyaz temasıyla şık bir panel mi sunuyor?

---

# 8. Gelecek Vizyonu (Future Scope)

- **Otomatik Rollback:** Bitbucket pipeline tetikleyen onay mekanizması.  
- **Slack Entegrasyonu:** Hata raporunu ilgili ekibe otomatik iletme.  
- **Predictive Maintenance:** “Bu kod yakında patlayabilir” uyarı sistemi.

---
