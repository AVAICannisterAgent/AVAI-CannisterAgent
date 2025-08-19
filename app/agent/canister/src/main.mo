import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Array "mo:base/Array";

actor AvaiCanisterAgent {
    
    // Data structure for storing analysis reports
    type AnalysisReport = {
        id: Text;
        timestamp: Int;
        content: Text;
        metadata: Text;
    };
    
    // Stable storage for reports
    stable var reports : [AnalysisReport] = [];
    
    // Upload a new analysis report to the canister
    public func uploadReport(id: Text, content: Text, metadata: Text) : async Text {
        let newReport : AnalysisReport = {
            id = id;
            timestamp = Time.now();
            content = content;
            metadata = metadata;
        };
        
        reports := Array.append(reports, [newReport]);
        Debug.print("Report uploaded successfully: " # id);
        return "Report uploaded successfully with ID: " # id;
    };
    
    // Retrieve a specific report by ID
    public query func getReport(id: Text) : async ?AnalysisReport {
        Array.find<AnalysisReport>(reports, func(report) { report.id == id })
    };
    
    // Get all reports
    public query func getAllReports() : async [AnalysisReport] {
        reports
    };
    
    // Get the count of stored reports
    public query func getReportCount() : async Nat {
        reports.size()
    };
    
    // Health check function
    public query func healthCheck() : async Text {
        "AVAI Canister Agent is running. Reports stored: " # debug_show(reports.size())
    };
}
