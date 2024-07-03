# TODO: Add BaseTool Class and create Abstraction
from typing import Any, Dict
from code.llm import LLMClient
import json

ELASTIC_TOOL_DESCRIPTION = {
    "type": "function",
    "function": {
        "name": "get_chunks_by_metadata",
        "description": "Get the document chunks for a given metadata properties.",
        "parameters": {
            "type": "object",
            "properties": {
                "source": {
                    "type": "array",
                    "items": {
                        "type": "string",
                    },
                    "description": "A list of document names, e.g. ['document1.pdf', 'document2.pdf']",
                },
                "start_date": {
                    "type": "string",
                    "description": "The start date of the creation date range for filtering documents, in YYYY-MM-DD format.",
                    "nullable": True,
                },
                "end_date": {
                    "type": "string",
                    "description": "The end date of the creation date range for filtering documents, in YYYY-MM-DD format.",
                    "nullable": True,
                }
            },
            "required": ["source"],
        },
    },
}


class ElasticTool:
    def __init__(self, llm: LLMClient) -> None:
        self.tool_description = ELASTIC_TOOL_DESCRIPTION
        self.llm = llm

    async def __call__(self, query: str, **kwds: Any) -> Dict[str, Any]:
        response = await self.llm.generate(
            input_prompt=query,
            tools=[self.tool_description],
            tool_choice="required"
        )
        tool_calls = response.choices[0].message.tool_calls
        args = []
        for tool_call in tool_calls:
            args.append(json.loads(tool_call.function.arguments))
        if len(args) == 0:
            return {"match_all": {}}
        elif len(args) > 1:
            raise NotImplementedError("Multiple calls not supported yet")
        else:
            return self.build_search_query(args[0])

    def build_search_query(self, args: Dict[str, Any]) -> Dict[str, Any]:
        must_clauses = [
            {
                "terms": {
                    "metadata.source": args.get("source")
                }
            }
        ]

        filter_clauses = []
        if args.get("start_date") or args.get("end_date"):
            range_filter = {}
            if args.get("start_date"):
                range_filter["gte"] = args.get("start_date")
            if args.get("end_date"):
                range_filter["lte"] = args.get("end_date")
            filter_clauses.append({
                "range": {
                    "metadata.creation_date": range_filter
                }
            })

        query = {
            "bool": {
                "must": must_clauses,
                "filter": filter_clauses if filter_clauses else None
            }
        }

        # Remove the filter part if it's empty
        if not filter_clauses:
            query["bool"].pop("filter")

        return query
