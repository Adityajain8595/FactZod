import os
from typing import TypedDict, List, Annotated
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# Loading environment varaibles and Setting up LLM
os.environ['TAVILY_API_KEY'] = os.getenv('TAVILY_API_KEY')
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
llm =  ChatGroq(model="openai/gpt-oss-120b", api_key=GROQ_API_KEY)

# State Definition
class FactCheckState(TypedDict):
    original_text: str
    claims: List[str]
    queries: List[str]
    evidences: str
    fact_check_report: dict
    final_text: str

class Claims(BaseModel):
    claims: Annotated[List[str], Field(description="A list of verifiable factual claims extracted from the text.")]

class Queries(BaseModel):
    queries: Annotated[List[str], Field(description="A list of search queries generated from the claims.")]

class RewrittenText(BaseModel):
    rewritten_text: Annotated[str, Field(description="final rewritten text correcting original text based on fact-checking report.")]

class VerificationResult(BaseModel):
    claim: str = Field(description="The claim extracted")
    status: str = Field(description="VERIFIED, FALSE, or INCONCLUSIVE")
    reason: str = Field(description="Reasoning")
    correction: str = Field(description="Correction if false", default="")
    source: str = Field(description="Source name and URL", default="")

class FactCheckReport(BaseModel):
    fact_check_report: List[VerificationResult]


# Nodes and tool definitions
def extract_claims(state: FactCheckState):
    '''Extracts specific claims and testable statements from text'''
    parser = PydanticOutputParser(pydantic_object=Claims)
    prompt = PromptTemplate(
        input_variables = ['text'],
        template = '''You are a Senior Fact-Checking Editor for a prestigious news outlet. Your job is to identify every statement in the 
                text: {text} that presents a verifiable factual claim.
            
            # INSTRUCTIONS
            1. Analyze the input text sentence by sentence.
            2. Extract statements that contain:
            - Statistics or numerical data (e.g., "50 percent increase", "2 million people")
            - Specific dates or events (e.g., "On July 4th, 2023...")
            - Assertions of causality (e.g., "Policy X caused Result Y")
            - Quotes attributed to specific people.
            3. Ignore subjective opinions, adjectives, or predictions (e.g., "It was a wonderful performance", "The economy might improve").
            4. Output a list of "Atomic Claims". If a sentence contains multiple facts, split them.
            
            Return the claims as a comma-separated list strictly
            
            {format_instructions}''',
        
        partial_variables = {"format_instructions": parser.get_format_instructions()}
    )

    try:
        claim_chain = prompt | llm | parser
        result = claim_chain.invoke({'text': state['original_text']}).claims
        claims = [claim.strip() for claim in result]
        return {'claims': claims}
    except Exception as e:
        print("Error extracting claims: ", e)

def generate_queries(state: FactCheckState):
    '''Looks at the extracted claims and writes a search query for them'''
    parser = PydanticOutputParser(pydantic_object=Queries)
    prompt = PromptTemplate(
        input_variables = ['claims'],
        template = '''You are a Search Query Optimizer. Your goal is to convert specific claims into effective search queries that will 
            return the best evidence to verify the claim.
            The claims to convert are: {claims}

            # INSTRUCTIONS
            For each claim provided:
            1. Identify the core entities (Subject, Event, Value).
            2. Remove "fluff" words and complex grammar.
            3. Add time identifiers if the claim refers to a specific period (e.g., "2024", "last year").
            4. Create ONE search query per claim.

            # EXAMPLES
            Claim: "Tesla's stock dropped by 12 percent last Tuesday."
            Query: "Tesla stock price drop percentage last Tuesday date"

            Claim: "The population of Paris is over 10 million."
            Query: "Paris metro area population 2023 official census"

            Return the queries as a comma-separated list strictly
            
            {format_instructions}
            ''',
        partial_variables = {"format_instructions": parser.get_format_instructions()}
    )
    
    try:
        query_chain = prompt | llm | parser
        result = query_chain.invoke({'claims': state['claims']}).queries
        queries = [query.strip() for query in result]
        return {'queries': queries}
    except Exception as e:
        print("Error generating queries: ", e)

def search_tool(state: FactCheckState):
    '''Uses Tavily tool to fetch real-time evidence snippets from the web'''
    tavily_tool = TavilySearchResults(max_results=3)
    queries = state['queries']

    if not queries:
        print("No queries to search.")
        return state
    
    prompt = PromptTemplate(
        input_variables = ['query', 'search_results'],
        template = '''You are a Data Scraper Assistant. You have received raw search results that may contain ads, irrelevant navigation links, 
            or duplicate snippets.
            The raw search results for the query are: {search_results}

            # INSTRUCTIONS
            1. Read the raw search results below.
            2. Filter out any content that is clearly an advertisement or unrelated to the query: "{query}".
            3. Extract the most relevant 2-3 sentences that contain specific source name & URLs, numbers, dates, or confirmations of each result
            4. Summarize them into a single "Evidence Snippet".

            '''
    )
    search_chain = prompt | llm

    all_evidence = []

    print("\n\n")
    for query in queries:
        try:
            search_results = tavily_tool.run(query)
            result = search_chain.invoke({'query': query, 'search_results': search_results}).content
            all_evidence.append(result)
        except Exception as e:
            print(f"Error searching for query '{query}': ", e)
            continue 
    
    evidences = "\n------------\n".join(all_evidence)
    return {'evidences': evidences}

def fact_check_report(state: FactCheckState):
    '''Compares the Original Claims vs. Search Evidence'''
    parser = PydanticOutputParser(pydantic_object=FactCheckReport)
    prompt = PromptTemplate(
        input_variables = ['claims', 'evidences'],
        template = '''You are an impartial Fact-Checking Judge. You determine the truthfulness of claims based SOLELY on the provided evidence.

            The list of claims: {claims}

            # INSTRUCTIONS
            For each claim, associate its corresponding search evidences from collection of evidences in {evidences}:
            1. Compare the Claim against the Evidence.
            2. Assign one of the following statuses:
            - "VERIFIED": The evidence explicitly confirms the claim (numbers and dates match).
            - "FALSE": The evidence explicitly contradicts the claim (e.g., Claim says "50%", Evidence says "10%").
            - "INCONCLUSIVE": The evidence is missing, unrelated, or vague.
            3. Provide a one-sentence "Reason" for your verdict.
            4. If "VERIFIED", extract the Source URL or Name from the evidence.
            5. If "FALSE", extract the Correct Information from the evidence.

            Finally compile a comprehensive report summarizing the fact-checking results and your verdicts.
            
            Return only the report in JSON format strictly including following details strictly for each claim:

            "claim": "...",
            "evidence": "...",
            "status": "VERIFIED" | "FALSE" | "INCONCLUSIVE",
            "reason": "...",
            "correction": "..." (only if FALSE),
            "source": "..." (if available)
            
            {format_instructions}
            ''',
        partial_variables = {"format_instructions": parser.get_format_instructions()}
    )
    
    try:
        report_chain = prompt | llm | parser
        result = report_chain.invoke({'claims': state['claims'], 'evidences': state['evidences']}).fact_check_report
        serialized_results = [item.model_dump() for item in result]
        return {'fact_check_report': {"fact_check_report": serialized_results}}
    except Exception as e:
        print("Error creating fact-checking report: ", e)

def rewrite_text(state: FactCheckState):
    '''Rewrites the original text based on verdicts'''
    parser = PydanticOutputParser(pydantic_object=RewrittenText)
    prompt = PromptTemplate(
        input_variables = ['original_text','fact_check_report'],
        template = '''You are a Neutral News Editor. Your goal is to rewrite the original text to be objective, accurate, and cited.

            Original Text: {original_text}
            Fact Check Report: {fact_check_report}

            # GUIDELINES
            1. Tone Neutralization: Remove emotionally charged adjectives (e.g., change "disastrous collapse" to "significant decline", 
            "miraculous recovery" to "rapid recovery").
            2. Fact Correction: 
            - If a claim is marked "FALSE" in the Fact Check Report, rewrite the sentence with the *Correct Information*.
            - If a claim is "INCONCLUSIVE", keep it but soften the certainty (e.g., "It is reported that...", "Sources suggest...").
            3. Citation: 
            - If a claim is "VERIFIED", append a citation in brackets at the end of the sentence: `[Source: URL]`.
            4. Flow: Ensure the rewritten text flows naturally. Do not simply list facts.

            Provide the final rewritten article only.

            {format_instructions}
            ''',
        partial_variables = {"format_instructions": parser.get_format_instructions()}
    )
    
    try:
        draft_chain = prompt | llm | parser
        result = draft_chain.invoke({'original_text': state['original_text'], 'fact_check_report': state['fact_check_report']}).rewritten_text
        return {'final_text': result}
    except Exception as e:
        print("Error generating final rewritten text: ", e)


# Graph Building and Compilation
workflow = StateGraph(FactCheckState)
workflow.add_node("claim_extraction", extract_claims)
workflow.add_node("query_generation", generate_queries)
workflow.add_node("web_search", search_tool)
workflow.add_node("evidence_cross_reference", fact_check_report)
workflow.add_node("text_rewriting", rewrite_text)

workflow.set_entry_point("claim_extraction")
workflow.add_conditional_edges(
    "claim_extraction", 
    lambda x: 'query_generation' if x.get('claims') else 'text_rewriting',
    {"query_generation": "query_generation", "text_rewriting": "text_rewriting"}
)
workflow.add_edge("query_generation", "web_search")
workflow.add_edge("web_search", "evidence_cross_reference")
workflow.add_edge("evidence_cross_reference", "text_rewriting")
workflow.add_edge("text_rewriting", END)

app_graph = workflow.compile()