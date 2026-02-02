import yaml
import os

class PromptManager:
    def __init__(self, prompt_path="prompts.yaml"):
        # Get absolute path relative to this file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.prompt_path = os.path.join(base_dir, prompt_path)
        self.prompts = self._load_prompts()

    def _load_prompts(self):
        try:
            with open(self.prompt_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Error loading prompts: {e}")
            return {}

    def get_system_prompt(self):
        """Get the main system prompt with lead qualification appended."""
        base_prompt = self.prompts.get('system_prompt', self.prompts.get('prompt', "You are a helpful assistant."))
        qualification_prompt = self.prompts.get('lead_qualification', '')
        
        if qualification_prompt:
            return f"{base_prompt}\n\n{qualification_prompt}"
        return base_prompt

    def get_lead_qualification_prompt(self):
        """Get just the lead qualification criteria."""
        return self.prompts.get('lead_qualification', '')

    def get_followup_message(self, message_type: str) -> str:
        """Get a follow-up message template.
        
        Args:
            message_type: 'warm_sms', 'cold_sms', or 'warm_call_intro'
            
        Returns:
            Message template string
        """
        messages = self.prompts.get('followup_messages', {})
        return messages.get(message_type, '')

    @property
    def initial_greeting(self):
        # For simpler prompts, extract a greeting from the prompt or use default
        return self.prompts.get('initial_greeting', "Hey! What's up?")

prompt_manager = PromptManager()

