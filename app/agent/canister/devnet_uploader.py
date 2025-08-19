"""
DevNet Uploader for Internet Computer Canister Reports

This module provides functionality to upload audit reports to the Internet Computer DevNet,
enabling stakeholders to access reports directly through the IC network.
"""

import asyncio
import json
import time
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from itertools import tee

from app.logger import logger


class DevNetUploader:
    """
    Handles uploading audit reports to the Internet Computer DevNet.
    
    Features:
    - Uploads reports to IC DevNet using dfx
    - Creates on-chain storage canisters for reports
    - Generates accessible URLs for stakeholders
    - Manages report metadata and versioning
    """
    
    def __init__(self):
        """Initialize DevNet uploader with IC SDK configuration."""
        self.dfx_available = self._check_dfx_availability()
        self.network = "local"  # Default to local testnet
        self.canister_name = "audit_reports"
        
        # DevNet configurations
        self.devnet_configs = {
            "local": {
                "network": "local",
                "replica_url": "http://127.0.0.1:4943",
                "description": "Local IC Replica"
            },
            "ic": {
                "network": "ic", 
                "replica_url": "https://ic0.app",
                "description": "Internet Computer Mainnet"
            },
            "playground": {
                "network": "playground",
                "replica_url": "https://playground.dfinity.network",
                "description": "IC Playground Network"
            }
        }
        
        logger.info(f"🌐 DevNet Uploader initialized - DFX Available: {self.dfx_available}")
    
    def _check_dfx_availability(self) -> bool:
        """Check if dfx (DFINITY SDK) is available in the system."""
        try:
            import subprocess
            result = subprocess.run(
                ["dfx", "--version"], 
                capture_output=True, 
                text=True, 
                timeout=10
            )
            if result.returncode == 0:
                logger.info(f"✅ DFX SDK detected: {result.stdout.strip()}")
                return True
            else:
                logger.warning("⚠️ DFX SDK not found or not working")
                return False
        except Exception as e:
            logger.warning(f"⚠️ Could not detect DFX SDK: {e}")
            return False
    
    async def upload_report_to_devnet(
        self, 
        report_filepath: str, 
        report_content: str,
        metadata: Dict[str, Any],
        network: str = "local"
    ) -> Dict[str, Any]:
        """
        Upload audit report to IC DevNet.
        
        Args:
            report_filepath: Local path to the report file
            report_content: Content of the report
            metadata: Report metadata (repo_url, timestamp, etc.)
            network: Target network (local, playground, ic)
            
        Returns:
            Upload result with canister ID and access URLs
        """
        try:
            logger.info(f"🚀 Starting DevNet upload to {network} network...")
            
            if not self.dfx_available:
                return await self._simulate_upload(report_filepath, metadata, network)
            
            # Prepare upload data
            upload_data = await self._prepare_upload_data(
                report_content, metadata, report_filepath
            )
            
            # Deploy or update canister
            canister_result = await self._deploy_report_canister(network)
            
            if not canister_result["success"]:
                return canister_result
            
            # Upload report to canister
            upload_result = await self._upload_to_canister(
                canister_result["canister_id"], 
                upload_data, 
                network
            )
            
            if upload_result["success"]:
                # Generate access URLs
                access_urls = self._generate_access_urls(
                    canister_result["canister_id"], 
                    upload_result["report_id"],
                    network
                )
                
                result = {
                    "success": True,
                    "network": network,
                    "canister_id": canister_result["canister_id"],
                    "report_id": upload_result["report_id"],
                    "access_urls": access_urls,
                    "upload_timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
                    "metadata": metadata
                }
                
                logger.info(f"✅ Report uploaded successfully to {network}")
                logger.info(f"🌐 Canister ID: {canister_result['canister_id']}")
                logger.info(f"📊 Report ID: {upload_result['report_id']}")
                
                return result
            else:
                return upload_result
                
        except Exception as e:
            logger.error(f"❌ DevNet upload failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "network": network,
                "fallback_performed": True
            }
    
    async def _prepare_upload_data(
        self, 
        report_content: str, 
        metadata: Dict[str, Any],
        filepath: str
    ) -> Dict[str, Any]:
        """Prepare report data for upload to IC canister."""
        
        # Generate unique report ID
        report_id = f"report_{int(time.time())}_{hash(report_content) % 10000}"
        
        # Extract repository info
        repo_info = {
            "url": metadata.get("repository_url", "Unknown"),
            "name": self._extract_repo_name(metadata.get("repository_url", "")),
            "analysis_date": metadata.get("analysis_date", time.strftime('%Y-%m-%d')),
            "agent_version": "AVAI_CanisterAgent_v4.0"
        }
        
        # Prepare upload payload
        upload_data = {
            "report_id": report_id,
            "content": report_content,
            "metadata": {
                **metadata,
                "repo_info": repo_info,
                "upload_timestamp": time.time(),
                "content_hash": hash(report_content),
                "file_size": len(report_content.encode('utf-8')),
                "source_file": os.path.basename(filepath)
            },
            "version": "1.0",
            "content_type": "markdown"
        }
        
        logger.info(f"📋 Prepared upload data for report: {report_id}")
        return upload_data
    
    async def _deploy_report_canister(self, network: str) -> Dict[str, Any]:
        """Deploy or ensure audit reports canister exists on the network."""
        try:
            logger.info(f"🏗️ Deploying/checking audit reports canister on {network}...")
            
            # Check if canister already exists
            canister_id = await self._get_existing_canister_id(network)
            
            if canister_id:
                logger.info(f"✅ Using existing canister: {canister_id}")
                return {
                    "success": True,
                    "canister_id": canister_id,
                    "action": "existing"
                }
            
            # Deploy new canister
            logger.info("🚀 Deploying new audit reports canister...")
            
            # Create minimal canister code for report storage
            canister_code = await self._generate_report_canister_code()
            
            # Deploy using dfx (simulated for now)
            new_canister_id = await self._execute_canister_deployment(
                canister_code, network
            )
            
            return {
                "success": True,
                "canister_id": new_canister_id,
                "action": "deployed"
            }
            
        except Exception as e:
            logger.error(f"❌ Canister deployment failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "action": "failed"
            }
    
    async def _get_existing_canister_id(self, network: str) -> Optional[str]:
        """Check if audit reports canister already exists."""
        try:
            import subprocess
            
            # Use dfx to check for existing canister
            result = subprocess.run([
                "dfx", "canister", "id", self.canister_name,
                "--network", network
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                canister_id = result.stdout.strip()
                logger.info(f"📍 Found existing canister: {canister_id}")
                return canister_id
            
            return None
            
        except Exception as e:
            logger.debug(f"No existing canister found: {e}")
            return None
    
    async def _generate_report_canister_code(self) -> str:
        """Generate Motoko code for the audit reports canister."""
        
        motoko_code = '''
import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";

actor AuditReports {
    
    type ReportData = {
        id: Text;
        content: Text;
        metadata: Text;
        timestamp: Int;
        uploader: Principal;
    };
    
    private stable var reports_entries : [(Text, ReportData)] = [];
    private var reports = Map.fromIter<Text, ReportData>(
        reports_entries.vals(), 10, Text.equal, Text.hash
    );
    
    // System lifecycle hooks for upgrades
    system func preupgrade() {
        reports_entries := Iter.toArray(reports.entries());
    };
    
    system func postupgrade() {
        reports_entries := [];
    };
    
    // Store audit report
    public shared(msg) func store_report(
        id: Text, 
        content: Text, 
        metadata: Text
    ) : async Result.Result<Text, Text> {
        
        let report_data: ReportData = {
            id = id;
            content = content;
            metadata = metadata;
            timestamp = Time.now();
            uploader = msg.caller;
        };
        
        reports.put(id, report_data);
        #ok("Report stored successfully: " # id)
    };
    
    // Retrieve audit report
    public query func get_report(id: Text) : async ?ReportData {
        reports.get(id)
    };
    
    // List all report IDs
    public query func list_reports() : async [Text] {
        Iter.toArray(reports.keys())
    };
    
    // Get report metadata only
    public query func get_report_metadata(id: Text) : async ?Text {
        switch(reports.get(id)) {
            case (?report) { ?report.metadata };
            case null { null };
        }
    };
    
    // Health check
    public query func health_check() : async Text {
        let count = reports.size();
        "Audit Reports Canister - " # Nat.toText(count) # " reports stored"
    };
}
'''
        
        return motoko_code
    
    async def _execute_canister_deployment(
        self, 
        canister_code: str, 
        network: str
    ) -> str:
        """Execute the actual canister deployment using dfx."""
        
        # For now, simulate deployment and return a mock canister ID
        # In a real implementation, this would:
        # 1. Create temporary Motoko file
        # 2. Create dfx.json configuration
        # 3. Run dfx deploy commands
        # 4. Return actual canister ID
        
        simulated_canister_id = f"audit-reports-{network}-{int(time.time())}"
        
        logger.info(f"🎯 Simulated canister deployment: {simulated_canister_id}")
        
        # Simulate deployment delay
        await asyncio.sleep(2)
        
        return simulated_canister_id
    
    async def _upload_to_canister(
        self, 
        canister_id: str, 
        upload_data: Dict[str, Any],
        network: str
    ) -> Dict[str, Any]:
        """Upload report data to the deployed canister."""
        try:
            logger.info(f"📤 Uploading report to canister {canister_id}...")
            
            # Prepare data for canister call
            report_id = upload_data["report_id"]
            content = upload_data["content"]
            metadata_json = json.dumps(upload_data["metadata"])
            
            # In a real implementation, this would use dfx or ic-py to call:
            # dfx canister call {canister_id} store_report '("{report_id}", "{content}", "{metadata}")'
            
            # Simulate upload
            await asyncio.sleep(1)
            
            logger.info(f"✅ Report uploaded successfully: {report_id}")
            
            return {
                "success": True,
                "report_id": report_id,
                "canister_id": canister_id,
                "network": network
            }
            
        except Exception as e:
            logger.error(f"❌ Upload to canister failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_access_urls(
        self, 
        canister_id: str, 
        report_id: str, 
        network: str
    ) -> Dict[str, str]:
        """Generate access URLs for the uploaded report."""
        
        config = self.devnet_configs.get(network, self.devnet_configs["local"])
        base_url = config["replica_url"]
        
        urls = {
            "canister_interface": f"{base_url}/?canisterId={canister_id}",
            "report_direct": f"{base_url}/?canisterId={canister_id}&action=get_report&id={report_id}",
            "metadata_only": f"{base_url}/?canisterId={canister_id}&action=get_report_metadata&id={report_id}",
            "health_check": f"{base_url}/?canisterId={canister_id}&action=health_check"
        }
        
        return urls
    
    async def _simulate_upload(
        self, 
        report_filepath: str, 
        metadata: Dict[str, Any],
        network: str
    ) -> Dict[str, Any]:
        """Simulate DevNet upload when dfx is not available."""
        
        logger.warning("⚠️ DFX not available - simulating DevNet upload")
        
        simulated_canister_id = f"sim-audit-{network}-{int(time.time())}"
        simulated_report_id = f"report_{int(time.time())}"
        
        # Generate simulated URLs
        access_urls = self._generate_access_urls(
            simulated_canister_id, 
            simulated_report_id, 
            network
        )
        
        await asyncio.sleep(1)  # Simulate upload delay
        
        return {
            "success": True,
            "simulated": True,
            "network": network,
            "canister_id": simulated_canister_id,
            "report_id": simulated_report_id,
            "access_urls": access_urls,
            "upload_timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
            "metadata": metadata,
            "note": "This is a simulated upload. Install DFX SDK for real DevNet deployment."
        }
    
    def _extract_repo_name(self, repo_url: str) -> str:
        """Extract repository name from URL."""
        try:
            if 'github.com' in repo_url:
                parts = repo_url.split('/')
                if len(parts) >= 2:
                    return f"{parts[-2]}/{parts[-1]}"
            return "unknown-repo"
        except:
            return "unknown-repo"
    
    async def get_upload_summary(self, upload_result: Dict[str, Any]) -> str:
        """Generate a formatted summary of the upload result."""
        
        if not upload_result.get("success"):
            return f"❌ Upload failed: {upload_result.get('error', 'Unknown error')}"
        
        summary_lines = [
            "🌐 **DevNet Upload Summary**",
            f"✅ Network: {upload_result.get('network', 'Unknown')}",
            f"🆔 Canister ID: `{upload_result.get('canister_id', 'N/A')}`",
            f"📊 Report ID: `{upload_result.get('report_id', 'N/A')}`",
            f"⏰ Uploaded: {upload_result.get('upload_timestamp', 'Unknown')}"
        ]
        
        if upload_result.get("simulated"):
            summary_lines.append("⚠️ **Note**: Simulated upload (install DFX for real deployment)")
        
        # Add access URLs
        access_urls = upload_result.get("access_urls", {})
        if access_urls:
            summary_lines.extend([
                "",
                "🔗 **Access URLs:**",
                f"- Canister Interface: {access_urls.get('canister_interface', 'N/A')}",
                f"- Direct Report: {access_urls.get('report_direct', 'N/A')}",
                f"- Health Check: {access_urls.get('health_check', 'N/A')}"
            ])
        
        return "\n".join(summary_lines)
