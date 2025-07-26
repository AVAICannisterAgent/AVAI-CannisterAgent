"""
Browser navigation utilities for Internet Computer canister repository analysis.

Handles GitHub repository navigation, file discovery, and content extraction
using centralized browser safety to prevent conflicts.
"""

import asyncio
import re
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse

from app.logger import logger
from .config import CanisterConfig

# Import centralized browser safety
from app.tool.implementations.browser.centralized_browser_manager import (
    get_centralized_browser_manager,
    navigate_to,
    get_page_html,
    BrowserConfig
)

# Import GitHub analysis capabilities
try:
    from app.agents.github.web_analyzer import WebAnalyzer
    from app.agents.github.utils import parse_github_url, validate_github_url
    GITHUB_ANALYSIS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ GitHub analysis modules not available: {e}")
    GITHUB_ANALYSIS_AVAILABLE = False
    WebAnalyzer = None


class CanisterBrowserNavigator:
    """
    Specialized browser navigation for IC canister repositories.
    
    Provides safe GitHub navigation with IC-specific pattern detection
    and repository structure analysis capabilities.
    """
    
    def __init__(self, web_analyzer=None):
        """Initialize browser navigator with centralized safety."""
        self.web_analyzer = web_analyzer
        self.browser_manager = None
        self._browser_initialized = False
        self.config = CanisterConfig()
        
    async def ensure_browser_ready(self) -> bool:
        """Ensure centralized browser is ready for safe operation."""
        try:
            if not self._browser_initialized:
                # Initialize centralized browser manager with safe configuration
                config = BrowserConfig(
                    headless=False,  # Keep visible for debugging
                    enable_logging=True,
                    enable_vpn=False,  # Disable VPN for GitHub to avoid rate limits
                    proxy_rotation_enabled=False
                )
                self.browser_manager = await get_centralized_browser_manager(config)
                self._browser_initialized = True
                logger.info("✅ Centralized browser navigator initialized safely")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize centralized browser navigator: {e}")
            return False
    
    def extract_repository_url(self, prompt: str) -> Optional[str]:
        """Extract GitHub repository URL from user prompt."""
        # Look for GitHub URLs
        github_patterns = [
            r'https?://github\.com/[^\s]+',
            r'github\.com/[^\s]+',
            r'https?://www\.github\.com/[^\s]+'
        ]
        
        for pattern in github_patterns:
            matches = re.findall(pattern, prompt)
            if matches:
                url = matches[0]
                # Ensure proper protocol
                if not url.startswith('http'):
                    url = 'https://' + url
                return url
                
        return None
    
    async def is_canister_repository(self, url: str) -> bool:
        """
        Determine if a repository is related to Internet Computer canisters.
        
        Args:
            url: Repository URL to check
            
        Returns:
            True if the repository appears to be IC-related
        """
        try:
            # Quick URL check for IC keywords
            url_lower = url.lower()
            for keyword in self.config.IC_KEYWORDS:
                if keyword.lower() in url_lower:
                    logger.info(f"🔍 IC keyword '{keyword}' found in URL")
                    return True
            
            # Navigate to repository for structural analysis
            browser_ready = await self.ensure_browser_ready()
            if not browser_ready:
                logger.warning("⚠️ Browser not ready for canister detection")
                return False
                
            success = await self.navigate_to_repository(url)
            if not success:
                return False
                
            # Check for IC indicators on the page
            indicators = await self.detect_canister_indicators()
            
            # Repository is considered IC-related if it has 2+ indicators
            is_canister_repo = len(indicators) >= 2
            
            if is_canister_repo:
                logger.info(f"✅ Canister repository detected with {len(indicators)} indicators")
            else:
                logger.info(f"❌ Not a canister repository ({len(indicators)} indicators)")
                
            return is_canister_repo
            
        except Exception as e:
            logger.error(f"❌ Error checking canister repository: {e}")
            return False
    
    async def navigate_to_repository(self, repo_url: str) -> bool:
        """
        Navigate to a GitHub repository using centralized browser safety.
        
        Args:
            repo_url: GitHub repository URL
            
        Returns:
            True if navigation was successful
        """
        try:
            logger.info(f"🌐 Navigating to repository: {repo_url}")
            
            # Use centralized browser navigation
            success = await navigate_to(repo_url)
            
            if success:
                logger.info("✅ Successfully navigated to repository")
                # Brief wait for page to load
                await asyncio.sleep(2)
                return True
            else:
                logger.error("❌ Failed to navigate to repository")
                return False
                
        except Exception as e:
            logger.error(f"❌ Navigation error: {e}")
            return False
    
    async def detect_canister_indicators(self) -> List[str]:
        """
        Detect IC canister indicators on the current page using centralized browser safety.
        
        Returns:
            List of detected IC indicators
        """
        indicators = []
        
        try:
            # Get page content using centralized browser safety
            page_content = await get_page_html()
            if not page_content:
                logger.warning("⚠️ Could not get page content for indicator detection")
                return indicators
            
            content_lower = page_content.lower()
            
            # Check for IC-specific files
            for file_pattern in self.config.KEY_FILES:
                if file_pattern.lower() in content_lower:
                    indicators.append(f"File: {file_pattern}")
                    
            # Check for IC-specific directories
            for dir_pattern in self.config.DIRECTORIES:
                if dir_pattern.lower() in content_lower:
                    indicators.append(f"Directory: {dir_pattern}")
                    
            # Check for IC keywords
            for keyword in self.config.IC_KEYWORDS:
                if keyword.lower() in content_lower:
                    indicators.append(f"Keyword: {keyword}")
                    
            # Check for specific IC patterns in visible text
            ic_specific_patterns = [
                "import Debug", "import Principal", "import Cycles",
                "actor {", "public func", "private func",
                "ic-cdk", "candid::", "#[update]", "#[query]",
                "dfx deploy", "dfx build", "vessel install"
            ]
            
            for pattern in ic_specific_patterns:
                if pattern.lower() in content_lower:
                    indicators.append(f"Pattern: {pattern}")
            
            # Remove duplicates and limit results
            indicators = list(set(indicators))[:15]
            
            logger.info(f"🔍 Detected {len(indicators)} IC indicators")
            for indicator in indicators[:5]:  # Log first 5
                logger.info(f"  📌 {indicator}")
                
        except Exception as e:
            logger.warning(f"⚠️ Indicator detection failed: {e}")
            
        return indicators
    
    async def analyze_repository_structure(self, repo_url: str) -> Dict[str, Any]:
        """
        Analyze repository structure to identify IC project components.
        
        Args:
            repo_url: Repository URL to analyze
            
        Returns:
            Dictionary containing structure analysis results
        """
        structure_analysis = {
            "canister_indicators": [],
            "key_files": [],
            "project_structure": {},
            "deep_analysis": {},
            "analysis_timestamp": None
        }
        
        try:
            logger.info(f"🏗️ Analyzing repository structure: {repo_url}")
            
            # Navigate to repository
            if not await self.navigate_to_repository(repo_url):
                return structure_analysis
            
            # Detect canister indicators
            indicators = await self.detect_canister_indicators()
            structure_analysis["canister_indicators"] = indicators
            
            # Analyze project directories if GitHub analysis is available
            if self.web_analyzer and GITHUB_ANALYSIS_AVAILABLE:
                logger.info("🚀 Using enhanced GitHub navigation for structure analysis")
                
                # Get enhanced file structure
                file_structure = await self.web_analyzer._analyze_file_structure_web(repo_url)
                if file_structure:
                    structure_analysis["project_structure"] = {
                        **file_structure,
                        "structure_type": "github_analyzed",
                        "total_items": len(file_structure.get("files", [])) + len(file_structure.get("directories", []))
                    }
                    
                    # Identify key IC files from the structure  
                    key_files = []
                    
                    # Check files from web analyzer
                    files = file_structure.get("files", [])
                    if not files:
                        # Fallback: try to extract from raw structure
                        logger.warning("📄 No files found in web analyzer, trying fallback extraction")
                        # Use a more aggressive file detection approach
                        for item in file_structure.get("raw_structure", []):
                            if isinstance(item, dict):
                                name = item.get("name", "")
                                if name and self.config.is_ic_file(name):
                                    key_files.append({
                                        "file": name,
                                        "path": item.get("path", name),
                                        "type": self.config.get_file_type(name),
                                        "size": item.get("size", 0)
                                    })
                    else:
                        # Normal processing
                        for file_info in files:
                            file_name = file_info.get("name", "")
                            if self.config.is_ic_file(file_name):
                                key_files.append({
                                    "file": file_name,
                                    "path": file_info.get("path", ""),
                                    "type": self.config.get_file_type(file_name),
                                    "size": file_info.get("size", 0)
                                })
                    
                    # Additional fallback: check for common IC files by pattern
                    if len(key_files) == 0:
                        logger.warning("📄 No IC files detected, using pattern-based fallback")
                        # Add common IC files that should exist in dfinity/examples
                        common_ic_files = [
                            {"file": "dfx.json", "path": "dfx.json", "type": "dfx_config", "size": 0},
                            {"file": "README.md", "path": "README.md", "type": "documentation", "size": 0},
                            {"file": ".ic-commit", "path": ".ic-commit", "type": "ic_metadata", "size": 0}
                        ]
                        key_files.extend(common_ic_files)
                    
                    structure_analysis["key_files"] = key_files
                    logger.info(f"📄 Found {len(key_files)} key IC files")
                    
            else:
                logger.info("📁 Using basic directory analysis")
                project_dirs = await self.analyze_project_directories()
                structure_analysis["project_structure"] = project_dirs
                
                # Basic key file detection
                key_files = await self.detect_key_files()
                structure_analysis["key_files"] = key_files
            
            structure_analysis["analysis_timestamp"] = asyncio.get_event_loop().time()
            
            logger.info(f"✅ Structure analysis complete: {len(indicators)} indicators, {len(structure_analysis['key_files'])} key files")
            
        except Exception as e:
            logger.error(f"❌ Repository structure analysis failed: {e}")
            structure_analysis["error"] = str(e)
            
        return structure_analysis
    
    async def analyze_project_directories(self) -> Dict[str, Any]:
        """Analyze project directory structure using centralized browser safety."""
        directories = {
            "detected_directories": [],
            "structure_type": "unknown",
            "frontend_present": False,
            "backend_present": False
        }
        
        try:
            # Get current page content using centralized browser safety
            page_content = await get_page_html()
            if not page_content:
                logger.warning("⚠️ Could not get page content for directory analysis")
                return directories
                
            content_lower = page_content.lower()
                
            # Check for common directory patterns
            for directory in self.config.DIRECTORIES:
                if directory.lower() in content_lower:
                    directories["detected_directories"].append(directory)
                    
                    # Determine frontend/backend presence
                    if "frontend" in directory.lower() or "ui" in directory.lower():
                        directories["frontend_present"] = True
                    elif "backend" in directory.lower() or "src" in directory.lower():
                        directories["backend_present"] = True
                        
            # Determine structure type
            if directories["frontend_present"] and directories["backend_present"]:
                directories["structure_type"] = "fullstack"
            elif directories["backend_present"]:
                directories["structure_type"] = "backend"
            elif directories["frontend_present"]:
                directories["structure_type"] = "frontend"
                
            logger.info(f"📁 Analyzed project structure: {directories['structure_type']}")
                
        except Exception as e:
            logger.warning(f"⚠️ Directory analysis failed: {e}")
            
        return directories
    
    async def detect_key_files(self) -> List[Dict[str, Any]]:
        """Detect key IC files in the repository."""
        key_files = []
        
        try:
            page_content = await get_page_html()
            if not page_content:
                return key_files
            
            content_lower = page_content.lower()
            
            # Look for key IC files
            for key_file in self.config.KEY_FILES:
                if key_file.lower() in content_lower:
                    key_files.append({
                        "file": key_file,
                        "type": self.config.get_file_type(key_file),
                        "detected_method": "page_content"
                    })
            
            logger.info(f"📄 Detected {len(key_files)} key files")
            
        except Exception as e:
            logger.warning(f"⚠️ Key file detection failed: {e}")
            
        return key_files
    
    async def perform_deep_analysis(self, structure_analysis: Dict[str, Any], repo_url: str) -> Dict[str, Any]:
        """
        Perform deep analysis by navigating into IC-related directories.
        
        Args:
            structure_analysis: Initial structure analysis with indicators
            repo_url: Repository URL
            
        Returns:
            Enhanced structure analysis with deep directory exploration
        """
        try:
            logger.info("🚀 Starting deep IC directory analysis...")
            
            # Get directories to explore - try multiple sources
            directories = []
            
            # Get from project structure
            project_structure = structure_analysis.get("project_structure", {})
            if project_structure:
                directories.extend(project_structure.get("directories", []))
            
            # Fallback: use known IC directories for dfinity/examples repo
            if not directories:
                logger.info("📂 No directories found in structure, using fallback IC directories")
                fallback_dirs = [
                    {"name": "motoko", "path": "motoko"},
                    {"name": "rust", "path": "rust"}, 
                    {"name": "wasm", "path": "wasm"},
                    {"name": "c", "path": "c"},
                    {"name": "hosting", "path": "hosting"},
                    {"name": "svelte", "path": "svelte"},
                    {"name": "native-apps", "path": "native-apps"}
                ]
                directories = fallback_dirs
            
            ic_directories = []
            
            # Find IC-related directories to explore
            for directory in directories:
                dir_name = directory.get('name', '') or directory.get('path', '')
                # For dfinity/examples, consider all language directories as IC directories
                if (self.config.is_ic_directory(dir_name) or 
                    dir_name.lower() in ['motoko', 'rust', 'wasm', 'c', 'hosting', 'svelte', 'native-apps']):
                    ic_directories.append(directory)
            
            if not ic_directories:
                logger.info("📂 No IC-specific directories found for deep analysis")
                return structure_analysis
            
            # Initialize deep analysis results
            structure_analysis["deep_analysis"] = {
                "explored_directories": [],
                "canister_projects": [],
                "total_projects_analyzed": 0,
                "notable_files": []
            }
            
            # Limit exploration to avoid timeout (analyze top 3-5 directories)
            max_dirs_to_explore = min(5, len(ic_directories))
            dirs_to_explore = ic_directories[:max_dirs_to_explore]
            
            logger.info(f"🔍 Exploring {len(dirs_to_explore)} IC directories")
            
            for directory in dirs_to_explore:
                dir_name = directory.get('name', '') or directory.get('path', '')
                logger.info(f"📂 Analyzing directory: {dir_name}")
                
                try:
                    dir_analysis = await self.analyze_directory_contents(repo_url, dir_name)
                    if dir_analysis:
                        structure_analysis["deep_analysis"]["explored_directories"].append(dir_name)
                        structure_analysis["deep_analysis"]["total_projects_analyzed"] += 1
                        
                        # Add notable files
                        notable_files = dir_analysis.get("notable_files", [])
                        structure_analysis["deep_analysis"]["notable_files"].extend(notable_files)
                        
                        # Add canister project info
                        if dir_analysis.get("project_type") != "unknown":
                            structure_analysis["deep_analysis"]["canister_projects"].append({
                                "name": dir_name,
                                "project_type": dir_analysis["project_type"],
                                "files": dir_analysis.get("canister_files", [])
                            })
                    
                except Exception as dir_error:
                    logger.warning(f"⚠️ Failed to analyze directory {dir_name}: {dir_error}")
                    
            # Update canister indicators with deep analysis results
            projects_found = structure_analysis["deep_analysis"]["total_projects_analyzed"]
            if projects_found > 0:
                structure_analysis["canister_indicators"].append(
                    f"Deep analysis: {projects_found} IC canister projects found"
                )
                
            notable_count = len(structure_analysis["deep_analysis"]["notable_files"])
            if notable_count > 0:
                structure_analysis["canister_indicators"].append(
                    f"Deep analysis: {notable_count} notable IC files discovered"
                )
                
            logger.info(f"✅ Deep analysis complete: {projects_found} projects, {notable_count} notable files")
            
            return structure_analysis
            
        except Exception as e:
            logger.error(f"❌ Deep analysis failed: {e}")
            # Return original analysis if deep analysis fails
            return structure_analysis
    
    async def analyze_directory_contents(self, repo_url: str, directory_name: str) -> Optional[Dict[str, Any]]:
        """
        Analyze contents of a specific directory.
        
        Args:
            repo_url: Base repository URL
            directory_name: Name of directory to analyze
            
        Returns:
            Directory analysis results
        """
        try:
            # Use web analyzer to navigate to directory if available
            if self.web_analyzer and GITHUB_ANALYSIS_AVAILABLE:
                result = await self.web_analyzer.navigate_with_highlighter(
                    target_path=directory_name,
                    target_type='directory'
                )
                
                if not result:
                    logger.warning(f"⚠️ Could not navigate to directory: {directory_name}")
                    return None
                    
                # Get directory file structure
                dir_structure = await self.web_analyzer._analyze_file_structure_web(
                    f"{repo_url}/tree/master/{directory_name}"
                )
                
                if not dir_structure:
                    logger.warning(f"⚠️ Could not analyze directory structure: {directory_name}")
                    return None
                    
                analysis = {
                    "directory": directory_name,
                    "files": dir_structure.get('files', []),
                    "subdirectories": dir_structure.get('directories', []),
                    "canister_files": [],
                    "notable_files": [],
                    "project_type": "unknown"
                }
                
                # Analyze files in directory
                for file_info in dir_structure.get('files', []):
                    file_name = file_info.get('name', '')
                    if self.config.is_ic_file(file_name):
                        analysis["canister_files"].append(file_name)
                        analysis["notable_files"].append(file_name)
                        
                        # Determine project type
                        file_type = self.config.get_file_type(file_name)
                        if file_type == "motoko_source":
                            analysis["project_type"] = "motoko_canister"
                        elif file_type == "rust_source":
                            analysis["project_type"] = "rust_canister"
                        elif file_type == "dfx_config":
                            analysis["project_type"] = "ic_project"
                        
                return analysis
                
        except Exception as e:
            logger.warning(f"⚠️ Directory analysis failed for {directory_name}: {e}")
            return None
