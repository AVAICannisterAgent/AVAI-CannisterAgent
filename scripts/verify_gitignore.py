#!/usr/bin/env python
"""
Verify that the .gitignore file is correctly configured to include all essential
files when forking the repository.

This script simulates what Git would include in a commit based on the current
.gitignore rules and reports files that might be missing.
"""

import os
import sys
import fnmatch
import subprocess
from pathlib import Path

# Define the essential files and directories that must be included
ESSENTIAL_FILES = [
    # Core files
    'main.py',
    'autonomous_agent.py',
    'heal_agent.py',
    'monitor_screenshots.py',
    'trigger_transformation.py',
    'update_learning.py',
    'workflow_status.py',
    'setup.py',
    'setup_ollama.sh',
    'requirements.txt',
    'Dockerfile',
    'docker-compose.yml',
    
    # Documentation
    'README.md',
    'LICENSE.md',
    
    # Configuration
    'config/config_ollama.toml',
    'config/config_hybrid.toml',
    'config/gpu_optimized.toml',
    'config/config.example.toml',
    
    # CUDA scripts
    'enable_cuda_for_vision.py',
    'apply_vision_cuda_patch.py',
    'add_cuda_to_vision.py',
    'check_cuda.py',
    'force_cuda_vision.py',
    'scripts/gpu_diagnostic.sh',
    'scripts/quick_cuda_fix.sh',
    
    # Core app directories - check if these exist
    'app/__init__.py',
    'app/agent/__init__.py',
    'app/tool/__init__.py',
]

# Directories that should have Python files
ESSENTIAL_DIRS = [
    'app',
    'app/agent',
    'app/tool',
    'app/llm',
    'app/memory',
    'app/flow',
    'config',
    'scripts',
    'examples'
    # agent_learning is excluded as it contains private user data
]

def check_git_included_files():
    """
    Use git to check which files would be included in a commit
    """
    try:
        # Check if we're in a git repository
        result = subprocess.run(['git', 'rev-parse', '--is-inside-work-tree'], 
                               capture_output=True, text=True, check=False)
        if result.returncode != 0:
            print("Warning: Not in a Git repository, cannot check with Git")
            return None
            
        # Get the files Git would include (staged + unstaged but not ignored)
        result = subprocess.run(['git', 'ls-files', '--cached', '--others', '--exclude-standard'],
                               capture_output=True, text=True, check=True)
        return set(result.stdout.splitlines())
    except Exception as e:
        print(f"Error running Git command: {e}")
        return None

def manually_check_ignored(gitignore_path, base_path):
    """
    Manually check which files would be ignored based on .gitignore rules
    """
    # Read the .gitignore file
    with open(gitignore_path, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]
    
    # Split into include and exclude patterns
    exclude_patterns = [line for line in lines if not line.startswith('!')]
    include_patterns = [line[1:] for line in lines if line.startswith('!')]
    
    # Get all files in the directory structure
    all_files = []
    for root, dirs, files in os.walk(base_path):
        rel_root = os.path.relpath(root, base_path)
        if rel_root == '.':
            rel_root = ''
        
        # Skip .git directory
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            if rel_root:
                rel_path = f"{rel_root}/{file}"
            else:
                rel_path = file
            all_files.append(rel_path.replace('\\', '/'))
    
    # Determine which files would be included
    included_files = []
    
    for file_path in all_files:
        # Check if file is excluded by any pattern
        excluded = any(fnmatch.fnmatch(file_path, pattern) for pattern in exclude_patterns)
        
        # Check if file is explicitly included despite being excluded
        included = any(fnmatch.fnmatch(file_path, pattern) for pattern in include_patterns)
        
        if not excluded or included:
            included_files.append(file_path)
    
    return set(included_files)

def check_essential_files(included_files):
    """
    Check if all essential files are included
    """
    missing_files = []
    
    for file_path in ESSENTIAL_FILES:
        normalized_path = file_path.replace('\\', '/')
        if normalized_path not in included_files:
            missing_files.append(normalized_path)
    
    return missing_files

def check_essential_dirs_have_content(included_files):
    """
    Check if essential directories have content
    """
    empty_dirs = []
    
    for dir_path in ESSENTIAL_DIRS:
        normalized_dir = dir_path.replace('\\', '/')
        dir_has_files = any(file.startswith(f"{normalized_dir}/") for file in included_files)
        
        if not dir_has_files:
            empty_dirs.append(normalized_dir)
    
    return empty_dirs

def main():
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    gitignore_path = os.path.join(base_path, '.gitignore')
    
    print("Verifying .gitignore configuration...")
    print(f"Base path: {base_path}")
    
    # Check which files Git would include
    git_included = check_git_included_files()
    
    # Manually check based on .gitignore rules
    manual_included = manually_check_ignored(gitignore_path, base_path)
    
    included_files = git_included if git_included is not None else manual_included
    
    if not included_files:
        print("Error: Could not determine which files would be included")
        return 1
    
    # Check essential files
    missing_files = check_essential_files(included_files)
    if missing_files:
        print("WARNING: The following essential files might be excluded by .gitignore:")
        for file in missing_files:
            print(f" - {file}")
    else:
        print("SUCCESS: All essential files are properly included")
    
    # Check essential directories have content
    empty_dirs = check_essential_dirs_have_content(included_files)
    if empty_dirs:
        print("\nWARNING: The following essential directories might have no included content:")
        for dir_path in empty_dirs:
            print(f" - {dir_path}")
    else:
        print("SUCCESS: All essential directories have included content")
    
    # Print summary
    print("\nGitignore verification summary:")
    print(f" - Total files that would be included: {len(included_files)}")
    print(f" - Missing essential files: {len(missing_files)}")
    print(f" - Essential directories with no content: {len(empty_dirs)}")
    
    if not missing_files and not empty_dirs:
        print("\nVERIFICATION PASSED: .gitignore is properly configured for forking")
        return 0
    else:
        print("\nVERIFICATION FAILED: .gitignore needs adjustment")
        return 1

if __name__ == "__main__":
    sys.exit(main())
