import Text "mo:base/Text";
import Result "mo:base/Result";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";

/**
 * SIMPLE HTTP Client for IC Canisters using basic HTTPS outcalls
 * Compatible with dfx 0.22.0 and standard IC management canister
 */
module {
    
    public type HttpMethod = {
        #get;
        #post;
        #head;
        #put;
        #delete;
        #patch;
    };

    public type HttpResponse = {
        status : Nat;
        headers : [(Text, Text)];
        body : [Nat8];
    };

    // Basic HTTP request args for IC management canister
    public type HttpRequestArgs = {
        url : Text;
        max_response_bytes : ?Nat64;
        headers : [(Text, Text)];
        body : ?[Nat8];
        method : HttpMethod;
        transform : ?{
            #function : query {
                response : HttpResponse;
                context : Blob;
            } -> async {
                response : HttpResponse;
            };
        };
    };

    public type SimpleHttpRequest = {
        url: Text;
        method: Text;
        headers: [(Text, Text)];
        body: ?[Nat8];
        max_response_bytes: ?Nat64;
    };

    /**
     * Make a simple HTTP request using basic IC management canister
     */
    public func makeSimpleRequest(request: SimpleHttpRequest): async Result.Result<HttpResponse, Text> {
        try {
            Debug.print("🚀 Making SIMPLE HTTP outcall to: " # request.url);
            
            // IC Management Canister interface (basic version)
            let ic = actor "aaaaa-aa" : actor {
                http_request : HttpRequestArgs -> async HttpResponse;
            };
            
            // Add cycles for HTTP outcall (standard amount)
            let cycles = 20_000_000_000; // 20B cycles
            Cycles.add<system>(cycles);
            Debug.print("💰 Allocated cycles: " # debug_show(cycles));
            
            // Convert method string to HttpMethod type
            let method = switch (request.method) {
                case ("GET") #get;
                case ("POST") #post;
                case ("PUT") #put;
                case ("DELETE") #delete;
                case ("PATCH") #patch;
                case ("HEAD") #head;
                case (_) #get; // Default to GET
            };
            
            // Basic headers
            let baseHeaders = [
                ("User-Agent", "AVAI-Simple-Motoko-Canister/1.0"),
                ("Accept", "application/json")
            ];
            let allHeaders = Array.append(baseHeaders, request.headers);
            
            // Prepare basic IC HTTP request
            let icRequest: HttpRequestArgs = {
                url = request.url;
                max_response_bytes = switch (request.max_response_bytes) {
                    case (?size) ?size;
                    case null ?1048576 : ?Nat64; // 1MB default
                };
                headers = allHeaders;
                body = request.body;
                method = method;
                transform = null; // No transform
            };
            
            Debug.print("🔐 Attempting simple HTTPS outcall...");
            let response = await ic.http_request(icRequest);
            Debug.print("✅ Simple HTTPS outcall successful! Status: " # debug_show(response.status));
            Debug.print("📊 Response size: " # debug_show(response.body.size()) # " bytes");
            #ok(response)
            
        } catch (error) {
            Debug.print("❌ Simple HTTP client error occurred");
            #err("Simple HTTP request failed")
        }
    };
}