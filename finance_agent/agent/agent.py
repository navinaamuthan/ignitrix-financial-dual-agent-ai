from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StdioServerParameters
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools import Tool
import requests
import os
from dotenv import load_dotenv
from . import prompt

# Load environment variables from .env file
load_dotenv()

MODEL = "gemini-2.5-pro"


# Fi money MCP Server
shared_tools = [
    MCPToolset(
        connection_params=StdioServerParameters(
            command='npx',
            args=[
                "mcp-remote",
                "https://mcp.fi.money:8080/mcp/stream"
            ],
        ),
    )
]


# Sub Agent 1: Maya - Health Diagnostic Agent
health_diagnostic_agent = LlmAgent(
    name="HealthDiagnosticAgent",
    model=MODEL,
    instruction=prompt.MAYA_AGENT_PROMPT,
    description="Analyses financial data and discovers",
    tools=shared_tools,
    # Store result in state for the merger agent
    output_key="health_diagnostic_result"
)

# Sub Agent 2: Nash - Strategy Planning Agent
strategy_planning_agent = LlmAgent(
    name="StrategyPlanningAgent",
    model=MODEL,
    instruction=prompt.NASH_AGENT_PROMPT,
    description="Models scenarios and finds",
    tools=shared_tools,
    # Store result in state for the merger agent
    output_key="strategy_planning_agent"
)




maya_tool = AgentTool(agent=health_diagnostic_agent)
nash_tool = AgentTool(agent=strategy_planning_agent)


# Financial News Tool
class FinancialNewsTool(Tool):
    # Tool name used by the agent to refer to this
    name = "financial_news"

    # Description helps the model understand when to use this tool
    description = "Fetches current top financial news headlines"

    def run(self, input_text):
        # Make a request to a public financial news API (replace with actual API and key)
        response = requests.get(
            "https://eventregistry.org/api/v1/article/getArticles",
            params={
                "action": "getArticles",
                "keyword": "Finance",
                "sourceLocationUri": [
                    "http://en.wikipedia.org/wiki/United_States",
                    "http://en.wikipedia.org/wiki/Canada",
                    "http://en.wikipedia.org/wiki/United_Kingdom"
                ],
                "ignoreSourceGroupUri": "paywall/paywalled_sources",
                "articlesPage": 1,
                "articlesCount": 10,
                "articlesSortBy": "date",  # Top 10 artilces in current day
                "articlesSortByAsc": False,
                "dataType": [
                    "news",
                    "pr"
                ],
                "forceMaxDataTimeWindow": 31,
                "resultType": "articles",
                "apiKey": os.getenv("FINANCIAL_NEWS_API_KEY", "YOUR_API_KEY")
}
        )

        # Extract top 5 headlines
        headlines = [article['title'] for article in response.json().get('articles', [])[:5]]

        # Return formatted headlines or fallback message
        return "\n".join(headlines) or "No headlines found"

financial_news_tool = FinancialNewsTool()

# Collaboration Engine
root_agent = LlmAgent(
    name="collaboration_engine",
    model=MODEL,
    instruction=prompt.COLLABORATION_ENGINE_PROMPT,
    tools=shared_tools + [maya_tool, nash_tool, financial_news_tool],
    output_key="final_summary"
)

