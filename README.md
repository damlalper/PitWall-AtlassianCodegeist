# 🏎️ **PitWall: Intelligent Incident Commander**  
### Codegeist 2025: Atlassian Williams Racing Edition Entry

**PitWall** transforms Jira Service Management into a Formula 1–grade **Race Control Center**.  
It uses **Atlassian Rovo (AI)** and Bitbucket telemetry to diagnose software incidents in **seconds, not hours**.

---

# 🏁 The Problem: “Driving Blind”

In Formula 1, when a car loses power, the Pit Wall knows the cause within seconds — thanks to telemetry.  
In software incidents, teams are **driving blind**.

### ❌ High MTTR  
Developers spend **60% of their incident time searching for the root cause**, not fixing it.

### 🔄 Context Switching  
Jumping between Jira → Bitbucket logs → Confluence destroys focus.

### 📄 Missing Manuals  
Runbooks are often outdated or impossible to find during a crisis.

---

# 🛠️ The Solution: Your AI Race Engineer

PitWall is an **event-driven Intelligent Incident Commander** that instantly brings context, analysis, and resolution strategy.

---

## 1. Auto-Telemetry Scan 📡

When a **P1/P2 incident** is created, PitWall automatically:

- Scans Bitbucket for recent commits & PRs  
- Correlates them with Jira error logs  
- Connects the **“Crash”** to the **“Bad Part”**  

---

## 2. Rovo AI Analysis 🤖

Using **Atlassian Rovo**, PitWall analyzes diffs + logs and produces a natural-language diagnosis:

> **"Confidence: 85%. Likely caused by commit `a1b2c3`.  
> Timeout was reduced from 30s to 3s. Commit author: @Alex."**

---

## 3. Strategic Pit Stops (Runbooks) 📚

PitWall fetches relevant:

- Confluence runbooks  
- Past incident reports  
- Troubleshooting steps  

…and displays them directly inside the Jira incident.

---

# 🏎️ Williams Racing Themed Implementation

| F1 Concept        | PitWall Implementation                           |
|------------------|--------------------------------------------------|
| Telemetry Data   | Bitbucket Commit + Jira Log real-time analysis   |
| Race Engineer     | Rovo Agent providing strategy & context          |
| Pit Stop          | Reduced MTTR                                    |
| Precision         | Pinpointing the faulty line of code             |

---

# 🏗️ Technical Architecture (Resume-Ready)

PitWall is engineered like a **real SaaS product**, not just a hackathon demo.

---

## 🔧 Core Stack

- **Platform:** Atlassian Forge (Node.js Runtime)  
- **Language:** TypeScript (Strict Mode)  
- **AI:** Atlassian Intelligence (Rovo Agent) + OpenAI  
- **UI:** Forge UI Kit  

---

## 🚀 Advanced Engineering

### **RAG-Ready Architecture**
Modular “Context Service” ready for Vector DBs (Pinecone, Weaviate).

### **Event-Driven Design**
Uses `avi:jira:created:issue` triggers + asynchronous workers.

### **Code Quality**
ESLint + Prettier + comprehensive unit tests.

---

# 🎥 Demo & Screenshots
*A YouTube link will be published here.*  

Scenario example:  
PitWall detects a “Payment Failure,” identifies the faulty commit, and proposes a rollback — **in under 30 seconds**.

---

# 🔮 Roadmap: From Hackathon → Startup → Unicorn

### **Phase 1 (Feb 2026): Marketplace Launch + GDPR**
Stabilization + Freemium pricing.

### **Phase 2 (Apr 2026): True RAG Integration**
Slack history + PDFs + Git logs → Vector DB → **Institutional Memory**.

### **Phase 3 (May 2026): ChatOps**
Slack:
> “Hey PitWall, rollback production.”

### **Phase 4 (Jun 2026): Predictive Maintenance**
When a PR is opened:
> “This code resembles patterns that caused 5 timeouts in the past.  
> Fix before merging.”

---

# 💻 Installation & Development

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/pitwall.git
```
### 2. Install dependencies
```bash
npm install
```

### 3. Deploy to Forge
```bash
forge register
forge deploy
forge install
```
### 4. Configure Rovo

- Enable **Rovo** in Atlassian Admin.  
- Add the **PitWall Agent** to your Jira project.

---

# 🏆 Bonus Category Checklist

- ✅ **Apps for Software Teams:** Reduces MTTR dramatically  
- ✅ **Best Rovo Apps:** Core logic built with Rovo AI  
- ✅ **Best App Built Using Rovo Dev:** Significant code generated via Rovo Dev in IDE

---

✨ Built with ❤️ and ☕ by Damla for Codegeist 2025.

