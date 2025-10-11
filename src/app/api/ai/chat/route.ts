import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AIService, validateAIConfig } from '@/lib/ai';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  tool_id: z.string(),
  manychat_user_id: z.string(),
  message: z.string(),
  conversation_id: z.string().optional(), // Optional: create new if not provided
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ChatRequestSchema.parse(body);

    // Load AI tool configuration
    const tool = await prisma.tool.findUnique({
      where: { id: validated.tool_id },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'AI tool not found' },
        { status: 404 }
      );
    }

    if (!tool.active) {
      return NextResponse.json(
        { error: 'AI tool is not active' },
        { status: 400 }
      );
    }

    if (!['ai_chat', 'ai_assistant'].includes(tool.type)) {
      return NextResponse.json(
        { error: 'Tool is not an AI chat tool' },
        { status: 400 }
      );
    }

    // Parse AI config
    let aiConfig = null;
    if (tool.config) {
      try {
        aiConfig = JSON.parse(tool.config);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid AI configuration' },
          { status: 500 }
        );
      }
    }

    if (!validateAIConfig(aiConfig)) {
      return NextResponse.json(
        { error: 'AI tool configuration is incomplete' },
        { status: 500 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { manychatId: validated.manychat_user_id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          manychatId: validated.manychat_user_id,
        },
      });
    }

    // Find or create conversation
    let conversation;
    if (validated.conversation_id) {
      conversation = await prisma.conversation.findUnique({
        where: { id: validated.conversation_id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          toolId: tool.id,
          active: true,
        },
        include: { messages: true },
      });
    }

    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: validated.message,
      },
    });

    // Prepare conversation history if memory is enabled
    const conversationHistory = [];
    if (aiConfig.conversationMemory && conversation.messages.length > 0) {
      conversationHistory.push(
        ...conversation.messages.slice(-10).map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }))
      );
    }

    // Add current user message
    conversationHistory.push({
      role: 'user' as const,
      content: validated.message,
    });

    // Call AI service
    const aiService = new AIService(aiConfig);
    const aiResponse = await aiService.chat(conversationHistory);

    // Save AI response
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
        tokens: aiResponse.tokens,
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      conversation_id: conversation.id,
      response: aiResponse.content,
      tokens: aiResponse.tokens,
      model: aiResponse.model,
    });
  } catch (error) {
    console.error('AI chat error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'AI chat failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'AI chat failed' },
      { status: 500 }
    );
  }
}
