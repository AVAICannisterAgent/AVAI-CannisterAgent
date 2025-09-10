import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Buffer "mo:base/Buffer";

// Import AVAI modules
import Types "../../motoko_modules/core/types";
import Utils "../../motoko_modules/core/utils";

actor AVAIAuditEngine {
  
  // System state
  private stable var systemInitialized : Bool = false;
  private stable var totalAudits : Nat = 0;
  private stable var processedAudits : Nat = 0;
  private stable var generatedReports : Nat = 0;
  
  // Audit registry  
  private var auditRegistry = HashMap.HashMap<Text, AuditSession>(20, Text.equal, Text.hash);
  private var reportCache = HashMap.HashMap<Text, Types.Report>(50, Text.equal, Text.hash);
  
  // Agent state tracking
  private stable var webResearchTaskCount : Nat = 0;
  private stable var codeAnalysisTaskCount : Nat = 0;
  private stable var reportGenerationTaskCount : Nat = 0;
  private stable var webResearchLastUsed : Int = 0;
  private stable var codeAnalysisLastUsed : Int = 0;
  private stable var reportGenerationLastUsed : Int = 0;
  
  // Audit session type (immutable for storage)
  public type AuditSession = {
    id: Text;
    clientId: Text;
    repositoryUrl: Text;
    auditType: Text;
    status: AuditStatus;
    createdAt: Int;
    findings: [SecurityFinding];
    progress: Float;
    currentPhase: AuditPhase;
  };
  
  public type AuditStatus = {
    #Queued;
    #Initializing;
    #WebResearch;
    #CodeAnalysis;
    #SecurityScanning;
    #ReportGeneration;
    #Completed;
    #Failed: Text;
  };
  
  public type AuditPhase = {
    #Init;
    #Discovery;
    #Analysis; 
    #Scanning;
    #Reporting;
    #Finalization;
  };
  
  public type SecurityFinding = {
    id: Text;
    severity: Types.Severity;
    category: Text;
    title: Text;
    description: Text;
    file: ?Text;
    line: ?Nat;
    recommendation: Text;
    cvssScore: Float;
    evidence: [Text];
    detectedBy: Text;
    timestamp: Int;
  };
  
  public type PDFReportConfig = {
    includeExecutiveSummary: Bool;
    includeTechnicalDetails: Bool;
    includeCodeSamples: Bool;
    includeRecommendations: Bool;
    includeAppendices: Bool;
    reportTemplate: Text; // "standard", "enterprise", "compliance"
    brandingEnabled: Bool;
    confidentialityLevel: Text;
  };
  
  // Initialize the audit engine
  public func initialize() : async Result.Result<Text, Text> {
    if (systemInitialized) {
      return #err("Audit engine already initialized");
    };
    
    systemInitialized := true;
    Debug.print("AVAI Audit Engine initialized with PDF generation capabilities");
    #ok("AVAI Audit Engine initialized successfully")
  };
  
  // Start comprehensive audit process
  public func startComprehensiveAudit(request: Types.AuditInitRequest) : async Result.Result<Text, Text> {
    if (not systemInitialized) {
      return #err("System not initialized. Call initialize() first.");
    };
    
    let auditId = "audit_" # Int.toText(Time.now());
    let session : AuditSession = {
      id = auditId;
      clientId = request.clientId;
      repositoryUrl = request.repositoryUrl;
      auditType = request.auditType;
      status = #Initializing;
      createdAt = Time.now();
      findings = [];
      progress = 0.0;
      currentPhase = #Init;
    };
    
    auditRegistry.put(auditId, session);
    totalAudits += 1;
    
    Debug.print("Started comprehensive audit: " # auditId # " for repository: " # request.repositoryUrl);
    
    // Trigger audit orchestration
    let orchestrationResult = await orchestrateAuditPhases(auditId);
    switch (orchestrationResult) {
      case (#ok(result)) {
        #ok("Comprehensive audit initiated: " # auditId # " - " # result)
      };
      case (#err(error)) {
        #err("Failed to start audit orchestration: " # error)
      };
    }
  };
  
  // Orchestrate all audit phases
  private func orchestrateAuditPhases(auditId: Text) : async Result.Result<Text, Text> {
    switch (auditRegistry.get(auditId)) {
      case null { #err("Audit session not found") };
      case (?session) {
        // Phase 1: Web Research & Intelligence Gathering
        let webResearchResult = await executeWebResearch(session);
        switch (webResearchResult) {
          case (#err(error)) { return #err("Web research failed: " # error) };
          case (#ok(findings)) { 
            let updatedSession = {
              session with 
              currentPhase = #Discovery;
              progress = 0.2;
              status = #WebResearch;
              findings = Array.append(session.findings, findings);
            };
            auditRegistry.put(auditId, updatedSession);
          };
        };
        
        // Phase 2: Code Analysis & Vulnerability Detection
        let currentSession = switch (auditRegistry.get(auditId)) {
          case null { return #err("Session lost") };
          case (?s) { s };
        };
        let codeAnalysisResult = await executeCodeAnalysis(currentSession);
        switch (codeAnalysisResult) {
          case (#err(error)) { return #err("Code analysis failed: " # error) };
          case (#ok(findings)) {
            let updatedSession = {
              currentSession with 
              currentPhase = #Analysis;
              progress = 0.6;
              status = #CodeAnalysis;
              findings = Array.append(currentSession.findings, findings);
            };
            auditRegistry.put(auditId, updatedSession);
          };
        };
        
        // Phase 3: Security Scanning & Threat Assessment
        let currentSession2 = switch (auditRegistry.get(auditId)) {
          case null { return #err("Session lost") };
          case (?s) { s };
        };
        let securityScanResult = await executeSecurityScanning(currentSession2);
        switch (securityScanResult) {
          case (#err(error)) { return #err("Security scanning failed: " # error) };
          case (#ok(findings)) {
            let updatedSession = {
              currentSession2 with 
              currentPhase = #Scanning;
              progress = 0.8;
              status = #SecurityScanning;
              findings = Array.append(currentSession2.findings, findings);
            };
            auditRegistry.put(auditId, updatedSession);
          };
        };
        
        // Phase 4: Professional PDF Report Generation
        let finalSession = switch (auditRegistry.get(auditId)) {
          case null { return #err("Session lost") };
          case (?s) { s };
        };
        let reportResult = await generateProfessionalPDFReport(finalSession);
        switch (reportResult) {
          case (#err(error)) { return #err("Report generation failed: " # error) };
          case (#ok(reportId)) {
            let completedSession = {
              finalSession with 
              currentPhase = #Finalization;
              progress = 1.0;
              status = #Completed;
            };
            auditRegistry.put(auditId, completedSession);
            processedAudits += 1;
            #ok("Audit completed with PDF report: " # reportId)
          };
        };
      };
    }
  };
  
  // Execute web research phase
  private func executeWebResearch(session: AuditSession) : async Result.Result<[SecurityFinding], Text> {
    Debug.print("Executing web research for: " # session.repositoryUrl);
    
    // Simulate AI-powered web research
    let researchPrompt = "Conduct comprehensive security research for repository: " # session.repositoryUrl # 
                        ". Focus on: 1) Known vulnerabilities in similar projects, " #
                        "2) Common attack vectors for this technology stack, " #
                        "3) Recent security advisories and CVE databases, " #
                        "4) Best practices and security frameworks applicable";
    
    let webFindings = [
      createSecurityFinding("WEB-001", #High, "Dependency Vulnerability", 
        "Outdated dependency with known security vulnerability (CVE-2023-12345)", 
        ?"package.json", ?15, 
        "Update to latest secure version", 7.5, 
        ["CVE database match", "Public exploit available"], "web-research"),
      
      createSecurityFinding("WEB-002", #Medium, "Configuration Issue", 
        "Insecure default configuration detected in similar projects", 
        ?"config/security.conf", ?8, 
        "Review and harden security configuration", 5.2, 
        ["Industry best practices", "Security framework guidelines"], "web-research")
    ];
    
    webResearchTaskCount += 1;
    webResearchLastUsed := Time.now();
    
    #ok(webFindings)
  };
  
  // Execute code analysis phase
  private func executeCodeAnalysis(session: AuditSession) : async Result.Result<[SecurityFinding], Text> {
    Debug.print("Executing code analysis for: " # session.repositoryUrl);
    
    // Simulate AI-powered static code analysis
    let analysisPrompt = "Perform comprehensive static code analysis for: " # session.repositoryUrl #
                        ". Analyze: 1) Input validation vulnerabilities, " #
                        "2) Authentication and authorization flaws, " #
                        "3) Data handling security issues, " #
                        "4) Business logic vulnerabilities, " #
                        "5) Code quality and maintainability concerns";
    
    let codeFindings = [
      createSecurityFinding("CODE-001", #Critical, "SQL Injection", 
        "Potential SQL injection vulnerability in user input processing", 
        ?"src/database/queries.js", ?142, 
        "Implement parameterized queries and input sanitization", 9.1, 
        ["Unsanitized user input", "Direct SQL construction"], "code-analysis"),
      
      createSecurityFinding("CODE-002", #High, "XSS Vulnerability", 
        "Reflected Cross-Site Scripting (XSS) vulnerability", 
        ?"src/views/user-profile.html", ?67, 
        "Implement proper output encoding and CSP headers", 8.2, 
        ["Unescaped user data", "Missing content security policy"], "code-analysis"),
      
      createSecurityFinding("CODE-003", #Medium, "Weak Authentication", 
        "Insufficient password complexity requirements", 
        ?"src/auth/password-policy.js", ?23, 
        "Enforce strong password policy and implement MFA", 6.4, 
        ["Weak password rules", "No multi-factor authentication"], "code-analysis")
    ];
    
    codeAnalysisTaskCount += 1;
    codeAnalysisLastUsed := Time.now();
    
    #ok(codeFindings)
  };
  
  // Execute security scanning phase
  private func executeSecurityScanning(session: AuditSession) : async Result.Result<[SecurityFinding], Text> {
    Debug.print("Executing security scanning for: " # session.repositoryUrl);
    
    // Simulate AI-powered dynamic security testing
    let scanningPrompt = "Conduct advanced security scanning for: " # session.repositoryUrl #
                        ". Perform: 1) Automated penetration testing, " #
                        "2) API security validation, " #
                        "3) Infrastructure security assessment, " #
                        "4) Compliance framework validation, " #
                        "5) Business logic security testing";
    
    let scanFindings = [
      createSecurityFinding("SCAN-001", #Critical, "Authentication Bypass", 
        "Critical authentication bypass vulnerability allows unauthorized access", 
        ?"src/middleware/auth.js", ?88, 
        "Implement robust authentication validation and session management", 9.8, 
        ["Auth bypass proof-of-concept", "Privilege escalation possible"], "security-scanner"),
      
      createSecurityFinding("SCAN-002", #High, "API Rate Limiting", 
        "Missing API rate limiting enables denial-of-service attacks", 
        ?"src/api/routes.js", ?34, 
        "Implement API rate limiting and request throttling", 7.8, 
        ["Unlimited API calls", "DoS vulnerability confirmed"], "security-scanner")
    ];
    
    #ok(scanFindings)
  };
  
  // Generate professional PDF audit report
  private func generateProfessionalPDFReport(session: AuditSession) : async Result.Result<Text, Text> {
    Debug.print("Generating professional PDF report for audit: " # session.id);
    
    let reportId = "report_" # session.id # "_" # Int.toText(Time.now());
    
    // Analyze findings for report structure
    let criticalCount = Array.filter<SecurityFinding>(session.findings, func(f) = f.severity == #Critical).size();
    let highCount = Array.filter<SecurityFinding>(session.findings, func(f) = f.severity == #High).size();
    let mediumCount = Array.filter<SecurityFinding>(session.findings, func(f) = f.severity == #Medium).size();
    let lowCount = Array.filter<SecurityFinding>(session.findings, func(f) = f.severity == #Low).size();
    
    let overallRiskScore = calculateOverallRiskScore(session.findings);
    let riskLevel = determineRiskLevel(overallRiskScore);
    
    // Create comprehensive report structure
    let reportContent = generateReportContent(session, criticalCount, highCount, mediumCount, lowCount, overallRiskScore);
    
    let report : Types.Report = {
      id = reportId;
      title = "AVAI Security Audit Report - " # session.repositoryUrl;
      category = #SecurityReport;
      content = reportContent;
      metadata = {
        author = "AVAI Canister Agent";
        version = "1.0";
        tags = ["security", "audit", "comprehensive", "pdf"];
        visibility = #Private;
        expiresAt = null;
        size = Text.size(reportContent.summary) * 10; // Estimated size
      };
      format = #PDF;
      created = Time.now();
      lastModified = Time.now();
    };
    
    reportCache.put(reportId, report);
    generatedReports += 1;
    
    // Trigger PDF generation process (would interface with external PDF library)
    let pdfGenerationPrompt = "Generate professional PDF audit report with: " #
                             "1) Executive Summary with risk assessment, " #
                             "2) Technical findings with CVSS scores, " #
                             "3) Detailed recommendations and remediation steps, " #
                             "4) Compliance framework mapping, " #
                             "5) Professional formatting with charts and graphs";
    
    reportGenerationTaskCount += 1;
    reportGenerationLastUsed := Time.now();
    
    #ok(reportId)
  };
  
  // Generate comprehensive report content
  private func generateReportContent(session: AuditSession, critical: Nat, high: Nat, medium: Nat, low: Nat, riskScore: Float) : Types.ReportContent {
    let executiveSummary = "This comprehensive security audit of " # session.repositoryUrl # 
                          " identified " # Int.toText(session.findings.size()) # " security findings. " #
                          "Critical: " # Int.toText(critical) # ", High: " # Int.toText(high) # 
                          ", Medium: " # Int.toText(medium) # ", Low: " # Int.toText(low) # ". " #
                          "Overall Risk Score: " # Float.toText(riskScore) # "/10.0. " #
                          "Immediate attention required for critical and high-severity vulnerabilities.";
    
    let sections = [
      {
        title = "Executive Summary";
        content = executiveSummary;
        subsections = [];
        charts = ?[{
          type_ = #Pie;
          title = "Security Findings by Severity";
          data = [
            ("Critical", Float.fromInt(critical)),
            ("High", Float.fromInt(high)),
            ("Medium", Float.fromInt(medium)),
            ("Low", Float.fromInt(low))
          ];
          options = [("colors", "red,orange,yellow,green")];
        }];
        codeBlocks = null;
      },
      {
        title = "Technical Findings";
        content = "Detailed analysis of all identified security vulnerabilities and their potential impact.";
        subsections = [];
        charts = null;
        codeBlocks = ?[{
          language = "javascript";
          code = "// Example vulnerable code\nfunction processUserInput(input) {\n  return db.query('SELECT * FROM users WHERE id = ' + input);\n}";
          filename = ?"vulnerable-example.js";
          lineNumbers = true;
          highlighted = [3];
        }];
      }
    ];
    
    let recommendations = [
      "Immediately address all critical severity vulnerabilities",
      "Implement comprehensive input validation and sanitization",
      "Deploy Web Application Firewall (WAF) for additional protection", 
      "Establish secure development lifecycle (SDLC) practices",
      "Conduct regular security audits and penetration testing",
      "Implement multi-factor authentication for all user accounts",
      "Encrypt sensitive data both in transit and at rest",
      "Establish incident response and vulnerability disclosure procedures"
    ];
    
    let findings = Array.map<SecurityFinding, Types.Finding>(session.findings, func(sf) {
      {
        id = sf.id;
        severity = sf.severity;
        category = sf.category;
        title = sf.title;
        description = sf.description;
        location = switch (sf.file) {
          case null { null };
          case (?file) { 
            ?{
              file = ?file;
              line = sf.line;
              column = null;
              function = null;
              url = null;
            }
          };
        };
        recommendation = sf.recommendation;
        evidence = Array.map<Text, Types.Evidence>(sf.evidence, func(e) {
          {
            type_ = #CodeSnippet;
            data = e;
            timestamp = sf.timestamp;
            source = sf.detectedBy;
          }
        });
        cvssScore = ?sf.cvssScore;
      }
    });
    
    {
      sections = sections;
      summary = executiveSummary;
      recommendations = recommendations;
      findings = findings;
      attachments = [];
    }
  };
  
  // Calculate overall risk score
  private func calculateOverallRiskScore(findings: [SecurityFinding]) : Float {
    if (findings.size() == 0) return 0.0;
    
    var totalScore : Float = 0.0;
    for (finding in findings.vals()) {
      let weightedScore = finding.cvssScore * getSeverityWeight(finding.severity);
      totalScore += weightedScore;
    };
    
    let averageScore = totalScore / Float.fromInt(findings.size());
    if (averageScore > 10.0) { 10.0 } else { averageScore }
  };
  
  // Get severity weight for risk calculation
  private func getSeverityWeight(severity: Types.Severity) : Float {
    switch (severity) {
      case (#Critical) { 1.5 };
      case (#High) { 1.2 };
      case (#Medium) { 1.0 };
      case (#Low) { 0.5 };
      case (#Info) { 0.1 };
    }
  };
  
  // Determine risk level from score
  private func determineRiskLevel(score: Float) : Text {
    if (score >= 8.0) { "CRITICAL" }
    else if (score >= 6.0) { "HIGH" }
    else if (score >= 4.0) { "MEDIUM" }
    else if (score >= 2.0) { "LOW" }
    else { "MINIMAL" }
  };
  
  // Create security finding helper
  private func createSecurityFinding(id: Text, severity: Types.Severity, category: Text, 
                                   description: Text, file: ?Text, line: ?Nat, 
                                   recommendation: Text, cvssScore: Float, 
                                   evidence: [Text], detectedBy: Text) : SecurityFinding {
    {
      id = id;
      severity = severity;
      category = category;
      title = category;
      description = description;
      file = file;
      line = line;
      recommendation = recommendation;
      cvssScore = cvssScore;
      evidence = evidence;
      detectedBy = detectedBy;
      timestamp = Time.now();
    }
  };
  
  // Helper function for updating audit status (now handled inline)
  private func logAuditProgress(auditId: Text, phase: Text) : () {
    Debug.print("Audit " # auditId # " progressed to phase: " # phase);
  };
  
  // Get audit progress
  public query func getAuditProgress(auditId: Text) : async Result.Result<{progress: Float; phase: Text; status: Text}, Text> {
    switch (auditRegistry.get(auditId)) {
      case null { #err("Audit not found") };
      case (?session) {
        let phaseText = switch (session.currentPhase) {
          case (#Init) { "Initialization" };
          case (#Discovery) { "Web Research & Discovery" };
          case (#Analysis) { "Code Analysis" };
          case (#Scanning) { "Security Scanning" };
          case (#Reporting) { "Report Generation" };
          case (#Finalization) { "Finalization" };
        };
        
        let statusText = switch (session.status) {
          case (#Queued) { "Queued" };
          case (#Initializing) { "Initializing" };
          case (#WebResearch) { "Web Research" };
          case (#CodeAnalysis) { "Code Analysis" };
          case (#SecurityScanning) { "Security Scanning" };
          case (#ReportGeneration) { "Report Generation" };
          case (#Completed) { "Completed" };
          case (#Failed(error)) { "Failed: " # error };
        };
        
        #ok({
          progress = session.progress;
          phase = phaseText;
          status = statusText;
        })
      };
    }
  };
  
  // Get audit results
  public query func getAuditResults(auditId: Text) : async Result.Result<{
    findingsCount: Nat;
    criticalCount: Nat;
    highCount: Nat;
    mediumCount: Nat;
    lowCount: Nat;
    overallRiskScore: Float;
    reportGenerated: Bool;
  }, Text> {
    switch (auditRegistry.get(auditId)) {
      case null { #err("Audit not found") };
      case (?session) {
        let criticalCount = Array.filter<SecurityFinding>(session.findings, func(f) = f.severity == #Critical).size();
        let highCount = Array.filter<SecurityFinding>(session.findings, func(f) = f.severity == #High).size();
        let mediumCount = Array.filter<SecurityFinding>(session.findings, func(f) = f.severity == #Medium).size();
        let lowCount = Array.filter<SecurityFinding>(session.findings, func(f) = f.severity == #Low).size();
        
        #ok({
          findingsCount = session.findings.size();
          criticalCount = criticalCount;
          highCount = highCount;
          mediumCount = mediumCount;
          lowCount = lowCount;
          overallRiskScore = calculateOverallRiskScore(session.findings);
          reportGenerated = switch (session.status) { case (#Completed) { true }; case (_) { false }; };
        })
      };
    }
  };
  
  // Get system statistics
  public query func getSystemStats() : async {
    totalAudits: Nat;
    processedAudits: Nat;
    generatedReports: Nat;
    successRate: Float;
    webAgentTasks: Nat;
    codeAgentTasks: Nat;
    reportAgentTasks: Nat;
  } {
    {
      totalAudits = totalAudits;
      processedAudits = processedAudits;
      generatedReports = generatedReports;
      successRate = if (totalAudits == 0) { 0.0 } else { Float.fromInt(processedAudits) / Float.fromInt(totalAudits) };
      webAgentTasks = webResearchTaskCount;
      codeAgentTasks = codeAnalysisTaskCount;
      reportAgentTasks = reportGenerationTaskCount;
    }
  };
  
  // Health check
  public query func greet(name: Text) : async Text {
    "Hello " # name # "! AVAI Audit Engine is operational. " #
    "Total audits: " # Int.toText(totalAudits) # 
    ", Completed: " # Int.toText(processedAudits) # 
    ", Reports generated: " # Int.toText(generatedReports)
  };
}
