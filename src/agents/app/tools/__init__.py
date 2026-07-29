"""Tool interface — the boundary every external system crosses.

For the demo, all "external" systems (CAD, camera, satellite, weather, IROC,
IRWIN, AVL, agency inventories) are MOCKED behind this interface over seeded
data in `data/`. Swapping a mock for a real connector later must not change the
agent code that calls the tool.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class Tool(ABC):
    """A named capability the orchestrator can invoke."""

    name: str
    description: str

    @abstractmethod
    async def run(self, **kwargs: Any) -> Any:
        """Execute the tool and return a JSON-serializable result."""
        raise NotImplementedError


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> Tool:
        return self._tools[name]

    def list(self) -> list[str]:
        return sorted(self._tools)


registry = ToolRegistry()
