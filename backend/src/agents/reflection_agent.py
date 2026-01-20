"""
Reflection & Learning Agent - Continuous improvement.
"""

from typing import Any
from src.agents.base_agent import BaseAgent
from src.core.state import ConversationState
from src.core.memory import get_memory


REFLECTION_PROMPT = """You are a conversation analyst focused on learning and improvement.

## Conversation Analysis
- Intent: {intent}
- Emotion: {emotion}
- Lead Score: {lead_score}
- Actions Taken: {actions}
- Response Sent: {response}

## Conversation History
{history}

## Analysis Questions
1. Did the response match the user's intent appropriately?
2. Did the tone match the user's emotional state?
3. Was the action taken optimal for conversion?
4. What could have been done better?

## Response Format (JSON only)
{{
    "effectiveness_score": <0.0 to 1.0>,
    "what_worked": "<what went well>",
    "improvement_suggestion": "<specific improvement for next time>",
    "pattern_noted": "<any pattern to remember for this user type>"
}}
"""


class ReflectionAgent(BaseAgent):
    """
    Runs continuously in the background.
    
    Responsibilities:
    - Evaluates user reactions
    - Learns what worked and what didn't
    - Adjusts future strategies automatically
    
    This is a key advantage over n8n.
    """
    
    def __init__(self):
        super().__init__("reflection")
        self.memory = get_memory()
    
    def process(self, state: ConversationState) -> dict[str, Any]:
        prompt = REFLECTION_PROMPT.format(
            intent=state.get("intent", "unknown"),
            emotion=state.get("emotion", "unknown"),
            lead_score=state.get("lead_score", 0),
            actions=state.get("actions_taken", []),
            response=state.get("response_text", "")[:200],
            history=self._format_history(state),
        )
        
        result = self.llm.invoke_json(prompt)
        
        score = float(result.get("effectiveness_score", 0.5))
        notes = result.get("improvement_suggestion", "")
        
        # Store learning in memory for future use
        user_id = state["user_id"]
        self.memory.set_metadata(user_id, "last_feedback_score", score)
        
        # Store pattern for user type
        user_type = state.get("user_type", "new")
        pattern = result.get("pattern_noted", "")
        if pattern:
            existing_patterns = self.memory.get_metadata(user_id).get("patterns", [])
            existing_patterns.append(pattern)
            self.memory.set_metadata(user_id, "patterns", existing_patterns[-5:])  # Keep last 5
        
        self.logger.info(
            "reflection_completed",
            score=score,
            improvement=notes[:50] if notes else "none",
        )
        
        return {
            "feedback_score": score,
            "learning_notes": notes,
        }
