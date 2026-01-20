"""
LLM client wrapper for OpenAI.
Provides a clean interface for all agents to use.
"""

import json
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from src.config import get_settings
from src.utils import get_logger

logger = get_logger("llm")


class LLMClient:
    """Wrapper for LLM interactions."""
    
    def __init__(self):
        settings = get_settings()
        self._model = ChatOpenAI(
            model=settings.llm_model,
            api_key=settings.openai_api_key,
            temperature=settings.llm_temperature,
        )
    
    def invoke(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = False,
    ) -> str:
        """
        Invoke the LLM with a prompt.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            json_mode: If True, parse response as JSON
            
        Returns:
            LLM response as string
        """
        messages = []
        
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        
        messages.append(HumanMessage(content=prompt))
        
        logger.debug("llm_invoke", prompt_length=len(prompt))
        
        response = self._model.invoke(messages)
        content = response.content
        
        logger.debug("llm_response", response_length=len(content))
        
        return content
    
    def invoke_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> dict:
        """
        Invoke the LLM and parse response as JSON.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            
        Returns:
            Parsed JSON dict
        """
        # Add JSON instruction to system prompt
        json_instruction = "\nRespond ONLY with valid JSON. No markdown, no explanation."
        full_system = (system_prompt or "") + json_instruction
        
        response = self.invoke(prompt, full_system)
        
        # Clean up response (remove markdown code blocks if present)
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        
        return json.loads(cleaned.strip())


# Global LLM client instance
_llm_client: Optional[LLMClient] = None


def get_llm() -> LLMClient:
    """Get the global LLM client instance."""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client
