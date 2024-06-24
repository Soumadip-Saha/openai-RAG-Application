import asyncio
from openai.types.chat import ChatCompletion, ChatCompletionChunk
from openai import AsyncOpenAI
import math
from typing import AsyncGenerator


class LLMClient():
    def __init__(self, model_name: str, api_key: str) -> None:
        self.client = AsyncOpenAI(
            api_key=api_key
        )
        self.model_name = model_name

    @staticmethod
    def calculate_confidence(inputs: ChatCompletion | ChatCompletionChunk):
        confidence_score = 0
        for item in inputs.choices[0].logprobs.content:
            confidence_score += item.logprob
        return math.exp(confidence_score) * 100

    async def generate(self, input_prompt: str, system_template: str = None, **kwargs) -> ChatCompletion | AsyncGenerator[str, None]:
        model_name = kwargs.pop('model_name', self.model_name)
        messages = []
        if system_template:
            messages.append({"role": "system", "content": system_template})
        messages.append({"role": "user", "content": input_prompt})
        stream = kwargs.pop("stream", False)
        response = await self.client.chat.completions.create(
            model=model_name,
            messages=messages,
            seed=kwargs.pop('seed', 1),
            stream=stream,
            **kwargs
        )

        return response
