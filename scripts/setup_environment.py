#!/usr/bin/env python3
"""
AVAI Agent Setup Script
Automatically sets up the complete environment with all dependencies
"""

import os
import subprocess
import sys
import platform
from pathlib import Path

def run_command(cmd, description, check=True):
    """Run a command with error handling."""
    print(f"🔄 {description}...")
    try:
        if isinstance(cmd, str):
            result = subprocess.run(cmd, shell=True, check=check, capture_output=True, text=True)
        else:
            result = subprocess.run(cmd, check=check, capture_output=True, text=True)
        
        if result.stdout:
            print(f"✅ {description} completed successfully")
            if result.stdout.strip():
                print(f"   Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if e.stderr:
            print(f"   Error: {e.stderr.strip()}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print(f"❌ Python {version.major}.{version.minor} detected. Python 3.9+ required.")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def setup_virtual_environment():
    """Create and setup virtual environment."""
    project_root = Path(__file__).parent
    venv_path = project_root / "venv"
    
    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return True
    
    # Create virtual environment
    if not run_command([sys.executable, "-m", "venv", "venv"], "Creating virtual environment"):
        return False
    
    return True

def install_dependencies():
    """Install all required dependencies."""
    project_root = Path(__file__).parent
    requirements_file = project_root / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False
    
    # Determine pip executable path
    if platform.system() == "Windows":
        pip_path = project_root / "venv" / "Scripts" / "pip.exe"
    else:
        pip_path = project_root / "venv" / "bin" / "pip"
    
    if not pip_path.exists():
        print(f"❌ Pip not found at {pip_path}")
        return False
    
    # Upgrade pip first
    if not run_command([str(pip_path), "install", "--upgrade", "pip"], "Upgrading pip"):
        return False
    
    # Install PyTorch with CUDA support first (most critical)
    print("🚀 Installing PyTorch with CUDA support...")
    pytorch_cmd = [
        str(pip_path), "install", "torch", "torchvision", "torchaudio", 
        "--index-url", "https://download.pytorch.org/whl/cu124"
    ]
    if not run_command(pytorch_cmd, "Installing PyTorch with CUDA"):
        print("⚠️ CUDA PyTorch installation failed, falling back to CPU version")
        if not run_command([str(pip_path), "install", "torch", "torchvision", "torchaudio"], "Installing PyTorch CPU"):
            return False
    
    # Install other requirements
    if not run_command([str(pip_path), "install", "-r", str(requirements_file)], "Installing requirements"):
        return False
    
    # Run pywin32 post-install if on Windows
    if platform.system() == "Windows":
        if platform.system() == "Windows":
            python_path = project_root / "venv" / "Scripts" / "python.exe"
        else:
            python_path = project_root / "venv" / "bin" / "python"
            
        pywin32_postinstall = project_root / "venv" / "Scripts" / "pywin32_postinstall.py"
        if pywin32_postinstall.exists():
            run_command([str(python_path), str(pywin32_postinstall), "-install"], "Configuring pywin32", check=False)
    
    return True

def verify_installation():
    """Verify that key components are installed correctly."""
    project_root = Path(__file__).parent
    
    if platform.system() == "Windows":
        python_path = project_root / "venv" / "Scripts" / "python.exe"
    else:
        python_path = project_root / "venv" / "bin" / "python"
    
    # Test imports
    test_imports = [
        "import torch; print(f'PyTorch: {torch.__version__}, CUDA: {torch.cuda.is_available()}')",
        "import nodriver; print(f'NoDriver: {nodriver.__version__}')",
        "import anthropic; print('Anthropic: OK')",
        "import pydantic; print(f'Pydantic: {pydantic.__version__}')",
        "from app.tool.web_search import WebSearch; print('AVAI WebSearch: OK')"
    ]
    
    print("\n🔍 Verifying installation...")
    for test_cmd in test_imports:
        if run_command([str(python_path), "-c", test_cmd], f"Testing: {test_cmd.split(';')[0]}", check=False):
            pass
        else:
            print(f"⚠️ Warning: Test failed for {test_cmd.split(';')[0]}")
    
    return True

def main():
    """Main setup process."""
    print("🚀 AVAI Agent Setup Script")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Setup virtual environment
    if not setup_virtual_environment():
        print("❌ Failed to setup virtual environment")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Verify installation
    verify_installation()
    
    print("\n" + "=" * 50)
    print("✅ AVAI Agent setup completed successfully!")
    print("\n🎯 Next steps:")
    print("1. Activate the virtual environment:")
    if platform.system() == "Windows":
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("2. Run the agent:")
    print("   python main.py")
    print("\n🔧 For GPU acceleration, ensure you have:")
    print("- NVIDIA GPU with CUDA 12.4+ drivers")
    print("- At least 8GB VRAM for optimal performance")

if __name__ == "__main__":
    main()
