# 🏎️ MASTER STRATEGY: PitWall - Codegeist 2025

**Project Name**  
PitWall: Intelligent Incident Commander

**Theme**  
Atlassian x Williams Racing (Speed, Precision, Telemetry)

**Deadline**  
22 Aralık 2025 (Kalan Süre: ~15 GÜN)

**Target Prize**  
1st Place ($15k) + Best Rovo App ($2k) + Best Rovo Dev ($2k)

**Platform**  
Atlassian Forge (Node.js)

---

## 1. STRATEGIC GOALS & WINNING CRITERIA

Jüriyi etkilemek için kuralları lehimize *“hack”*liyoruz.

### 🎯 Ana Hedef: **"Hikaye Anlatıcılığı"**
- Jüri binlerce kod satırını okumaz, videoyu izler.  
- Uygulamamız sadece çalışmamalı; Williams Racing temasına uygun olarak **"Yazılım dünyasının Pit Duvarı"** hissini vermeli.  
**Aksiyon:** Arayüzde F1 temalı (mavi/beyaz) renkler ve hız vurgusu kullanılacak.  
**Aksiyon:** Hata çözme hızı (MTTR) vurgulanacak.

### 💰 Bonus Ödül Avcılığı
- **Best Rovo Apps ($2,000):** Uygulamanın kalbi bir *Rovo Agent* olacak.  
- **Best App built using Rovo Dev ($2,000):**  
  - **KRİTİK GÖREV (Özgür):** Kodun bir kısmını IDE içinde *Rovo Dev* kullanarak yazdırmalı ve bunun ekran görüntüsünü alıp sosyal medyada paylaşmalısın. Bu, katılım şartıdır.  
- **Runs on Atlassian ($2,000):** Uygulama performans ve güvenlik standartlarına (RoA checklist) uygun olmalı.

---

## 2. TEAM ROLES & RESPONSIBILITIES

### 👨‍✈️ Ozgur (The Pilot & Product Owner)
- Development Environment: Forge CLI, Node.js ve Atlassian Cloud kurulumunu yapmak.  
- **Data Seeding (ÇOK ÖNEMLİ):** Sistemi "yaşanmış" göstermek için Jira'ya sahte ticketlar, Bitbucket'a sahte hatalı commitler girmek.  
- Rovo Dev Kullanımı: Bir fonksiyonu bilerek Rovo Dev ile yazdırıp kanıt (screenshot) almak.  
- Video Production: Demoyu kaydetmek ve seslendirmek.  
- Submission: Devpost formunu doldurmak.

### 🤖 Claude (The Chief Mechanic - Coder)
- Backend Logic: Jira trigger'larını, Bitbucket API çağrılarını ve Rovo Agent mantığını yazmak.  
- Frontend (UI Kit): Jira Issue Panel arayüzünü kodlamak.  
- Error Handling: Kodun demo sırasında patlamamasını sağlamak.  
- Refactoring: Kodu temiz ve anlaşılır tutmak.

### 🧠 Gemini (The Race Strategist)
- PRD & Scope: Özelliklerin kapsamını yönetmek (Feature Creep'i önlemek).  
- Scriptwriting: Video için saniye saniye senaryo yazmak.  
- Documentation: Devpost için proje açıklama metnini (Submission Text) yazmak.

---

## 3. THE 15-DAY SPRINT PLAN (Aggressive Timeline)

### 🏁 Phase 1: Setup & Hello World (Days 1–3)
- [ ] Forge Environment Setup (Ozgur).  
- [ ] `manifest.yml` konfigürasyonu (Jira, Confluence, Bitbucket izinleri).  
- [ ] **Milestone 1:** Jira'da bilet açılınca loglara "Hello PitWall" yazdıran trigger'ın çalışması.

### 🧠 Phase 2: The Intelligence Engine (Days 4–8)
- [ ] Bitbucket API Entegrasyonu: Son commitleri ve diff'leri çeken kod.  
- [ ] Rovo Agent Tanımlaması: `"Bu hata mesajı ile şu kod bloğu arasındaki ilişkiyi bul"` promptunun yazılması.  
- [ ] **Milestone 2:** Jira ticket'ına, hatayı bozan commit yazarının isminin yorum olarak düşmesi.

### 🎨 Phase 3: The Pit Wall UI (Days 9–11)
- [ ] Jira Issue Panel tasarımı (Risk Skoru, Grafik, Çözüm Önerisi butonu).  
- [ ] Confluence API: "Runbook" arama fonksiyonu.  
- [ ] **Milestone 3:** MVP Bitti. Uygulama uçtan uca çalışıyor.

### 🎬 Phase 4: Polish & Production (Days 12–14)
- [ ] Data Seeding: Demo senaryosu için sahte verilerin girilmesi.  
- [ ] Video Kaydı: 3 dakikalık vurucu videonun çekilmesi.  
- [ ] Rovo Dev Kanıtı: Sosyal medya postunun atılması.

### 🚀 Phase 5: Submission (Day 15 — Dec 21/22)
- [ ] Devpost formunun doldurulması.  
- [ ] Linklerin kontrolü.  
- [ ] Gönderim!

---

## 4. TECHNICAL BLUEPRINT (For Claude)

Claude, lütfen aşağıdaki teknik kısıtlamalara **kesinlikle** uy:

- **Framework:** Atlassian Forge (Node.js runtime).  
- **UI:** Use Forge UI Kit (Latest Version). *Custom UI (React) kullanma* — zaman kaybı olmasın.  
- **Modules to use:**  
  - `rovo:agent`: For the AI analysis logic.  
  - `trigger (avi:jira:created:issue)`: To detect incidents.  
  - `jira:issuePanel`: To display results.  
  - `function`: For backend orchestration.  
- **AI Prompts:** Use "System Prompts" to instruct Rovo to act as a **"Senior Site Reliability Engineer"** and **"F1 Race Strategist"**.  
- **Not:** Zaman kazanmak için minimal, test edilebilir kod yaz. Demo sırasında hata vermemeli.

---

## 5. "HACKS" FOR WINNING (Tips for Ozgur)

- **Görsel Hile:** Jira panelindeki "Risk Skoru"nu bir hız göstergesi (speedometer) veya lastik aşınma grafiği gibi görselleştirirsek Williams Racing temasına tam puan alırız.  
- **Gerçekçi Senaryo:** Videoda sadece "test" yazan bir ticket göstermeyin. Ticket başlığı: `"Payment Gateway Timeout during heavy load"` gibi havalı olsun.  
- **Rovo Dev Postu:** Bunu unutma! Projenin kodunun bir parçasını (örneğin Bitbucket API fonksiyonunu) yaparken ekran kaydı al. Tweet/LinkedIn metin örneği:  
  > "Building my Codegeist app using Rovo Dev! 🏎️"  
  Linki başvuruya ekleyeceğiz.

---

## 6. HOW TO USE THIS FILE WITH CLAUDE

**Prompt to Claude:**
> "Claude, we are building an Atlassian Forge app for the Codegeist 2025 Hackathon. Attached is the MASTER_STRATEGY.md file. Please read it thoroughly to understand our goals, the timeline, the 'Williams Racing' theme, and your specific role. Once you read it, confirm you understand the 'PitWall' concept and help me with the first step: Generating the `manifest.yml` file."

---

## 7. Bir Sonraki Adımımız

- Bu dosyayı kaydettikten sonra, **Rovo Dev** kuralını hatırlatayım: Kod yazarken Atlassian'ın sitesinden veya VS Code eklentisi olarak **Rovo Dev**'i aktif etmen gerekecek.  
- Özellikle **Rovo Dev** ile üretilen koddan bir ekran görüntüsü almak ve sosyal medyada paylaşmak zorunlu.

---

**İyi şanslar takım — pit stop hazır, yarış başlıyor! 🏁**
