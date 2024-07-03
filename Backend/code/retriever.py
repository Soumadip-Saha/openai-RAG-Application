from elasticsearch import AsyncElasticsearch
from code.embedding import EmbeddingModel
from typing import List, Dict, Any


class VectorDB():
    def __init__(self, host: str, index: str | List[str], user_name: str, password: str):
        self.client = AsyncElasticsearch(
            host, basic_auth=(user_name, password), verify_certs=False
        )
        self.index = index
        self.connected = False

    async def check_connection(self):
        self.connected = await self.client.ping()
        if not self.connected:
            raise ConnectionError("ElasticSearch can not be connected!")

    async def get_docs(self, query: str, embedding_model: EmbeddingModel, top_docs: int = 5, **kwargs):
        if not self.connected:
            await self.check_connection()
        query_vector = await embedding_model.get_embeddings(query)
        script_query = {
            "script_score": {
                "query": kwargs.pop("search_query", {"match_all": {}}),
                "script": {
                    "source": "cosineSimilarity(params.query_vector, 'vector') + 1",
                    "params": {"query_vector": query_vector}
                }
            }
        }
        response = await self.client.search(
            index=self.index,
            body={
                "size": top_docs,
                "query": script_query,
                "_source": ["text", "metadata.source"],
            }
        )

        documents = [
            {
                "content": hit["_source"]["text"],
                "source": hit["_source"]["metadata"]["source"],
                "score": hit["_score"]
            }
            for hit in response["hits"]["hits"]
        ]
        documents.sort(key=lambda doc: doc['score'], reverse=True)
        return documents
