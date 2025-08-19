# AVAI Canister Agent

A specialized agent for analyzing and auditing Internet Computer (IC) canisters with DevNet upload capabilities.

## Overview

The AVAI Canister Agent is a sophisticated tool designed to perform comprehensive security analysis, code auditing, and automated reporting for Internet Computer canisters. It features direct integration with the IC DevNet for seamless report uploads and canister interactions.

## Features

- **Comprehensive Canister Analysis**: Deep security and code quality analysis
- **DevNet Integration**: Direct upload of analysis reports to IC DevNet
- **Real-time Monitoring**: Continuous canister health and security monitoring
- **Automated Reporting**: Generate detailed PDF reports with findings
- **Motoko Code Generation**: Automatic generation of Motoko smart contracts
- **Multi-network Support**: Compatible with local, playground, and IC mainnet

## Quick Start

### Prerequisites

- Python 3.8+
- DFX SDK (for IC development)
- Internet connection for DevNet uploads

### Installation

`
pip install -r requirements.txt
`

### Basic Usage

`python
from core_agent import CanisterAgent
from devnet_uploader import DevNetUploader

# Initialize the agent
agent = CanisterAgent()

# Analyze a canister
result = await agent.analyze_canister("canister-id-here")

# Upload results to DevNet
uploader = DevNetUploader()
await uploader.upload_to_devnet(result)
`

## Configuration

The agent uses config.py for configuration management. Key settings include:

- DevNet endpoints
- Analysis parameters
- Report generation options
- Security scanning rules

## Components

- **core_agent.py**: Main orchestration and analysis engine
- **devnet_uploader.py**: DevNet integration and upload functionality
- **security_analyzer.py**: Security vulnerability detection
- **file_analyzer.py**: Code analysis and quality metrics
- **report_generator.py**: PDF report generation
- **browser_navigator.py**: Web interface navigation
- **dfx.json**: IC project configuration

## DevNet Integration

The agent supports direct upload to Internet Computer DevNet:

`python
# Configure DevNet settings
uploader = DevNetUploader()
uploader.configure_network("local")  # or "playground", "ic"

# Upload analysis report
result = await uploader.upload_to_devnet(report_data)
`

## Development

### Running Tests

`
python -m pytest tests/
`

### Building Canisters

`
dfx build
dfx deploy --network local
`

## Architecture

The AVAI Canister Agent follows a modular architecture:

1. **Analysis Engine**: Core canister examination logic
2. **Security Scanner**: Vulnerability detection system
3. **Report Generator**: Automated documentation creation
4. **DevNet Interface**: IC blockchain integration
5. **Browser Navigator**: Web-based canister interaction

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is part of the AVAI ecosystem and follows the main project's licensing terms.

## Support

For issues and questions, please open an issue in this repository or contact the AVAI development team.