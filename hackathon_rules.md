# 📜 COMPETITION RULEBOOK & REQUIREMENTS

**Event:** Codegeist 2025: Atlassian Williams Racing Edition  
**Source:** Official Hackathon Rules & Devpost Page

---

## 1. CRITICAL DEADLINES & CONSTRAINTS ⏳

- **Final Deadline:** December 22, 2025 @ 9:00pm GMT+3  
- **Platform Requirement:** The app **MUST** be built on Atlassian Forge (Serverless)  
- **New Code Rule:** Projects must be newly created or significantly updated after Oct 27, 2025  
- **Public Access:** The app needs to be shareable via an installation link for judges

---

## 2. TARGET CATEGORY: "Apps for Software Teams" 🏎️

**Official Definition:**  
> "Build apps that help software teams perform like a finely tuned pit crew—fast, precise, and always in sync. From accelerating code reviews to streamlining deployments and keeping issues on track."

**Our Interpretation (PitWall Project):**  
- Building an **"Incident Response Pit Crew"**  
- **Must Do:** Integrate **Jira (Tracking) + Bitbucket (Code Reviews/Commits) + Confluence (Knowledge)**  
- **Goal:** Remove friction in finding the root cause of an incident

---

## 3. BONUS PRIZE REQUIREMENTS (MANDATORY) 💰

We are targeting **ALL three bonus categories**. Strict compliance is required.

### 3.1 Bonus: Best Rovo Apps ($2,000)
- **Requirement:** The app must use **Forge `rovo:agent` and action modules**  
- **Implementation:** App core logic must be driven by an **AI Agent** that "talks" to the user and performs actions (e.g., looking up code)

### 3.2 Bonus: Best App Built Using Rovo Dev ($2,000)
- **Requirement 1:** Use **Rovo Dev** (Atlassian's AI coding assistant in VS Code) during development  
- **Requirement 2 (Social Proof):** Submission must include a link to a social media post (LinkedIn/Twitter) showing us using Rovo Dev  
- **Requirement 3 (Summary):** Write a summary explaining how Rovo Dev helped build the project

### 3.3 Bonus: Best Runs on Atlassian Apps ($2,000)
- **Requirement:** Must meet **"Runs on Atlassian"** program standards

**Checklist:**
- [ ] **Performance:** App must load quickly (Skeleton loaders in UI)  
- [ ] **Reliability:** Proper error handling (No white screens of death)  
- [ ] **Security:** Scopes in `manifest.yml` must be minimal (least privilege)

---

## 4. JUDGING CRITERIA (HOW TO WIN) 🏆

### A. Quality of the Idea (33%)
- **Focus:** Creativity and Originality  
- **Strategy:** The "Williams Racing" metaphor (Pit Wall, Telemetry) differentiates us from boring "To-Do" apps

### B. Implementation of the Idea (33%)
- **Focus:** Execution Quality  
- **Strategy:**
  - Strict Type Safety (**TypeScript**) → Shows professional engineering  
  - Real Integration → Must pull **real commit data**, not just mock text  
  - UI Polish → Use **official Forge UI Kit components** for a native look

### C. Potential Impact (33%)
- **Focus:** Value to Atlassian Users  
- **Strategy:** Emphasize **MTTR (Mean Time To Recovery) reduction**. Every software team hates incidents; solving this has massive impact

---

## 5. SUBMISSION DELIVERABLES CHECKLIST 📝

**📂 To Be Uploaded to Devpost:**
- **Demo Video (< 5 Minutes):**
  - Must be public (YouTube/Vimeo)  
  - Must show the app running on the actual platform  
  - Must demonstrate the "Williams Racing" theme features
- **App Installation Link:** Generated via Forge Console (`forge install --license`)  
- **Testing Instructions:** Step-by-step guide for judges to reproduce the demo scenario (e.g., "Create a Jira ticket with title 'Payment Error'")  
- **Text Description:** The PRD/README content  
- **App ID:** From `manifest.yml`  
- **Bonus Material:**
  - Link to Social Media Post (Rovo Dev)  
  - Paragraph explaining Rovo Dev usage

---

## 6. TECHNICAL "MUST-HAVES" FOR CLAUDE 🤖

- **Manifest:** Must include `rovo:agent`, `jira:issuePanel`, and trigger modules  
- **Permissions:** Request `read:jira-work`, `read:bitbucket-code`, `read:confluence-content`  
- **UI:** Use **Forge UI Kit** (Not Custom UI, to save time and ensure speed)  
- **Language:** **TypeScript** (Strict Mode)
