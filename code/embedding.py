from openai import AsyncOpenAI
from typing import List, Union


class EmbeddingModel():
    def __init__(self, api_key: str, model_name: str) -> None:
        self.client = AsyncOpenAI(api_key=api_key)
        self.model_name = model_name

    async def get_embeddings(self, texts: Union[str, List[str]], **kwargs):
        model_name = kwargs.pop('model_name', self.model_name)
        output = await self.client.embeddings.create(
            input=texts, model=model_name, **kwargs)
        if len(output.data) > 1:
            return [emb.embedding for emb in output.data]
        else:
            return output.data[0].embedding
