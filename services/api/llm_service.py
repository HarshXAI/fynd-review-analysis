"""
LLM Service for generating AI responses.
Supports OpenAI, Gemini, and OpenRouter.
"""
import os
import json
import time
import re
from typing import Optional, List, Dict, Any, Tuple
from dotenv import load_dotenv

load_dotenv()

from prompts import (
    USER_RESPONSE_PROMPT,
    ADMIN_SUMMARY_PROMPT,
    ADMIN_ACTIONS_PROMPT,
    ADMIN_ACTIONS_STRICT_PROMPT,
    FALLBACK_ACTIONS,
    FALLBACK_USER_RESPONSE,
    FALLBACK_ADMIN_SUMMARY,
)


class LLMService:
    """Service for making LLM API calls."""

    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY")
        self.provider = os.getenv("LLM_PROVIDER", "openai").lower()
        self.model = self._get_default_model()

    def _get_default_model(self) -> str:
        """Get the default model based on provider."""
        models = {
            "openai": "gpt-4o-mini",
            "gemini": "gemini-1.5-flash",
            "openrouter": "openai/gpt-4o-mini",
        }
        return os.getenv("LLM_MODEL", models.get(self.provider, "gpt-4o-mini"))

    def _get_api_url(self) -> str:
        """Get the API URL based on provider."""
        urls = {
            "openai": "https://api.openai.com/v1/chat/completions",
            "gemini": f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent",
            "openrouter": "https://openrouter.ai/api/v1/chat/completions",
        }
        return urls.get(self.provider, urls["openai"])

    def _make_request(self, prompt: str) -> Tuple[Optional[str], Optional[str], int]:
        """
        Make an LLM API request.
        Returns: (response_text, error_message, latency_ms)
        """
        if not self.api_key:
            return None, "LLM_API_KEY not configured", 0

        start_time = time.time()

        try:
            import httpx

            if self.provider == "gemini":
                return self._call_gemini(prompt, start_time)
            else:
                return self._call_openai_compatible(prompt, start_time)

        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            return None, f"LLM request failed: {str(e)}", latency_ms

    def _call_openai_compatible(self, prompt: str, start_time: float) -> Tuple[Optional[str], Optional[str], int]:
        """Call OpenAI or OpenRouter API."""
        import httpx

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        if self.provider == "openrouter":
            headers["HTTP-Referer"] = "https://fynd-review.vercel.app"
            headers["X-Title"] = "Fynd Review System"

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
            "temperature": 0.7,
        }

        with httpx.Client(timeout=30.0) as client:
            response = client.post(self._get_api_url(), headers=headers, json=payload)
            latency_ms = int((time.time() - start_time) * 1000)

            if response.status_code != 200:
                return None, f"API error {response.status_code}: {response.text[:200]}", latency_ms

            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return content.strip(), None, latency_ms

    def _call_gemini(self, prompt: str, start_time: float) -> Tuple[Optional[str], Optional[str], int]:
        """Call Google Gemini API."""
        import httpx

        url = f"{self._get_api_url()}?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "maxOutputTokens": 500,
                "temperature": 0.7,
            },
        }

        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, json=payload)
            latency_ms = int((time.time() - start_time) * 1000)

            if response.status_code != 200:
                return None, f"Gemini API error {response.status_code}: {response.text[:200]}", latency_ms

            data = response.json()
            content = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return content.strip(), None, latency_ms

    def _parse_json_actions(self, text: str) -> Optional[List[Dict[str, str]]]:
        """Parse and validate JSON actions from LLM response."""
        if not text:
            return None

        # Try to extract JSON from the response
        text = text.strip()

        # Remove markdown code blocks if present
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\n?", "", text)
            text = re.sub(r"\n?```$", "", text)
            text = text.strip()

        try:
            actions = json.loads(text)

            # Validate structure
            if not isinstance(actions, list):
                return None

            validated_actions = []
            valid_priorities = {"low", "medium", "high"}
            valid_owners = {"support", "ops", "product"}

            for action in actions:
                if not isinstance(action, dict):
                    continue
                if "action" not in action or "priority" not in action or "owner" not in action:
                    continue
                if action["priority"] not in valid_priorities:
                    continue
                if action["owner"] not in valid_owners:
                    continue

                validated_actions.append({
                    "action": str(action["action"]),
                    "priority": action["priority"],
                    "owner": action["owner"],
                })

            return validated_actions if validated_actions else None

        except (json.JSONDecodeError, KeyError, TypeError):
            return None

    def generate_user_response(self, rating: int, review_text: str) -> Tuple[str, Optional[str], int]:
        """
        Generate a user-facing response.
        Returns: (response_text, error_message, latency_ms)
        """
        prompt = USER_RESPONSE_PROMPT.format(rating=rating, review_text=review_text)
        response, error, latency = self._make_request(prompt)

        if error or not response:
            return FALLBACK_USER_RESPONSE, error, latency

        return response, None, latency

    def generate_admin_summary(self, rating: int, review_text: str) -> Tuple[str, Optional[str], int]:
        """
        Generate an admin summary.
        Returns: (summary_text, error_message, latency_ms)
        """
        prompt = ADMIN_SUMMARY_PROMPT.format(rating=rating, review_text=review_text)
        response, error, latency = self._make_request(prompt)

        if error or not response:
            return FALLBACK_ADMIN_SUMMARY, error, latency

        return response, None, latency

    def generate_admin_actions(self, rating: int, review_text: str) -> Tuple[List[Dict[str, str]], Optional[str], int]:
        """
        Generate recommended actions with retry on parse failure.
        Returns: (actions_list, error_message, total_latency_ms)
        """
        total_latency = 0

        # First attempt
        prompt = ADMIN_ACTIONS_PROMPT.format(rating=rating, review_text=review_text)
        response, error, latency = self._make_request(prompt)
        total_latency += latency

        if error:
            return FALLBACK_ACTIONS, error, total_latency

        actions = self._parse_json_actions(response)
        if actions:
            return actions, None, total_latency

        # Retry with stricter prompt
        prompt = ADMIN_ACTIONS_STRICT_PROMPT.format(rating=rating, review_text=review_text)
        response, error, latency = self._make_request(prompt)
        total_latency += latency

        if error:
            return FALLBACK_ACTIONS, f"JSON parse failed, retry also failed: {error}", total_latency

        actions = self._parse_json_actions(response)
        if actions:
            return actions, None, total_latency

        # Both attempts failed - use fallback
        return FALLBACK_ACTIONS, "Failed to parse valid JSON after retry", total_latency

    def generate_all(
        self, rating: int, review_text: str
    ) -> Dict[str, Any]:
        """
        Generate all AI outputs for a submission.
        Returns dict with: user_response, admin_summary, admin_recommended_actions,
                          llm_model, llm_latency_ms, llm_error
        """
        total_latency = 0
        errors = []

        # Generate user response
        user_response, user_error, user_latency = self.generate_user_response(rating, review_text)
        total_latency += user_latency
        if user_error:
            errors.append(f"user_response: {user_error}")

        # Generate admin summary
        admin_summary, summary_error, summary_latency = self.generate_admin_summary(rating, review_text)
        total_latency += summary_latency
        if summary_error:
            errors.append(f"admin_summary: {summary_error}")

        # Generate admin actions
        admin_actions, actions_error, actions_latency = self.generate_admin_actions(rating, review_text)
        total_latency += actions_latency
        if actions_error:
            errors.append(f"admin_actions: {actions_error}")

        return {
            "user_response": user_response,
            "admin_summary": admin_summary,
            "admin_recommended_actions": admin_actions,
            "llm_model": self.model,
            "prompt_version": "v1",
            "llm_latency_ms": total_latency,
            "llm_error": "; ".join(errors) if errors else None,
        }


# Singleton instance
llm_service = LLMService()
