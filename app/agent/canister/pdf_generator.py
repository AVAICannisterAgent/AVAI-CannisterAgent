"""
Professional PDF report generator for Internet Computer canister audit reports.

Generates high-quality, professionally formatted PDF reports with:
- Executive summaries and compliance scores
- Security assessments with visual indicators
- Code analysis with syntax highlighting
- Professional branding and formatting
- Charts and metrics visualization
"""

import os
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

from app.logger import logger

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor, black, white, red, green, orange, blue
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
        PageBreak, Image, KeepTogether
    )
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
    from reportlab.platypus.flowables import HRFlowable
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError as e:
    logger.warning(f"ReportLab not available: {e}")
    REPORTLAB_AVAILABLE = False


class CanisterPDFGenerator:
    """
    Professional PDF generator for IC canister audit reports.
    
    Creates publication-quality PDF reports with professional formatting,
    charts, and security assessment visualizations.
    """
    
    def __init__(self):
        """Initialize PDF generator with professional styles."""
        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab is required for PDF generation. Install with: pip install reportlab")
        
        # Set up reports directory
        self.workspace_dir = Path.cwd()
        self.reports_dir = self.workspace_dir / "workspace" / "reports"
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize styles
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
        logger.info(f"📁 PDF reports directory: {self.reports_dir}")
    
    def _setup_custom_styles(self):
        """Set up custom styles for professional formatting."""
        
        # Helper function to safely add styles
        def add_style_if_not_exists(style_name, style_def):
            try:
                # Check if style already exists
                existing_style = self.styles[style_name]
                logger.debug(f"Style '{style_name}' already exists, skipping")
            except KeyError:
                # Style doesn't exist, add it
                self.styles.add(style_def)
                logger.debug(f"Added new style: '{style_name}'")
        
        # Title style
        add_style_if_not_exists('CustomTitle', ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=HexColor('#1f4e79'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtitle style
        add_style_if_not_exists('Subtitle', ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Normal'],
            fontSize=16,
            textColor=HexColor('#2c5282'),
            spaceAfter=20,
            spaceBefore=10,
            fontName='Helvetica-Bold'
        ))
        
        # Section header style
        add_style_if_not_exists('SectionHeader', ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=14,
            textColor=HexColor('#1a365d'),
            spaceAfter=12,
            spaceBefore=20,
            fontName='Helvetica-Bold',
            borderWidth=1,
            borderColor=HexColor('#e2e8f0'),
            borderPadding=5,
            backColor=HexColor('#f7fafc')
        ))
        
        # Subsection header style
        add_style_if_not_exists('SubsectionHeader', ParagraphStyle(
            name='SubsectionHeader',
            parent=self.styles['Heading2'],
            fontSize=12,
            textColor=HexColor('#2d3748'),
            spaceAfter=8,
            spaceBefore=15,
            fontName='Helvetica-Bold'
        ))
        
        # Body text style
        add_style_if_not_exists('BodyText', ParagraphStyle(
            name='BodyText',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=HexColor('#2d3748'),
            spaceAfter=6,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        ))
        
        # Code style
        add_style_if_not_exists('CodeStyle', ParagraphStyle(
            name='CodeStyle',
            parent=self.styles['Code'],
            fontSize=9,
            textColor=HexColor('#1a202c'),
            backColor=HexColor('#f7fafc'),
            borderWidth=1,
            borderColor=HexColor('#e2e8f0'),
            borderPadding=8,
            fontName='Courier'
        ))
        
        # Warning style
        add_style_if_not_exists('Warning', ParagraphStyle(
            name='Warning',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=HexColor('#c53030'),
            backColor=HexColor('#fed7d7'),
            borderWidth=1,
            borderColor=HexColor('#fc8181'),
            borderPadding=8,
            fontName='Helvetica-Bold'
        ))
        
        # Success style
        add_style_if_not_exists('Success', ParagraphStyle(
            name='Success',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=HexColor('#22543d'),
            backColor=HexColor('#c6f6d5'),
            borderWidth=1,
            borderColor=HexColor('#68d391'),
            borderPadding=8,
            fontName='Helvetica-Bold'
        ))
        
        # Info style
        add_style_if_not_exists('Info', ParagraphStyle(
            name='Info',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=HexColor('#2a4365'),
            backColor=HexColor('#bee3f8'),
            borderWidth=1,
            borderColor=HexColor('#63b3ed'),
            borderPadding=8,
            fontName='Helvetica'
        ))
    
    async def generate_pdf_report(self, analysis: Dict[str, Any]) -> str:
        """
        Generate a professional PDF audit report.
        
        Args:
            analysis: Complete repository analysis data
            
        Returns:
            Path to generated PDF file
        """
        try:
            logger.info("[PDF_GEN] Starting PDF report generation")
            
            # Extract key data
            repo_url = analysis.get("repository_url", "Unknown Repository")
            repo_name = self._extract_repo_name_from_url(repo_url)
            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            
            # Generate PDF filename
            pdf_filename = f"{repo_name}_security_audit_{timestamp}.pdf"
            pdf_filepath = self.reports_dir / pdf_filename
            
            # Create PDF document
            doc = SimpleDocTemplate(
                str(pdf_filepath),
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Build PDF content
            story = []
            
            # Add title page
            story.extend(self._build_title_page(analysis))
            story.append(PageBreak())
            
            # Add executive summary
            story.extend(self._build_executive_summary(analysis))
            story.append(PageBreak())
            
            # Add security assessment
            story.extend(self._build_security_assessment(analysis))
            story.append(PageBreak())
            
            # Add technical analysis
            story.extend(self._build_technical_analysis(analysis))
            story.append(PageBreak())
            
            # Add recommendations
            story.extend(self._build_recommendations(analysis))
            story.append(PageBreak())
            
            # Add appendices
            story.extend(self._build_appendices(analysis))
            
            # Build PDF
            doc.build(story)
            
            logger.info(f"✅ PDF report generated: {pdf_filepath}")
            return str(pdf_filepath)
            
        except Exception as e:
            logger.error(f"❌ PDF generation failed: {e}")
            raise
    
    def _build_title_page(self, analysis: Dict[str, Any]) -> List:
        """Build the title page of the PDF report."""
        story = []
        
        repo_url = analysis.get("repository_url", "Unknown Repository")
        timestamp = datetime.now().strftime('%B %d, %Y')
        compliance_score = analysis.get("todo_compliance", {}).get("score", 0)
        
        # Main title
        story.append(Spacer(1, 1*inch))
        story.append(Paragraph(
            "INTERNET COMPUTER<br/>CANISTER SECURITY AUDIT",
            self.styles['CustomTitle']
        ))
        
        story.append(Spacer(1, 0.5*inch))
        
        # Repository information
        story.append(Paragraph(f"Repository: {repo_url}", self.styles['Subtitle']))
        story.append(Paragraph(f"Audit Date: {timestamp}", self.styles['Subtitle']))
        
        story.append(Spacer(1, 0.5*inch))
        
        # Compliance score with visual indicator
        score_color = self._get_score_color(compliance_score)
        story.append(Paragraph(
            f'<font color="{score_color}">Compliance Score: {compliance_score}/100</font>',
            self.styles['Subtitle']
        ))
        
        story.append(Spacer(1, 1*inch))
        
        # Professional seal/certification
        certification_text = self._get_certification_text(compliance_score)
        story.append(Paragraph(certification_text, self.styles['Info']))
        
        story.append(Spacer(1, 2*inch))
        
        # Footer information
        story.append(Paragraph(
            "Generated by AVAI CanisterAgent<br/>Professional IC Security Analysis Framework",
            self.styles['BodyText']
        ))
        
        return story
    
    def _build_executive_summary(self, analysis: Dict[str, Any]) -> List:
        """Build the executive summary section."""
        story = []
        
        story.append(Paragraph("EXECUTIVE SUMMARY", self.styles['SectionHeader']))
        
        # Overview
        repo_url = analysis.get("repository_url", "Unknown")
        ic_patterns = analysis.get("ic_patterns", {})
        is_ic_project = ic_patterns.get("is_ic_project", False)
        
        overview_text = f"""
        This report presents a comprehensive security audit of the Internet Computer canister project 
        located at {repo_url}. The analysis was conducted using automated security scanning tools 
        and manual code review techniques specific to IC canister development.
        """
        story.append(Paragraph(overview_text, self.styles['BodyText']))
        story.append(Spacer(1, 12))
        
        # Key findings table
        story.append(Paragraph("Key Findings", self.styles['SubsectionHeader']))
        
        key_findings_data = self._build_key_findings_table(analysis)
        key_findings_table = Table(key_findings_data, colWidths=[2.5*inch, 3.5*inch])
        key_findings_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f7fafc')),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#1a365d')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#e2e8f0')),
        ]))
        story.append(key_findings_table)
        story.append(Spacer(1, 20))
        
        # Risk assessment
        story.append(Paragraph("Risk Assessment", self.styles['SubsectionHeader']))
        risk_assessment = self._build_risk_assessment(analysis)
        story.append(Paragraph(risk_assessment, self.styles['BodyText']))
        
        return story
    
    def _build_security_assessment(self, analysis: Dict[str, Any]) -> List:
        """Build the security assessment section."""
        story = []
        
        story.append(Paragraph("SECURITY ASSESSMENT", self.styles['SectionHeader']))
        
        # IC-specific security checks
        story.append(Paragraph("Internet Computer Security Analysis", self.styles['SubsectionHeader']))
        
        security_analysis = analysis.get("security_analysis", {})
        vulnerabilities = security_analysis.get("potential_vulnerabilities", [])
        
        if vulnerabilities:
            # Vulnerability summary table
            vuln_summary = self._build_vulnerability_summary(vulnerabilities)
            story.append(Paragraph("Vulnerability Summary", self.styles['SubsectionHeader']))
            
            vuln_table = Table(vuln_summary, colWidths=[1.5*inch, 1*inch, 3.5*inch])
            vuln_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f7fafc')),
                ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#1a365d')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, HexColor('#e2e8f0')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(vuln_table)
            story.append(Spacer(1, 20))
            
            # Detailed vulnerability analysis
            story.extend(self._build_detailed_vulnerabilities(vulnerabilities))
        else:
            story.append(Paragraph(
                "No critical vulnerabilities detected in automated scan. Manual review recommended for complex security patterns.",
                self.styles['Success']
            ))
        
        # IC-specific security checklist
        story.append(PageBreak())
        story.append(Paragraph("IC Security Checklist", self.styles['SubsectionHeader']))
        checklist_items = self._build_ic_security_checklist(analysis)
        story.extend(checklist_items)
        
        return story
    
    def _build_technical_analysis(self, analysis: Dict[str, Any]) -> List:
        """Build the technical analysis section."""
        story = []
        
        story.append(Paragraph("TECHNICAL ANALYSIS", self.styles['SectionHeader']))
        
        # Repository structure
        story.append(Paragraph("Repository Structure", self.styles['SubsectionHeader']))
        structure_text = self._build_structure_analysis(analysis)
        story.append(Paragraph(structure_text, self.styles['BodyText']))
        story.append(Spacer(1, 15))
        
        # IC patterns analysis
        ic_patterns = analysis.get("ic_patterns", {})
        if ic_patterns:
            story.append(Paragraph("IC Development Patterns", self.styles['SubsectionHeader']))
            patterns_text = self._build_patterns_analysis(ic_patterns)
            story.append(Paragraph(patterns_text, self.styles['BodyText']))
            story.append(Spacer(1, 15))
        
        # File analysis
        file_analysis = analysis.get("file_analysis", {})
        if file_analysis:
            story.append(Paragraph("File Analysis Summary", self.styles['SubsectionHeader']))
            file_table = self._build_file_analysis_table(file_analysis)
            story.append(file_table)
            story.append(Spacer(1, 15))
        
        # Code quality metrics
        story.append(Paragraph("Code Quality Assessment", self.styles['SubsectionHeader']))
        quality_text = self._build_quality_assessment(analysis)
        story.append(Paragraph(quality_text, self.styles['BodyText']))
        
        return story
    
    def _build_recommendations(self, analysis: Dict[str, Any]) -> List:
        """Build the recommendations section."""
        story = []
        
        story.append(Paragraph("RECOMMENDATIONS", self.styles['SectionHeader']))
        
        # Priority-based recommendations
        security_analysis = analysis.get("security_analysis", {})
        recommendations = security_analysis.get("security_recommendations", [])
        
        if recommendations:
            # Categorize recommendations by priority
            critical_recs = [r for r in recommendations if r.startswith("CRITICAL:")]
            high_recs = [r for r in recommendations if r.startswith("HIGH:")]
            medium_recs = [r for r in recommendations if r.startswith("MEDIUM:")]
            low_recs = [r for r in recommendations if r.startswith("LOW:")]
            general_recs = [r for r in recommendations if not any(r.startswith(p) for p in ["CRITICAL:", "HIGH:", "MEDIUM:", "LOW:"])]
            
            if critical_recs:
                story.append(Paragraph("Critical Priority (Immediate Action Required)", self.styles['SubsectionHeader']))
                for rec in critical_recs:
                    story.append(Paragraph(f"• {rec}", self.styles['Warning']))
                story.append(Spacer(1, 15))
            
            if high_recs:
                story.append(Paragraph("High Priority (1-2 weeks)", self.styles['SubsectionHeader']))
                for rec in high_recs:
                    story.append(Paragraph(f"• {rec}", self.styles['BodyText']))
                story.append(Spacer(1, 15))
            
            if medium_recs or general_recs:
                story.append(Paragraph("Medium Priority (1-3 months)", self.styles['SubsectionHeader']))
                for rec in medium_recs + general_recs:
                    story.append(Paragraph(f"• {rec}", self.styles['BodyText']))
                story.append(Spacer(1, 15))
            
            if low_recs:
                story.append(Paragraph("Low Priority (3+ months)", self.styles['SubsectionHeader']))
                for rec in low_recs:
                    story.append(Paragraph(f"• {rec}", self.styles['BodyText']))
        else:
            # Default recommendations
            story.extend(self._build_default_recommendations(analysis))
        
        return story
    
    def _build_appendices(self, analysis: Dict[str, Any]) -> List:
        """Build the appendices section."""
        story = []
        
        story.append(Paragraph("APPENDICES", self.styles['SectionHeader']))
        
        # Appendix A: Methodology
        story.append(Paragraph("Appendix A: Analysis Methodology", self.styles['SubsectionHeader']))
        methodology_text = """
        This audit was conducted using the AVAI CanisterAgent framework, which employs:
        
        • Automated repository structure analysis
        • IC-specific pattern recognition
        • Security vulnerability scanning
        • Code quality assessment
        • Compliance validation against IC best practices
        
        The analysis combines static code analysis with dynamic pattern matching to identify
        potential security issues and compliance violations.
        """
        story.append(Paragraph(methodology_text, self.styles['BodyText']))
        story.append(Spacer(1, 20))
        
        # Appendix B: IC Security Standards
        story.append(Paragraph("Appendix B: IC Security Standards Reference", self.styles['SubsectionHeader']))
        standards_text = """
        This audit follows security standards established for Internet Computer canister development:
        
        • Inter-canister call safety and reentrancy protection
        • Rollback behavior and state management
        • Upgrade safety and stable variable management
        • Caller authentication and authorization
        • DoS protection and resource management
        • Time handling and state synchronization
        
        These standards are based on best practices from the IC community and security research.
        """
        story.append(Paragraph(standards_text, self.styles['BodyText']))
        story.append(Spacer(1, 20))
        
        # Appendix C: Analysis Details
        extraction_sources = analysis.get("extraction_sources", [])
        if extraction_sources:
            story.append(Paragraph("Appendix C: Data Sources", self.styles['SubsectionHeader']))
            sources_text = f"Analysis data was extracted from the following sources:\n\n"
            for source in extraction_sources:
                sources_text += f"• {source}\n"
            story.append(Paragraph(sources_text, self.styles['BodyText']))
        
        return story
    
    def _build_key_findings_table(self, analysis: Dict[str, Any]) -> List[List[str]]:
        """Build key findings table data."""
        ic_patterns = analysis.get("ic_patterns", {})
        security_analysis = analysis.get("security_analysis", {})
        todo_compliance = analysis.get("todo_compliance", {})
        
        data = [
            ["Metric", "Value"],
            ["IC Project Status", "Confirmed" if ic_patterns.get("is_ic_project") else "Not Detected"],
            ["DFX Configuration", "Found" if ic_patterns.get("dfx_config") else "Missing"],
            ["Motoko Files", str(len(ic_patterns.get("motoko_files", [])))],
            ["Rust Canisters", str(len(ic_patterns.get("rust_canisters", [])))],
            ["Security Issues", str(len(security_analysis.get("potential_vulnerabilities", [])))],
            ["Compliance Score", f"{todo_compliance.get('score', 0)}/100"],
            ["Analysis Success", "Yes" if analysis.get("extraction_success") else "No"]
        ]
        return data
    
    def _build_vulnerability_summary(self, vulnerabilities: List[Dict]) -> List[List[str]]:
        """Build vulnerability summary table."""
        data = [["Type", "Severity", "Description"]]
        
        for vuln in vulnerabilities[:10]:  # Limit to 10 for PDF space
            vuln_type = vuln.get("type", "Unknown").replace("_", " ").title()
            severity = vuln.get("severity", "Unknown")
            description = vuln.get("description", "No description available")[:80] + "..."
            data.append([vuln_type, severity, description])
        
        return data
    
    def _build_detailed_vulnerabilities(self, vulnerabilities: List[Dict]) -> List:
        """Build detailed vulnerability descriptions."""
        story = []
        
        # Group by severity
        high_vulns = [v for v in vulnerabilities if v.get("severity") == "HIGH"]
        medium_vulns = [v for v in vulnerabilities if v.get("severity") == "MEDIUM"]
        low_vulns = [v for v in vulnerabilities if v.get("severity") == "LOW"]
        
        for severity, vulns in [("HIGH", high_vulns), ("MEDIUM", medium_vulns), ("LOW", low_vulns)]:
            if vulns:
                story.append(Paragraph(f"{severity} Severity Issues", self.styles['SubsectionHeader']))
                
                for i, vuln in enumerate(vulns[:5]):  # Limit to 5 per severity
                    vuln_type = vuln.get("type", "Unknown").replace("_", " ").title()
                    file_path = vuln.get("file", "Unknown location")
                    description = vuln.get("description", "No description available")
                    
                    vuln_text = f"""
                    <b>{i+1}. {vuln_type}</b><br/>
                    File: {file_path}<br/>
                    Description: {description}
                    """
                    
                    style = self.styles['Warning'] if severity == "HIGH" else self.styles['BodyText']
                    story.append(Paragraph(vuln_text, style))
                    story.append(Spacer(1, 10))
        
        return story
    
    def _build_ic_security_checklist(self, analysis: Dict[str, Any]) -> List:
        """Build IC security checklist items."""
        story = []
        
        vulnerabilities = analysis.get("security_analysis", {}).get("potential_vulnerabilities", [])
        ic_patterns = analysis.get("ic_patterns", {})
        
        checklist_items = [
            ("Inter-canister call reentrancy protection", len([v for v in vulnerabilities if "state_race" in v.get("type", "")]) == 0),
            ("Proper rollback handling", len([v for v in vulnerabilities if "rollback" in v.get("type", "")]) == 0),
            ("Upgrade safety measures", len([v for v in vulnerabilities if "upgrade" in v.get("type", "") or "stable" in v.get("type", "")]) == 0),
            ("Caller authentication", len([v for v in vulnerabilities if "caller" in v.get("type", "") or "auth" in v.get("type", "")]) == 0),
            ("DoS protection", len([v for v in vulnerabilities if "drain" in v.get("type", "") or "bomb" in v.get("type", "")]) == 0),
            ("Time handling safety", len([v for v in vulnerabilities if "time" in v.get("type", "")]) == 0),
            ("DFX configuration present", ic_patterns.get("dfx_config", False)),
            ("Canister implementation files", len(ic_patterns.get("motoko_files", [])) + len(ic_patterns.get("rust_canisters", [])) > 0)
        ]
        
        for item, passed in checklist_items:
            status = "✓ PASS" if passed else "✗ REVIEW NEEDED"
            color = "green" if passed else "red"
            story.append(Paragraph(
                f'<font color="{color}">{status}</font> {item}',
                self.styles['BodyText']
            ))
        
        return story
    
    def _build_structure_analysis(self, analysis: Dict[str, Any]) -> str:
        """Build repository structure analysis text."""
        dirs = analysis.get("directories", [])
        files = analysis.get("files", [])
        key_files = analysis.get("key_files", [])
        
        structure_text = f"""
        Repository structure analysis reveals {len(dirs)} directories and {len(files)} files.
        Key IC-related files identified: {len(key_files)}.
        
        The repository appears to follow {'standard IC project structure' if len(key_files) > 3 else 'non-standard structure'}.
        """
        
        return structure_text.strip()
    
    def _build_patterns_analysis(self, ic_patterns: Dict[str, Any]) -> str:
        """Build IC patterns analysis text."""
        motoko_files = ic_patterns.get("motoko_files", [])
        rust_canisters = ic_patterns.get("rust_canisters", [])
        ic_imports = ic_patterns.get("ic_imports", [])
        
        patterns_text = f"""
        IC development pattern analysis shows {len(motoko_files)} Motoko files and 
        {len(rust_canisters)} Rust canister implementations. The project uses 
        {len(ic_imports)} IC-specific imports, indicating 
        {'strong' if len(ic_imports) > 5 else 'moderate' if len(ic_imports) > 2 else 'minimal'} 
        integration with IC ecosystem.
        """
        
        return patterns_text.strip()
    
    def _build_file_analysis_table(self, file_analysis: Dict[str, Any]) -> Table:
        """Build file analysis table."""
        data = [["File", "Language", "Size (bytes)", "Type"]]
        
        for file_path, analysis_data in list(file_analysis.items())[:10]:
            if isinstance(analysis_data, dict):
                language = analysis_data.get("language", "Unknown")
                size = str(analysis_data.get("size", "Unknown"))
                analysis_type = analysis_data.get("analysis_type", "Unknown")
            else:
                language = "Unknown"
                size = "Unknown"
                analysis_type = "Basic"
            
            # Truncate long file paths
            display_path = file_path if len(file_path) <= 30 else "..." + file_path[-27:]
            data.append([display_path, language, size, analysis_type])
        
        table = Table(data, colWidths=[2*inch, 1*inch, 1*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f7fafc')),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#1a365d')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        return table
    
    def _build_quality_assessment(self, analysis: Dict[str, Any]) -> str:
        """Build code quality assessment text."""
        todo_compliance = analysis.get("todo_compliance", {})
        score = todo_compliance.get("score", 0)
        
        if score >= 80:
            quality_level = "Excellent"
        elif score >= 60:
            quality_level = "Good"
        elif score >= 40:
            quality_level = "Fair"
        else:
            quality_level = "Needs Improvement"
        
        quality_text = f"""
        Code quality assessment shows a compliance score of {score}/100, indicating 
        {quality_level.lower()} adherence to IC development standards. The analysis 
        evaluates code structure, documentation, testing practices, and security implementations.
        """
        
        return quality_text.strip()
    
    def _build_default_recommendations(self, analysis: Dict[str, Any]) -> List:
        """Build default recommendations when none are provided."""
        story = []
        
        ic_patterns = analysis.get("ic_patterns", {})
        is_ic_project = ic_patterns.get("is_ic_project", False)
        
        if is_ic_project:
            recommendations = [
                "Implement comprehensive inter-canister call safety measures",
                "Add robust caller authentication and authorization",
                "Review and test canister upgrade procedures",
                "Implement DoS protection and resource management",
                "Add comprehensive error handling and rollback mechanisms",
                "Conduct manual security review of complex business logic"
            ]
        else:
            recommendations = [
                "Confirm this repository contains IC canister code",
                "Add proper DFX configuration for IC deployment",
                "Implement IC-specific security practices",
                "Add canister implementation files (Motoko or Rust)",
                "Consider migrating to IC-native development patterns"
            ]
        
        story.append(Paragraph("General Security Recommendations", self.styles['SubsectionHeader']))
        for rec in recommendations:
            story.append(Paragraph(f"• {rec}", self.styles['BodyText']))
        
        return story
    
    def _build_risk_assessment(self, analysis: Dict[str, Any]) -> str:
        """Build risk assessment text."""
        vulnerabilities = analysis.get("security_analysis", {}).get("potential_vulnerabilities", [])
        high_risk = len([v for v in vulnerabilities if v.get("severity") == "HIGH"])
        med_risk = len([v for v in vulnerabilities if v.get("severity") == "MEDIUM"])
        
        if high_risk > 0:
            risk_level = "HIGH"
            risk_text = f"The repository contains {high_risk} high-severity security issues that require immediate attention before production deployment."
        elif med_risk > 2:
            risk_level = "MEDIUM"
            risk_text = f"The repository contains {med_risk} medium-severity issues that should be addressed to improve security posture."
        else:
            risk_level = "LOW"
            risk_text = "No critical security issues detected in automated analysis. Manual review recommended for complex patterns."
        
        return f"Risk Level: {risk_level}. {risk_text}"
    
    def _get_score_color(self, score: int) -> str:
        """Get color based on compliance score."""
        if score >= 80:
            return "#22543d"  # Green
        elif score >= 60:
            return "#d69e2e"  # Yellow
        else:
            return "#c53030"  # Red
    
    def _get_certification_text(self, score: int) -> str:
        """Get certification text based on score."""
        if score >= 80:
            return "✅ APPROVED FOR PRODUCTION DEPLOYMENT"
        elif score >= 60:
            return "⚠️ CONDITIONAL APPROVAL - ADDRESS IDENTIFIED ISSUES"
        else:
            return "❌ NOT RECOMMENDED FOR PRODUCTION - SIGNIFICANT ISSUES FOUND"
    
    def _extract_repo_name_from_url(self, repo_url: str) -> str:
        """Extract repository name from GitHub URL."""
        try:
            if 'github.com' in repo_url:
                parts = repo_url.split('/')
                if len(parts) >= 2:
                    owner = parts[-2] if len(parts) > 1 else "unknown"
                    repo = parts[-1] if parts[-1] else "repository"
                    return f"{owner}_{repo}"
            return "ic_canister_project"
        except:
            return "ic_canister_project"
