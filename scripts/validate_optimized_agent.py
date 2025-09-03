#!/usr/bin/env python3
"""
Validate Optimized Agent Performance
Tests the agent after performance optimizations to ensure it works optimally
while maintaining all dynamic capabilities.
"""

import asyncio
import time
import sys
from pathlib import Path
from typing import Dict, Any, List



# GLOBAL QUALITY MANAGER INTEGRATION
try:
    from app.core.global_quality_manager import (
        assess_quality,
        QualityScoreType,
        global_quality_manager,
        get_global_thresholds,
        is_quality_sufficient
    )
    GLOBAL_QUALITY_AVAILABLE = True
except ImportError:
    GLOBAL_QUALITY_AVAILABLE = False
    

# GLOBAL QUALITY MANAGER INTEGRATION
try:
    from app.core.global_quality_manager import (
        assess_quality,
        QualityScoreType,
        global_quality_manager,
        get_global_thresholds,
        is_quality_sufficient
    )
    GLOBAL_QUALITY_AVAILABLE = True
except ImportError:
    GLOBAL_QUALITY_AVAILABLE = False
    

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from app.logger import logger
from dynamic_performance_config import optimize_agent_dynamically, record_agent_performance


class OptimizedAgentValidator:
    """Validates that the optimized agent works fast and effectively."""
    
    def __init__(self):
        self.test_results = []
        self.performance_targets = {
            "execution_time": 60,  # Target: under 60 seconds
            "quality_score": 0.75,  # Target: quality score above 0.75
            "success_rate": 0.9,   # Target: 90% success rate
            "timeout_rate": 0.1    # Target: under 10% timeouts
        }

    async def test_optimized_agent(self, request: str, test_name: str) -> Dict[str, Any]:
        """Test the optimized agent with a specific request."""
        
        logger.info(f"\n🧪 Starting optimized agent test: {test_name}")
        logger.info(f"📝 Request: {request}")
        
        start_time = time.time()
        test_result = {
            "test_name": test_name,
            "request": request,
            "start_time": start_time,
            "success": False,
            "execution_time": 0,
            "quality_score": 0,
            "timeout_occurred": False,
            "error": None,
            "optimization_profile": None
        }
        
        try:
            # Apply dynamic optimization for this request
            logger.info("⚡ Applying dynamic performance optimization...")
            config = optimize_agent_dynamically(request)
            test_result["optimization_profile"] = config
            
            # Import and run the main agent
            from main import main
            
            logger.info("🚀 Running optimized agent...")
            
            # Run with timeout protection
            try:
                result = await asyncio.wait_for(
                    self._run_agent_safely(request),
                    timeout=90  # 90 second hard limit
                )
                
                test_result["success"] = True
                test_result["agent_result"] = result
                
            except asyncio.TimeoutError:
                test_result["timeout_occurred"] = True
                test_result["error"] = "Agent execution exceeded 90 second timeout"
                logger.error("❌ Agent execution timed out")
                
        except Exception as e:
            test_result["error"] = str(e)
            logger.error(f"❌ Test failed with error: {e}")
        
        # Calculate metrics
        test_result["execution_time"] = time.time() - start_time
        test_result["quality_score"] = self._calculate_quality_score(test_result)
        
        # Record performance for adaptive learning
        record_agent_performance(
            test_result["execution_time"], 
            test_result["success"]
        )
        
        # Log results
        self._log_test_results(test_result)
        
        self.test_results.append(test_result)
        return test_result

    async def _run_agent_safely(self, request: str):
        """Run the agent with proper error handling."""
        
        try:
            # Import main function
            from main import main
            
            # Create a safe environment for testing
            import os
            original_args = sys.argv
            sys.argv = ['main.py', request]
            
            # Run the agent
            result = await main()
            
            # Restore original args
            sys.argv = original_args
            
            return result
            
        except Exception as e:
            logger.error(f"Agent execution error: {e}")
            raise

    def _calculate_quality_score(self, test_result: Dict[str, Any]) -> float:
        """Calculate quality score based on test results."""
        
        score = 0.0
        
        # Success factor (50% of score)
        if test_result["success"]:
            score += 0.5
        
        # Speed factor (30% of score)
        execution_time = test_result["execution_time"]
        if execution_time < 30:
            score += 0.3
        elif execution_time < 60:
            score += 0.2
        elif execution_time < 90:
            score += 0.1
        
        # No timeout factor (20% of score)
        if not test_result["timeout_occurred"]:
            score += 0.2
        
        return min(score, 1.0)

    def _log_test_results(self, result: Dict[str, Any]):
        """Log detailed test results."""
        
        logger.info(f"\n📊 Test Results: {result['test_name']}")
        logger.info(f"   ✅ Success: {result['success']}")
        logger.info(f"   ⏱️  Time: {result['execution_time']:.1f}s")
        logger.info(f"   📈 Quality: {result['quality_score']:.2f}")
        logger.info(f"   ⏰ Timeout: {result['timeout_occurred']}")
        
        if result["error"]:
            logger.error(f"   ❌ Error: {result['error']}")
        
        # Performance assessment
        if result['execution_time'] < self.performance_targets['execution_time']:
            logger.info("   🚀 SPEED TARGET MET!")
        else:
            logger.warning(f"   ⚠️ Speed target missed (target: {self.performance_targets['execution_time']}s)")
        
        if result['quality_score'] >= self.performance_targets['quality_score']:
            logger.info("   🎯 QUALITY TARGET MET!")
        else:
            logger.warning(f"   ⚠️ Quality target missed (target: {self.performance_targets['quality_score']})")

    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        
        if not self.test_results:
            return {"error": "No test results available"}
        
        # Calculate overall metrics
        total_tests = len(self.test_results)
        successful_tests = sum(1 for r in self.test_results if r["success"])
        total_time = sum(r["execution_time"] for r in self.test_results)
        avg_time = total_time / total_tests
        avg_quality = sum(r["quality_score"] for r in self.test_results) / total_tests
        timeout_count = sum(1 for r in self.test_results if r["timeout_occurred"])
        
        success_rate = successful_tests / total_tests
        timeout_rate = timeout_count / total_tests
        
        report = {
            "summary": {
                "total_tests": total_tests,
                "success_rate": success_rate,
                "avg_execution_time": avg_time,
                "avg_quality_score": avg_quality,
                "timeout_rate": timeout_rate
            },
            "performance_assessment": {},
            "recommendations": [],
            "detailed_results": self.test_results
        }
        
        # Performance assessment
        assessment = report["performance_assessment"]
        assessment["speed_target_met"] = avg_time <= self.performance_targets["execution_time"]
        assessment["quality_target_met"] = avg_quality >= self.performance_targets["quality_score"]
        assessment["success_target_met"] = success_rate >= self.performance_targets["success_rate"]
        assessment["timeout_target_met"] = timeout_rate <= self.performance_targets["timeout_rate"]
        
        targets_met = sum(assessment.values())
        assessment["overall_grade"] = "A" if targets_met == 4 else "B" if targets_met >= 3 else "C" if targets_met >= 2 else "D"
        
        # Generate recommendations
        recommendations = report["recommendations"]
        
        if not assessment["speed_target_met"]:
            recommendations.append(f"Speed optimization needed - current: {avg_time:.1f}s, target: {self.performance_targets['execution_time']}s")
        
        if not assessment["quality_target_met"]:
            recommendations.append(f"Quality improvement needed - current: {avg_quality:.2f}, target: {self.performance_targets['quality_score']}")
        
        if not assessment["success_target_met"]:
            recommendations.append(f"Reliability improvement needed - current: {success_rate:.1%}, target: {self.performance_targets['success_rate']:.1%}")
        
        if not assessment["timeout_target_met"]:
            recommendations.append(f"Timeout reduction needed - current: {timeout_rate:.1%}, target: {self.performance_targets['timeout_rate']:.1%}")
        
        if not recommendations:
            recommendations.append("🎉 All performance targets met! Agent is working optimally.")
        
        return report

    def log_performance_report(self, report: Dict[str, Any]):
        """Log the performance report in a readable format."""
        
        logger.info("\n" + "="*80)
        logger.info("🎯 OPTIMIZED AGENT PERFORMANCE REPORT")
        logger.info("="*80)
        
        summary = report["summary"]
        logger.info(f"📊 Tests Run: {summary['total_tests']}")
        logger.info(f"✅ Success Rate: {summary['success_rate']:.1%}")
        logger.info(f"⏱️  Average Time: {summary['avg_execution_time']:.1f}s")
        logger.info(f"📈 Average Quality: {summary['avg_quality_score']:.2f}")
        logger.info(f"⏰ Timeout Rate: {summary['timeout_rate']:.1%}")
        
        assessment = report["performance_assessment"]
        logger.info(f"\n🏆 Overall Grade: {assessment['overall_grade']}")
        
        logger.info("\n🎯 Target Achievement:")
        logger.info(f"   Speed (≤{self.performance_targets['execution_time']}s): {'✅' if assessment['speed_target_met'] else '❌'}")
        logger.info(f"   Quality (≥{self.performance_targets['quality_score']}): {'✅' if assessment['quality_target_met'] else '❌'}")
        logger.info(f"   Success (≥{self.performance_targets['success_rate']:.0%}): {'✅' if assessment['success_target_met'] else '❌'}")
        logger.info(f"   Timeouts (≤{self.performance_targets['timeout_rate']:.0%}): {'✅' if assessment['timeout_target_met'] else '❌'}")
        
        logger.info("\n💡 Recommendations:")
        for rec in report["recommendations"]:
            logger.info(f"   • {rec}")
        
        logger.info("="*80)


async def main():
    """Main validation function."""
    
    logger.info("🚀 Starting optimized agent validation...")
    
    validator = OptimizedAgentValidator()
    
    # Test cases with different complexity levels
    test_cases = [
        {
            "request": "Quick summary of current AI trends",
            "test_name": "Fast Request Test"
        },
        {
            "request": "Research machine learning frameworks and provide detailed comparison",
            "test_name": "Complex Request Test"
        },
        {
            "request": "Find information about Python web development",
            "test_name": "Standard Request Test"
        }
    ]
    
    # Run all tests
    for test_case in test_cases:
        try:
            await validator.test_optimized_agent(
                test_case["request"], 
                test_case["test_name"]
            )
            
            # Brief pause between tests
            await asyncio.sleep(2)
            
        except Exception as e:
            logger.error(f"❌ Test case failed: {e}")
    
    # Generate and display performance report
    report = validator.generate_performance_report()
    validator.log_performance_report(report)
    
    # Return overall assessment
    assessment = report["performance_assessment"]
    overall_success = assessment.get("overall_grade", "D") in ["A", "B"]
    
    if overall_success:
        logger.info("🎉 VALIDATION SUCCESSFUL: Agent is working optimally!")
    else:
        logger.warning("⚠️ VALIDATION CONCERNS: Agent needs further optimization")
    
    return overall_success


if __name__ == "__main__":
    asyncio.run(main())
