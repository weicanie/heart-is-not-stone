import { SerpAPI } from "@langchain/community/tools/serpapi";

import { Document, DocumentInterface } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { pull } from "langchain/hub";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { formatDocumentsAsString } from "langchain/util/document";
import { z } from "zod";
import { retriever } from "../RAG_Agent/retriever";
import { GraphState } from "./state";

// --- 配置常量 ---
const UPPER_THRESHOLD = 7; // 相关性评分高于此值，视为 "Correct"
const LOWER_THRESHOLD = 3; // 相关性评分低于此值，视为 "Incorrect"

// --- 模型定义 ---
// 定义一个LLM。我们将在整个图中使用它。
const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
});

// --- 检索评估器 (Retrieval Evaluator) ---
/**
 * 检索评估器，用于评估检索到的文档与问题的相关性。
 * @description 使用LLM来为每个文档打分(1-10)，并提供理由。
 */
const retrievalGrader = model.withStructuredOutput(
  z
    .object({
      score: z
        .number()
        .min(1)
        .max(10)
        .describe("文档与问题的相关性评分，1表示不相关，10表示非常相关。"),
      justification: z.string().describe("评分的简要理由。"),
    })
    .describe("对检索到的文档与问题的相关性进行评分的工具。"),
  {
    name: "retrieval_grader",
  },
);

const gradePrompt = ChatPromptTemplate.fromTemplate(
  `您是一位专业的评估员，负责评估检索到的文档与用户问题的相关性。
请仔细阅读以下文档和问题，并给出一个1到10之间的相关性分数。

- **1-3分 (不相关)**: 文档完全没有提到问题的核心概念。
- **4-6分 (部分相关)**: 文档提到了问题的一些关键词，但没有提供直接或有用的答案。
- **7-10分 (高度相关)**: 文档直接、清晰地回答了用户的问题，或者包含了构建答案所需的核心信息。

**检索到的文档:**
\n ------- \n
{context}
\n ------- \n
**用户的问题:** {question}
`,
);

const retrievalGraderChain = gradePrompt.pipe(retrievalGrader);

// --- 节点 (Nodes) ---

/**
 * **节点1: 检索 (Retrieve)**
 * @description 从向量数据库中检索与问题相关的文档。
 * @param {typeof GraphState.State} state - 图的当前状态。
 * @returns {Promise<Partial<typeof GraphState.State>>} - 包含检索到的文档的新状态。
 */
async function retrieve(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---NODE: RETRIEVE---");
  const documents = await retriever.invoke(state.question);
  return { documents };
}

/**
 * **节点2: 评估检索结果 (Grade Retrieval)**
 * @description 评估每个检索到的文档的相关性，并确定总体检索状态。
 * @param {typeof GraphState.State} state - 图的当前状态。
 * @returns {Promise<Partial<typeof GraphState.State>>} - 包含评分和检索状态的新状态。
 */
async function gradeRetrieval(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---NODE: GRADE RETRIEVAL---");
  const { question, documents } = state;
  let totalScore = 0;

  for (const doc of documents) {
    const grade = await retrievalGraderChain.invoke({
      question,
      context: doc.pageContent,
    });
    doc.metadata.relevance_score = grade.score; // 将分数存入元数据
    totalScore += grade.score;
    console.log(`  - Doc score: ${grade.score}`);
  }

  const averageScore = totalScore / (documents.length || 1);
  let retrieval_status: "Correct" | "Incorrect" | "Ambiguous";

  if (averageScore >= UPPER_THRESHOLD) {
    retrieval_status = "Correct";
    console.log("---GRADE: CORRECT---");
  } else if (averageScore < LOWER_THRESHOLD) {
    retrieval_status = "Incorrect";
    console.log("---GRADE: INCORRECT---");
  } else {
    retrieval_status = "Ambiguous";
    console.log("---GRADE: AMBIGUOUS---");
  }

  return { documents, retrieval_status };
}

/**
 * **节点3: 知识精炼 (Refine Knowledge)**
 * @description 对判定为"Correct"或"Ambiguous"的文档进行分解-过滤-重组，提取关键信息。
 * @param {typeof GraphState.State} state - 图的当前状态。
 * @returns {Promise<Partial<typeof GraphState.State>>} - 包含精炼后文档的新状态。
 */
async function refineKnowledge(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---NODE: REFINE KNOWLEDGE---");
  const { question, documents } = state;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 20,
    //尽可能保留句子完整性
    separators: ['\n\n', '\n', '. ', '。', '? ','! ','？','！'],
  });

  const refinedDocs: DocumentInterface[] = [];
  // 只处理评分较高的文档
  const relevantDocs = documents.filter(
    (doc) => doc.metadata.relevance_score >= LOWER_THRESHOLD
  );

  for (const doc of relevantDocs) {
    const splits = await splitter.splitDocuments([doc]);
    for (const split of splits) {
      const grade = await retrievalGraderChain.invoke({
        question,
        context: split.pageContent,
      });
      // 只保留高度相关的知识片段
      if (grade.score >= UPPER_THRESHOLD) {
        console.log("  - Keeping refined chunk.");
        refinedDocs.push(split);
      } else {
        console.log("  - Discarding refined chunk.");
      }
    }
  }

  return { documents: refinedDocs };
}

/**
 * **节点4: Web搜索 (Web Search)**
 * @description 当内部知识不足时，重写查询并执行网络搜索。
 * @param {typeof GraphState.State} state - 图的当前状态。
 * @returns {Promise<Partial<typeof GraphState.State>>} - 包含Web搜索结果的新状态。
 */
async function webSearch(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---NODE: WEB SEARCH---");
  const { question, documents, retrieval_status } = state;

  // 1. 重写查询以适应搜索引擎
  console.log("  - Rewriting query for web search...");
  const rewritePrompt = ChatPromptTemplate.fromTemplate(
    `请将以下问题转化为一个简洁、适合搜索引擎的关键词查询。
    **问题:** {question}`,
  );
  const queryRewriter = rewritePrompt.pipe(model).pipe(new StringOutputParser());
  const webQuery = await queryRewriter.invoke({ question });
  console.log(`  - Web query: ${webQuery}`);

  // 2. 执行Web搜索
  console.log("  - Searching web...");
  const searchTool = new SerpAPI(process.env.SERPAPI_API_KEY);
  const searchResult = await searchTool.invoke(webQuery);
  const webDocs = [new Document({ pageContent: searchResult })];

  // 根据检索状态决定是替换还是合并文档
  if (retrieval_status === "Incorrect") {
    console.log("  - Replacing documents with web results.");
    return { documents: webDocs };
  } else {
    // 'Ambiguous' 状态
    console.log("  - Appending web results to existing documents.");
    return { documents: documents.concat(webDocs) };
  }
}

/**
 * **节点5: 评估和精炼Web文档 (Grade and Refine Web)**
 * @description 对来自Web的文档进行评估和精炼。它只处理没有评分的文档。
 * @param {typeof GraphState.State} state - 图的当前状态。
 * @returns {Promise<Partial<typeof GraphState.State>>} - 包含最终文档集的新状态。
 */
async function gradeAndRefineWeb(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---NODE: GRADE AND REFINE WEB---");
  const { question, documents } = state;

  const docsToProcess = documents.filter(
    (d) => d.metadata.relevance_score === undefined
  );
  const existingDocs = documents.filter(
    (d) => d.metadata.relevance_score !== undefined
  );

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 20,
    separators: ['\n\n', '\n', '. ', '。', '? ','! ','？','！'],
  });

  const refinedWebDocs: DocumentInterface[] = [];
  for (const doc of docsToProcess) {
    const splits = await splitter.splitDocuments([doc]);
    for (const split of splits) {
      const grade = await retrievalGraderChain.invoke({
        question,
        context: split.pageContent,
      });
      if (grade.score >= UPPER_THRESHOLD) {
        console.log("  - Keeping web chunk.");
        refinedWebDocs.push(split);
      } else {
        console.log("  - Discarding web chunk.");
      }
    }
  }

  const finalDocs = existingDocs.concat(refinedWebDocs);
  return { documents: finalDocs };
}

/**
 * **节点6: 生成 (Generate)**
 * @description 使用最终的、经过校正的文档作为上下文来生成答案。
 * @param {typeof GraphState.State} state - 图的当前状态。
 * @returns {Promise<Partial<typeof GraphState.State>>} - 包含生成答案的新状态。
 */
async function generate(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---NODE: GENERATE---");
  const { question, documents } = state;
  const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

  const ragChain = prompt.pipe(model).pipe(new StringOutputParser());

  const generation = await ragChain.invoke({
    context: formatDocumentsAsString(documents),
    question: question,
  });

  return { generation };
}

// --- 边 (Edges) ---

/**
 * **条件边1: 决定检索后的下一步**
 * @description 根据`retrieval_status`决定是直接生成、进行Web搜索还是知识精炼。
 * @param {typeof GraphState.State} state - 图的当前状态。
 * @returns {"refineKnowledge" | "webSearch"} - 下一个节点的名称。
 */
function decideAction(state: typeof GraphState.State) {
  console.log("---EDGE: DECIDE ACTION---");
  const status = state.retrieval_status;
  if (status === "Incorrect") {
    return "webSearch";
  }
  return "refineKnowledge";
}

/**
 * **条件边2: 决定精炼后的下一步**
 * @description 在知识精炼后，检查是否需要补充Web搜索（针对"Ambiguous"状态）。
 * @param {typeof GraphState.State} state - 图的当前状态。
 * @returns {"webSearch" | "generate"} - 下一个节点的名称。
 */
function decideAfterRefinement(state: typeof GraphState.State) {
  console.log("---EDGE: DECIDE AFTER REFINEMENT---");
  const status = state.retrieval_status;
  if (status === "Ambiguous") {
    return "webSearch";
  }
  // "Correct" 状态
  return "generate";
}

// --- 构建图 (Build Graph) ---

const workflow = new StateGraph(GraphState)
  // 定义节点
  .addNode("retrieve", retrieve)
  .addNode("gradeRetrieval", gradeRetrieval)
  .addNode("refineKnowledge", refineKnowledge)
  .addNode("webSearch", webSearch)
  .addNode("gradeAndRefineWeb", gradeAndRefineWeb)
  .addNode("generate", generate);

// 定义图的流程
workflow.addEdge(START, "retrieve");
workflow.addEdge("retrieve", "gradeRetrieval");
workflow.addConditionalEdges("gradeRetrieval", decideAction);
workflow.addConditionalEdges("refineKnowledge", decideAfterRefinement);
workflow.addEdge("webSearch", "gradeAndRefineWeb");
workflow.addEdge("gradeAndRefineWeb", "generate");
workflow.addEdge("generate", END);

// 编译图
export const CRAGGraph = workflow.compile();
