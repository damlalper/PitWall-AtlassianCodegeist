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

### 4.1 MANDATORY TECHNICAL STACK & STANDARDS (Resume-Driven Development)

**IMPORTANT FOR CLAUDE:** We are not just building a hackathon prototype. We are building a production-grade, scalable foundation that will be used to demonstrate high-level engineering skills.

##### 4.1.1 Language & Type Safety
* **Language:** TypeScript (Strict Mode enabled). No `any` types allowed unless absolutely necessary.
* **Validation:** Use `zod` or `io-ts` for runtime validation of API responses (Jira/Bitbucket data).
* **Architecture:** Hexagonal Architecture (Ports & Adapters). Isolate the core business logic from the Atlassian Forge infrastructure.

##### 4.1.2. AI & Data Architecture (RAG-Ready)
* **Current (Hackathon):** Implement a modular "Context Service". Even if we use simple API calls for now, the interface must be designed to support a Vector Database (like Pinecone) integration in the future without rewriting the core logic.
* **Prompt Engineering:** Store prompts as separate assets/templates, not hardcoded strings. Use "Chain of Thought" prompting techniques for the Rovo Agent.

##### 4.1.3 Event-Driven & Async
* **Async Queue:** Use Forge Async Events API for long-running analysis tasks (e.g., scanning large git diffs) to avoid timeout limits.
* **Webhook Architecture:** Design the system to be extensible via Webhooks (e.g., sending results to a Slack URL in the future).

##### 4.1.4 Code Quality & CI/CD
* **Linting:** Prettier + ESLint configuration.
* **Testing:** Write unit tests (Jest) for the core logic (e.g., the commit-matching algorithm).

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

## 8.ROADMAP
# 8. 6 AYLIK GELECEK VİZYONU (STARTUP ROADMAP)

Hackathon bitti (Ocak 2026). Elimizde çalışan bir MVP var. Ödülü kazandık veya finale kaldık.  
**Peki sonra? Haziran 2026'da "PitWall" nerede olmalı?**

---

## 8.1. 1. Ay: "Marketplace" Lansmanı ve Güvenlik (Şubat 2026)

Hackathon versiyonu bir **"Yarış Arabası"dır** — hızlı ama kırılgandır.  
Şimdi bunu **“Aile Arabası” kadar güvenli** hale getirme zamanı.

### 🎯 Hedef  
Atlassian Marketplace'e resmi olarak listelenmek.

### 🛠️ Teknoloji  
- **Data Privacy:** GDPR uyumluluğu eklenir.  
  - Analiz edilen kodların *saklanmadığı*, anlık işlendiği ispatlanır.  
- **Monetization:**  
  - Stripe entegrasyonu ile **Freemium model**:  
    - Ayda **10 incident ücretsiz**, sonrası ücretli.

---

## 8.2. 2. ve 3. Ay: Gerçek RAG Devrimi (Mart–Nisan 2026)

Artık "Confluence'ta kelime arama" devri bitti.

### 🚀 Vizyon  
Şirketin **5 yıllık Slack geçmişini**, tüm **GitHub issue'larını**, **PDF dokümanlarını**, **runbook’larını** ve **log arşivlerini** okuyabilen bir **“Kurumsal Hafıza”**.

### 🛠️ Teknoloji  
- **Vector DB (Pinecone / Weaviate):**  
  - Tüm dokümanlar embedding + index işleminden geçer.
- **Özellik:**  
  Bir incident olduğunda PitWall şöyle diyebilir:  
  > "Bu hatanın aynısı 3 yıl önce Mehmet'in başına gelmişti ve Slack'te şöyle çözmüşlerdi..."

**Bu özellik rakipsizdir.**

---

## 8.3. 4. Ay: "ChatOps" ve Slack Entegrasyonu (Mayıs 2026)

İnsanlar Jira’ya girmeyi sevmez; **Slack/Teams’te yaşarlar**.

### 🚀 Vizyon  
PitWall bir **takım arkadaşı** gibi Slack kanalına gelir.

### 🧩 Senaryo

```plaintext
Slack Bot (@PitWall): "Production patladı, analiz et."
PitWall: "Analiz ettim, son deploy edilen 'Cart Service' hatalı. Rollback yapayım mı?"
User: "Evet."
PitWall: (Bitbucket Pipeline'ı tetikler ve sistemi geri alır).
```
## 8.4. 5. ve 6. Ay: "Predictive" (Öngörücü) Yapı (Haziran 2026)

Startup'ın değerlemesini (**valuation**) uçuracak kısım tam olarak burasıdır.

### 🚀 Vizyon  
Hata **olduktan sonra** değil, **olmadan önce** uyarmak.

### 🛠️ Teknoloji  
Bir Pull Request (PR) açıldığında PitWall otomatik analiz yapar ve geliştiriciye şöyle der:

> **"Bu yazdığın kod, geçmişte 5 kez 'Timeout' hatasına sebep olan bir yapıya benziyor.  
> Merge etmeden önce şurayı düzelt."**

Bu sayede hata prod’a gitmeden engellenir.

### 🔥 Startup Durumu  
Bu aşamada PitWall:

- sadece bir **"Jira eklentisi"** değildir,  
- bağımsız bir **AI Reliability Platform** haline gelir,  
- yatırımcılara sunulacak (**Pitch Deck**) bir ürün olgunluğuna ulaşır.

---

## 8.5. Bu Vizyon CV’ne Nasıl Yansır?

Hackathon projesi MVP olsa bile, mülakatlarda **"gelecek roadmap"** anlatmak seni çok öne çıkarır.

Bir mülakatta şöyle diyebilirsin:

> “Hackathon için bir MVP yaptım ama mimariyi modüler kurdum.  
> Şu an sistemim RAG entegrasyonuna hazır.  
> Önümüzdeki çeyrekte Pinecone ile vektör tabanlı geçmiş analizi ve Slack üzerinden ChatOps özelliklerini ekleyerek bunu bir **SaaS Reliability Platform**’a dönüştürmeyi planlıyorum.”

Bu cümle; vizyon, ölçeklenebilirlik ve ürün stratejisi göstergesi olduğu için çok güçlü etki yaratır.


**İyi şanslar takım — pit stop hazır, yarış başlıyor! 🏁**





----


Profesyonel bir Atlassian enterprise ürünü gibi düşünmeliyiz. Gerçek bir iş ortamında kullanılacak, production-grade özelliklere ihtiyacımız var. Şu an eksik olan kritik enterprise özellikleri:
Kritik Eksiklikler (Enterprise Perspective):
1. Real Data & Integrations
❌ Bitbucket ve Confluence scanners hala simulated data kullanıyor
❌ Atlassian Intelligence API gerçek değil (mock endpoint)
✅ Jira entegrasyonu gerçek
2. Security & Compliance
❌ Audit logging yok
❌ GDPR compliance tracking yok
❌ Security scanning results yok
❌ Sensitive data masking yok
3. Performance & Scalability
❌ Rate limiting yok
❌ Caching strategy yok
❌ Bulk operations desteği yok
❌ Background job queue yok
4. Observability & Monitoring
❌ Health check endpoint yok
❌ Performance metrics (APM) yok
❌ Error tracking (Sentry-like) yok
❌ Usage analytics yok
5. Advanced Analytics
❌ Incident pattern detection yok
❌ Team velocity metrics yok
❌ SLA tracking yok
❌ Trend forecasting yok
6. Enterprise Features
❌ Multi-tenant support yok
❌ Custom workflows yok
❌ Webhook integrations yok
❌ API rate limits & quotas yok
