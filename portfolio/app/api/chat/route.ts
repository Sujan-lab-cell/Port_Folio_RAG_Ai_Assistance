import { NextRequest, NextResponse } from 'next/server';
import { performHybridRetrieval } from '@/src/lib/rag/retrieval';
import { assembleContext } from '@/src/lib/rag/context';
import { generateGroundedAnswer } from '@/src/lib/rag/generator';
import { detectNavigationIntent } from '@/src/lib/navigationIntent';
import { getAssistantMode } from '@/src/lib/assistant/mode';
import { resolveFallbackQuery } from '@/src/lib/assistant/fallback/resolver';
import { resolveConversationalQuery } from '@/src/lib/rag/conversationResolver';

export async function POST(req: NextRequest) {
  // Stage 1: Request received
  const totalStart = performance.now();
  const stage1_requestReceivedISO = new Date().toISOString();

  try {
    const body = await req.json();
    const query = body.message || body.prompt || body.query;
    const language = body.language || 'en';

    // Validate optional short-term history array (up to 6 items)
    let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (Array.isArray(body.history)) {
      history = body.history
        .filter(
          (item: any) =>
            item &&
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string' &&
            item.content.trim().length > 0
        )
        .map((item: any) => ({
          role: item.role as 'user' | 'assistant',
          content: item.content.trim(),
        }));
    }

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Valid chat query/message is required.' },
        { status: 400 }
      );
    }

    // Check Assistant Operating Mode ("rag" vs "rule")
    const assistantMode = getAssistantMode();

    if (assistantMode === 'rule') {
      const fallbackResult = resolveFallbackQuery(query);
      let navAction: { route: string; label: string } | undefined = undefined;

      if (fallbackResult.type === 'navigation') {
        navAction = {
          route: fallbackResult.route,
          label: fallbackResult.label.includes('→') ? fallbackResult.label : `${fallbackResult.label} →`,
        };
      } else if (fallbackResult.type === 'unsupported' && fallbackResult.route) {
        navAction = {
          route: fallbackResult.route,
          label: fallbackResult.label ? (fallbackResult.label.includes('→') ? fallbackResult.label : `${fallbackResult.label} →`) : 'Explore Portfolio →',
        };
      }

      return NextResponse.json({
        answer: fallbackResult.answer,
        navAction,
      });
    }

    // Check for navigation intent
    const { isPureNavigation, navAction } = detectNavigationIntent(query, language);

    if (isPureNavigation && navAction) {
      const pageName = navAction.route === '/' ? 'Home' : navAction.route.replace('/', '');
      const capitalizedPage = pageName.charAt(0).toUpperCase() + pageName.slice(1);
      const defaultAnswer = language === 'ja'
        ? `かしこまりました。スジャンの${capitalizedPage}ページはこちらです。`
        : `Sure — here's Sujan's ${capitalizedPage} page.`;

      return NextResponse.json({
        answer: defaultAnswer,
        navAction,
      });
    }

    // Resolve conversational query/pronouns using short-term memory
    const resolution = resolveConversationalQuery(query, history);
    const retrievalQuery = resolution.wasResolved ? resolution.resolvedQuery : query;

    // Stages 2, 3, 4: Embedding, Supabase Retrieval, Reranking
    const { topChunks, metrics: retrievalMetrics } = await performHybridRetrieval(retrievalQuery, 30, 5);

    // Stage 5: Context Assembly
    const assembledContext = assembleContext(topChunks);

    // Stage 6: Grounded Answer Generation
    const generationResult = await generateGroundedAnswer(retrievalQuery, assembledContext);

    // Stage 7: Response returned
    const totalEnd = performance.now();
    const stage7_responseReturnedISO = new Date().toISOString();
    const totalDurationMs = Math.round((totalEnd - totalStart) * 100) / 100;

    const telemetry = {
      originalQuery: query,
      retrievalQuery,
      conversationalResolution: {
        wasResolved: resolution.wasResolved,
        confidence: resolution.confidence,
        resolvedQuery: resolution.resolvedQuery,
        entity: resolution.entity,
      },
      stage1_requestReceived: {
        timestamp: stage1_requestReceivedISO,
      },
      stage2_queryEmbedding: {
        startTime: retrievalMetrics.embedding.startTime,
        endTime: retrievalMetrics.embedding.endTime,
        durationMs: retrievalMetrics.embedding.durationMs,
        processState: retrievalMetrics.embedding.processState,
      },
      stage3_supabaseRetrieval: {
        startTime: retrievalMetrics.supabase.startTime,
        endTime: retrievalMetrics.supabase.endTime,
        durationMs: retrievalMetrics.supabase.durationMs,
        rawCandidatesRetrieved: retrievalMetrics.supabase.rawCandidateCount,
      },
      stage4_hybridReranking: {
        startTime: retrievalMetrics.reranking.startTime,
        endTime: retrievalMetrics.reranking.endTime,
        durationMs: retrievalMetrics.reranking.durationMs,
        retrievedTopChunksCount: topChunks.length,
      },
      stage5_contextAssembly: {
        startTime: assembledContext.metrics.startTime,
        endTime: assembledContext.metrics.endTime,
        durationMs: assembledContext.metrics.durationMs,
        usedChunkCount: assembledContext.chunkCount,
        contextCharacterSize: assembledContext.totalCharacters,
      },
      stage6_llmGeneration: {
        startTime: generationResult.metrics.startTime,
        endTime: generationResult.metrics.endTime,
        durationMs: generationResult.metrics.durationMs,
        processState: generationResult.metrics.processState,
      },
      stage7_responseReturned: {
        timestamp: stage7_responseReturnedISO,
      },
      totalEndToEndDurationMs: totalDurationMs,
    };

    console.log('[RAG TELEMETRY]', JSON.stringify(telemetry, null, 2));

    return NextResponse.json({
      answer: generationResult.answer,
      navAction: navAction || undefined,
      chunks: assembledContext.usedChunks,
      chunkCount: assembledContext.chunkCount,
      telemetry,
    });
  } catch (error: any) {
    console.error('API /api/chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error during RAG chat processing.' },
      { status: 500 }
    );
  }
}
