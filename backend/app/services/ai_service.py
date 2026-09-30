"""AI Gateway — Provider-independent AI service."""
import httpx
import logging
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


class AIProvider:
    """Base AI provider adapter."""
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    async def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 2000) -> Dict[str, Any]:
        raise NotImplementedError


class OpenAIProvider(AIProvider):
    """OpenAI API adapter."""
    def __init__(self, api_key: str, model: str = "gpt-4"):
        super().__init__(api_key, model)
        self.base_url = "https://api.openai.com/v1"

    async def chat(self, messages, temperature=0.7, max_tokens=2000):
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={"model": self.model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
            )
            if response.status_code != 200:
                error = response.json().get("error", {})
                error_code = error.get("code", "unknown")
                if error_code == "rate_limit_exceeded":
                    raise AIServiceError("AI_RATE_LIMITED", "Rate limit exceeded. Please try again later.")
                elif error_code in ("invalid_api_key", "authentication_error"):
                    raise AIServiceError("AI_PROVIDER_AUTH_FAILED", "Invalid API key.")
                raise AIServiceError("AI_PROVIDER_ERROR", f"Provider error: {error.get('message', response.text)}")
            data = response.json()
            return {"response": data["choices"][0]["message"]["content"], "usage": data.get("usage", {})}


class AnthropicProvider(AIProvider):
    """Anthropic Claude API adapter."""
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        super().__init__(api_key, model)
        self.base_url = "https://api.anthropic.com/v1"

    async def chat(self, messages, temperature=0.7, max_tokens=2000):
        system_msg = ""
        chat_messages = []
        for m in messages:
            if m["role"] == "system":
                system_msg = m["content"]
            else:
                chat_messages.append(m)

        async with httpx.AsyncClient(timeout=60.0) as client:
            payload: Dict[str, Any] = {"model": self.model, "max_tokens": max_tokens, "messages": chat_messages}
            if system_msg:
                payload["system"] = system_msg
            response = await client.post(
                f"{self.base_url}/messages",
                headers={"x-api-key": self.api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
                json=payload,
            )
            if response.status_code != 200:
                error = response.json().get("error", {})
                if error.get("type") == "authentication_error":
                    raise AIServiceError("AI_PROVIDER_AUTH_FAILED", "Invalid API key.")
                raise AIServiceError("AI_PROVIDER_ERROR", f"Provider error: {error.get('message', response.text)}")
            data = response.json()
            return {"response": data["content"][0]["text"], "usage": data.get("usage", {})}


class OllamaProvider(AIProvider):
    """Ollama local model adapter."""
    def __init__(self, api_key: str = "", model: str = "llama2", base_url: str = "http://localhost:11434"):
        super().__init__(api_key, model)
        self.base_url = base_url

    async def chat(self, messages, temperature=0.7, max_tokens=2000):
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={"model": self.model, "messages": messages, "stream": False, "options": {"temperature": temperature, "num_predict": max_tokens}},
            )
            if response.status_code != 200:
                raise AIServiceError("AI_PROVIDER_ERROR", f"Ollama error: {response.text}")
            data = response.json()
            return {"response": data["message"]["content"], "usage": {}}


def get_provider(provider_name: str = None, api_key: str = None, model: str = None) -> Optional[AIProvider]:
    """Get an AI provider based on configuration."""
    provider = provider_name or settings.AI_PROVIDER or "openai"
    key = api_key or settings.AI_API_KEY
    mdl = model or settings.AI_MODEL or "gpt-4"

    if not key and provider != "ollama":
        return None

    providers = {
        "openai": lambda: OpenAIProvider(key, mdl),
        "anthropic": lambda: AnthropicProvider(key, mdl),
        "ollama": lambda: OllamaProvider(key, mdl),
    }

    factory = providers.get(provider)
    if not factory:
        return None
    return factory()


async def ai_chat(messages: List[Dict[str, str]], provider_name: str = None, model: str = None) -> Dict[str, Any]:
    """Main entry point for AI chat. Raises AIServiceError on failure."""
    provider = get_provider(provider_name=provider_name, model=model)
    if not provider:
        raise AIServiceError("AI_PROVIDER_NOT_CONFIGURED", "AI provider not configured. Set AI_PROVIDER and AI_API_KEY in environment.")
    return await provider.chat(messages)
