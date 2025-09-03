#!/usr/bin/env python3
"""
Global LLM Parser Migration Script
Automatically updates all LLM parsing across the system to use the global parser.
"""

import os
import re
import logging
from pathlib import Path
from typing import List, Dict, Set

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class GlobalParserMigration:
    """Migrate all LLM parsing to use the global parser."""
    
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.migration_stats = {
            'files_scanned': 0,
            'files_modified': 0,
            'parsers_replaced': 0,
            'errors': []
        }
        
        # Files to migrate
        self.target_files = []
        
        # Patterns to find and replace
        self.patterns_to_replace = [
            # JSON parsing patterns
            (r'json\.loads\([^)]+\)', 'parse_llm_json'),
            (r'JSON\.parse\([^)]+\)', 'parse_llm_json'),
            (r're\.search\(r\'\\{.*\\}\', [^,]+, re\.DOTALL\)', 'global_parser'),
            
            # Custom parsing method calls
            (r'_extract_json_from_response\([^)]+\)', 'parse_llm_json'),
            (r'_parse_.*?_response\([^)]+\)', 'parse_llm_response'),
            (r'\.extract_json_from_text\([^)]+\)', 'parse_llm_json'),
            
            # Boolean parsing
            (r'\.lower\(\)\s*in\s*\[\'true\', \'yes\'\]', 'parse_llm_boolean'),
            
            # Quality/confidence extraction
            (r'extract_confidence\([^)]+\)', 'extract_confidence_score'),
            (r'extract_quality.*?\([^)]+\)', 'global_parser'),
        ]
        
        # Import statement to add
        self.global_parser_import = "from app.utils.global_llm_parser import parse_llm_response, parse_llm_json, parse_llm_boolean, parse_llm_list, extract_confidence_score"
    
    def scan_for_parsers(self) -> List[str]:
        """Scan the codebase for files that need parser migration."""
        python_files = []
        
        for root, dirs, files in os.walk(self.root_path):
            # Skip certain directories
            if any(skip_dir in root for skip_dir in ['.git', '__pycache__', '.venv', 'venv', 'node_modules', 'site-packages', 'test', 'build', 'dist']):
                continue
                
            for file in files:
                if file.endswith('.py'):
                    file_path = Path(root) / file
                    
                    # Only check files in specific directories to avoid virtual env issues
                    relative_path = str(file_path.relative_to(self.root_path))
                    if not (relative_path.startswith('app/') or relative_path.startswith('scripts/') or relative_path in ['main.py', 'quality_manager.py']):
                        continue
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            
                        # Check if file has LLM parsing patterns
                        if self._has_parsing_patterns(content):
                            python_files.append(str(file_path))
                            
                    except Exception as e:
                        logger.warning(f"Could not read {file_path}: {e}")
                        self.migration_stats['errors'].append(f"Read error: {file_path}")
        
        self.migration_stats['files_scanned'] = len(python_files)
        logger.info(f"Found {len(python_files)} files with LLM parsing patterns")
        return python_files
    
    def _has_parsing_patterns(self, content: str) -> bool:
        """Check if content has patterns that need migration."""
        patterns_to_check = [
            r'json\.loads',
            r'JSONDecodeError',
            r'_parse.*response',
            r'extract.*json',
            r'\.lower\(\).*true.*false',
            r'confidence.*extract',
            r'quality.*extract',
            r'LLM.*pars',
            r'llm.*response.*json',
        ]
        
        for pattern in patterns_to_check:
            if re.search(pattern, content, re.IGNORECASE):
                return True
        
        return False
    
    def analyze_file_parsing(self, file_path: str) -> Dict[str, any]:
        """Analyze a file's parsing patterns."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            analysis = {
                'file_path': file_path,
                'has_json_loads': bool(re.search(r'json\.loads', content)),
                'has_custom_parsers': bool(re.search(r'def.*parse.*response', content)),
                'has_extraction_methods': bool(re.search(r'def.*extract.*', content)),
                'has_error_handling': bool(re.search(r'JSONDecodeError|json\.decoder', content)),
                'complexity_score': 0,
                'recommended_actions': []
            }
            
            # Calculate complexity score
            if analysis['has_json_loads']:
                analysis['complexity_score'] += 2
            if analysis['has_custom_parsers']:
                analysis['complexity_score'] += 3
            if analysis['has_extraction_methods']:
                analysis['complexity_score'] += 2
            if analysis['has_error_handling']:
                analysis['complexity_score'] += 1
            
            # Recommend actions
            if analysis['complexity_score'] >= 5:
                analysis['recommended_actions'].append('high_priority_migration')
            elif analysis['complexity_score'] >= 3:
                analysis['recommended_actions'].append('medium_priority_migration')
            else:
                analysis['recommended_actions'].append('low_priority_migration')
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing {file_path}: {e}")
            return {'error': str(e)}
    
    def generate_migration_plan(self, files: List[str]) -> Dict[str, any]:
        """Generate a comprehensive migration plan."""
        plan = {
            'high_priority': [],
            'medium_priority': [],
            'low_priority': [],
            'analysis_summary': {
                'total_files': len(files),
                'high_priority_count': 0,
                'medium_priority_count': 0,
                'low_priority_count': 0
            }
        }
        
        for file_path in files:
            analysis = self.analyze_file_parsing(file_path)
            
            if 'error' in analysis:
                continue
            
            if 'high_priority_migration' in analysis['recommended_actions']:
                plan['high_priority'].append(analysis)
                plan['analysis_summary']['high_priority_count'] += 1
            elif 'medium_priority_migration' in analysis['recommended_actions']:
                plan['medium_priority'].append(analysis)
                plan['analysis_summary']['medium_priority_count'] += 1
            else:
                plan['low_priority'].append(analysis)
                plan['analysis_summary']['low_priority_count'] += 1
        
        return plan
    
    def migrate_file(self, file_path: str, dry_run: bool = True) -> bool:
        """Migrate a single file to use global parser."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            modified_content = original_content
            changes_made = 0
            
            # Add global parser import if not present
            if 'global_llm_parser' not in modified_content:
                # Find a good place to add the import
                import_lines = []
                lines = modified_content.split('\n')
                
                for i, line in enumerate(lines):
                    if line.strip().startswith('from app.') or line.strip().startswith('import'):
                        import_lines.append(i)
                
                if import_lines:
                    # Add after the last app import
                    insert_position = max(import_lines) + 1
                    lines.insert(insert_position, self.global_parser_import)
                    modified_content = '\n'.join(lines)
                    changes_made += 1
            
            # Replace common JSON parsing patterns
            json_loads_pattern = r'json\.loads\(([^)]+)\)'
            def replace_json_loads(match):
                variable = match.group(1)
                return f'parse_llm_json({variable})'
            
            new_content = re.sub(json_loads_pattern, replace_json_loads, modified_content)
            if new_content != modified_content:
                modified_content = new_content
                changes_made += 1
            
            # Replace custom parser method calls
            custom_parser_pattern = r'self\._parse_.*?_response\(([^)]+)\)'
            def replace_custom_parser(match):
                args = match.group(1)
                return f'parse_llm_response({args}, expected_format="auto")'
            
            new_content = re.sub(custom_parser_pattern, replace_custom_parser, modified_content)
            if new_content != modified_content:
                modified_content = new_content
                changes_made += 1
            
            # Replace JSON error handling
            json_error_pattern = r'except\s+json\.JSONDecodeError.*?:'
            new_content = re.sub(json_error_pattern, 'except Exception as parse_error:', modified_content, flags=re.DOTALL)
            if new_content != modified_content:
                modified_content = new_content
                changes_made += 1
            
            # Only write if changes were made and not dry run
            if changes_made > 0:
                if not dry_run:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(modified_content)
                    logger.info(f"✅ Migrated {file_path} ({changes_made} changes)")
                else:
                    logger.info(f"🔍 Would migrate {file_path} ({changes_made} changes)")
                
                self.migration_stats['files_modified'] += 1
                self.migration_stats['parsers_replaced'] += changes_made
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Error migrating {file_path}: {e}")
            self.migration_stats['errors'].append(f"Migration error: {file_path} - {e}")
            return False
    
    def run_migration(self, dry_run: bool = True) -> Dict[str, any]:
        """Run the complete migration process."""
        logger.info("🚀 Starting Global LLM Parser Migration")
        
        # Scan for files
        files_to_migrate = self.scan_for_parsers()
        
        # Generate migration plan
        migration_plan = self.generate_migration_plan(files_to_migrate)
        
        logger.info(f"📊 Migration Plan:")
        logger.info(f"  High Priority: {migration_plan['analysis_summary']['high_priority_count']} files")
        logger.info(f"  Medium Priority: {migration_plan['analysis_summary']['medium_priority_count']} files")
        logger.info(f"  Low Priority: {migration_plan['analysis_summary']['low_priority_count']} files")
        
        # Migrate high priority files first
        for file_analysis in migration_plan['high_priority']:
            self.migrate_file(file_analysis['file_path'], dry_run)
        
        # Then medium priority
        for file_analysis in migration_plan['medium_priority']:
            self.migrate_file(file_analysis['file_path'], dry_run)
        
        # Finally low priority (optional)
        for file_analysis in migration_plan['low_priority']:
            self.migrate_file(file_analysis['file_path'], dry_run)
        
        # Return comprehensive results
        return {
            'migration_plan': migration_plan,
            'migration_stats': self.migration_stats,
            'dry_run': dry_run,
            'success': len(self.migration_stats['errors']) == 0
        }


def main():
    """Main migration script."""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python migrate_to_global_parser.py <project_root_path> [--execute]")
        sys.exit(1)
    
    project_root = sys.argv[1]
    dry_run = '--execute' not in sys.argv
    
    if dry_run:
        logger.info("🔍 Running in DRY RUN mode. Use --execute to apply changes.")
    else:
        logger.info("⚡ Running in EXECUTE mode. Changes will be applied.")
    
    migrator = GlobalParserMigration(project_root)
    results = migrator.run_migration(dry_run)
    
    logger.info("📈 Migration Results:")
    logger.info(f"  Files Scanned: {results['migration_stats']['files_scanned']}")
    logger.info(f"  Files Modified: {results['migration_stats']['files_modified']}")
    logger.info(f"  Parsers Replaced: {results['migration_stats']['parsers_replaced']}")
    logger.info(f"  Errors: {len(results['migration_stats']['errors'])}")
    
    if results['migration_stats']['errors']:
        logger.error("❌ Errors encountered:")
        for error in results['migration_stats']['errors']:
            logger.error(f"  {error}")
    
    if results['success']:
        logger.info("✅ Migration completed successfully!")
    else:
        logger.error("❌ Migration completed with errors.")


if __name__ == '__main__':
    main()
