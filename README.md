# AVAI Agent for Hire - Multi-Engine AI Orchestrator

**Autonomous AI-driven security auditing system with inter-canister orchestration on ICP**

**Status**: Deployed | **Orchestrator**: `bw4dl-smaaa-aaaaa-qaacq-cai` | **Engines**: 3 Active  

---

## Overview

**AVAI** is the first **autonomous AI security auditor** built natively on the Internet Computer Protocol (ICP). It continuously analyzes smart contracts, detects vulnerabilities, and generates enterprise-grade reports.  

What makes AVAI unique is its **multi-model AI orchestration**, where specialized reasoning, tool-calling, and vision-capable models work together under a secure Motoko canister orchestrator.  

**AI Model Engines:**  
- **Dolphin 3** – Deep reasoning for vulnerability prioritization and exploit simulation  
- **LLaMA 3.2** – Advanced reasoning + tool calling for static/dynamic analysis  
- **LLaVA 4** – Vision-based intelligence for code diagrams, architecture flows, and visual audit reports  

**Key Features:**  
- **Autonomous Security Operation** – 24/7 auditing without human intervention  
- **Multi-Engine Orchestration** – Specialized AI models for reasoning, tool calling, and vision  
- **Multi-Language Support** – Motoko, Rust, and Candid smart contracts  
- **Real-Time Detection** – Continuous monitoring and vulnerability alerts  
- **Professional Audit Reports** – Actionable insights for enterprise adoption  
- **ICP Native** – Fully decentralized, secured by Internet Computer Protocol  

---

## Quick Start

### Prerequisites
- **Docker**: For local IC replica  
- **dfx**: Internet Computer SDK  

### Local Deployment

```bash
# Start DFX container
docker run -d --name avai-dfx-robust -p 4943-4944:4943-4944 avai-agent-for-hire-dfx-replica

# Deploy AVAI audit system
docker exec -it avai-dfx-robust dfx deploy

# Initialize orchestrator
docker exec -it avai-dfx-robust dfx canister call avai_audit_engine initialize
````

### Usage Examples

```bash
# Run a comprehensive audit
dfx canister call avai_audit_engine start_security_audit '(record {target="canister_id"; audit_type=variant{Comprehensive}; priority=variant{High}})'

# Analyze contract
dfx canister call avai_audit_engine analyze_contract '(record {code="motoko_code"; language=variant{Motoko}; depth=variant{Deep}})'

# Generate enterprise audit report
dfx canister call avai_audit_engine generate_report '(record {audit_id="session123"; format=variant{Professional}; include_recommendations=true})'

# Get live security status
dfx canister call avai_audit_engine get_security_status '(record {target="canister_id"})'
```

---

## Architecture

**Infrastructure (via Cloudflare Tunnel):**

* **Frontend**: [https://avai.life](https://avai.life)
* **WebSocket**: wss://websocket.avai.life/ws
* **API Gateway**: [https://avai.life/api](https://avai.life/api)
* **Backend**: Containerized Python middleware + agents

**AI Orchestration Engines:**

* **Dolphin 3 (Reasoning Core)** – Risk modeling & exploit simulation
* **LLaMA 3.2 (Tool Orchestrator)** – Code analysis & task delegation
* **LLaVA 4 (Vision)** – Visual audits & diagrammatic reasoning

**Core Components:**

* **Motoko Canister Orchestrator** – Native ICP coordination layer
* **Security Engine** – Static/dynamic analysis, exploit pathing
* **Report Generator** – AI-generated professional documentation
* **Real-Time Monitor** – Continuous security posture tracking

---

## Configuration

### AI Model Setup

```javascript
let config = {
  reasoning_model: "dolphin-3",
  tool_calling_model: "llama-3.2",
  vision_model: "llava-4"
};
```

### Security Parameters

```javascript
let audit_config = {
  vulnerability_threshold: "medium",
  analysis_depth: "comprehensive",
  report_format: "professional",
  real_time_monitoring: true
};
```

---

## Use Cases

1. **Pre-Deployment Security Audit**

```bash
dfx canister call avai_project_backend process_dynamic_prompt '("run full security audit before canister deployment", null)'
```

2. **Continuous Monitoring**

```bash
dfx canister call avai_project_backend start_agent_orchestrator
```

3. **Vulnerability Assessment**

```bash
dfx canister call avai_project_backend process_dynamic_prompt '("check Motoko contract vulnerabilities", null)'
```

---

## Roadmap

**v1.0 – Current**

* Multi-model orchestration: Dolphin 3, LLaMA 3.2, LLaVA 4
* Real-time vulnerability detection
* Professional audit reports

**v1.1 – In Development**

* ML-driven exploit pattern recognition
* Automated penetration testing
* Cross-chain smart contract analysis

**v1.2 – Planned**

* CI/CD pipeline integration for audits
* Custom security rules & policy enforcement
* Enterprise-grade reporting dashboards

---

## License & Support

* **License**: MIT – Open source security for ICP
* **Enterprise Support**: Dedicated audit services & integrations
* **Canister ID**: `bkyz2-fmaaa-aaaaa-qaaaq-cai` | **Network**: Internet Computer Protocol

---

**AVAI Agent** – *Autonomous multi-engine AI auditor securing the decentralized web*

```
