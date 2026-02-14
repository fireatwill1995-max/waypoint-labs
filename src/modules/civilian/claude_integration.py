"""
Claude API Integration for Civilian AI Advisor
Uses Anthropic's Claude API for expert advice generation
"""
import os
import httpx
import json
from typing import Dict, Any, Optional
from loguru import logger


class ClaudeIntegration:
    """Integration with Anthropic Claude API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude integration
        
        Args:
            api_key: Anthropic API key. If None, will try to get from ANTHROPIC_API_KEY env var
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            logger.warning("No Anthropic API key provided. Claude integration will not work.")
            self.running = False
            return
        
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.running = True
        logger.info("Claude Integration initialized")
    
    async def generate_expert_advice(
        self,
        question: str,
        context: Dict[str, Any],
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate expert advice using Claude API
        
        Args:
            question: The question or request for advice
            context: Additional context information
            system_prompt: Optional system prompt to guide Claude's response
            
        Returns:
            String response from Claude
        """
        if not self.running or not self.api_key:
            logger.warning("Claude integration not available")
            return "AI advice not available. Please configure Anthropic API key."
        
        try:
            # Default system prompt if not provided
            if not system_prompt:
                system_prompt = """You are an expert AI assistant for civilian drone operations. 
Provide clear, actionable advice for drone operations including filming, mustering, hunting, and other civilian uses.
Be concise, practical, and safety-focused in your responses."""
            
            # Build the user message with context
            user_message = f"{question}\n\nContext: {json.dumps(context, indent=2)}"
            
            # Prepare the request
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            
            payload = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 2000,
                "system": system_prompt,
                "messages": [
                    {
                        "role": "user",
                        "content": user_message
                    }
                ]
            }
            
            # Make the API call
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                
                result = response.json()
                
                # Extract the text content from Claude's response
                if "content" in result and len(result["content"]) > 0:
                    content = result["content"][0]
                    if "text" in content:
                        return content["text"]
                    elif isinstance(content, str):
                        return content
                    else:
                        return str(content)
                else:
                    logger.error(f"Unexpected response format: {result}")
                    return "Error: Unexpected response format from Claude API"
                    
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from Claude API: {e.response.status_code} - {e.response.text}")
            return f"Error: API request failed with status {e.response.status_code}"
        except httpx.TimeoutException:
            logger.error("Timeout waiting for Claude API response")
            return "Error: Request timed out. Please try again."
        except Exception as e:
            logger.error(f"Error calling Claude API: {e}")
            return f"Error: {str(e)}"
    
    async def start(self):
        """Start the Claude integration"""
        if self.api_key:
            self.running = True
            logger.info("✓ Claude Integration started")
        else:
            logger.warning("Cannot start Claude Integration: No API key")
    
    async def shutdown(self):
        """Shutdown the Claude integration"""
        self.running = False
        logger.info("Claude Integration shutdown")
