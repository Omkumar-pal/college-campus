'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { embed, vectorToString } from '@/lib/embeddings';
import { revalidatePath } from 'next/cache';

export async function createComment(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Login required' };

  const collegeId = formData.get('collegeId')?.toString();
  const parentId = formData.get('parentId')?.toString() || null;
  const content = formData.get('content')?.toString().trim();

  if (!collegeId || !content) return { error: 'Missing fields' };
  if (content.length < 1 || content.length > 1000) return { error: 'Comment must be 1-1000 chars' };

  // Validate parent belongs to same college if nested
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.collegeId !== collegeId) return { error: 'Invalid parent' };
  }

  let embedding: any = null;
  if (!parentId) {
    // Only root comments get embedding (vector search per spec)
    try {
      const vec = await embed(content);
      embedding = vectorToString(vec);
    } catch {
      embedding = null;
    }
  }

  // Use raw query for vector type, fallback to create without embedding if fails
  try {
    if (embedding) {
      await prisma.$executeRaw`INSERT INTO "comments" ("id","college_id","user_id","parent_id","content","embedding","created_at","updated_at") VALUES (gen_random_uuid(), ${collegeId}, ${session.userId}, ${parentId}, ${content}, ${embedding}::vector, NOW(), NOW())`;
    } else {
      await prisma.comment.create({ data: { collegeId, userId: session.userId, parentId: parentId || undefined, content } });
    }
  } catch (e) {
    // Fallback if pgvector not enabled — store without embedding
    await prisma.comment.create({ data: { collegeId, userId: session.userId, parentId: parentId || undefined, content } });
  }

  const college = await prisma.college.findUnique({ where: { id: collegeId }, select: { slug: true } });
  if (college) revalidatePath(`/colleges/${college.slug}`);
  return { success: true };
}

export async function fetchRootComments(collegeId: string, query?: string, limit = 20) {
  if (!query?.trim()) {
    return prisma.comment.findMany({
      where: { collegeId, parentId: null },
      include: { user: { select: { name: true } }, _count: { select: { replies: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Vector search per-college, roots only, fallback <0.5 low-ranked
  try {
    const { embed, cosineSimilarity, stringToVector } = await import('@/lib/embeddings');
    const qVec = await embed(query);
    const roots = await prisma.comment.findMany({
      where: { collegeId, parentId: null },
      include: { user: { select: { name: true } }, _count: { select: { replies: true } } },
    });
    // Filter to those with embedding string that can be parsed (our stub stores as vector string via raw, but fallback stored as null)
    // For demo, if no embedding, do lexical fallback
    const withScore = roots.map((c: any) => {
      let score = 0;
      const embStr = (c as any).embedding as string | null;
      if (embStr) {
        try {
          const vec = stringToVector(embStr);
          if (vec.length) score = cosineSimilarity(qVec, vec);
        } catch {}
      } else {
        // lexical fallback cosine via simple token overlap
        const hay = c.content.toLowerCase();
        const q = query.toLowerCase();
        score = hay.includes(q) ? 0.6 : 0.2;
      }
      return { ...c, similarity: score };
    });
    withScore.sort((a: any, b: any) => b.similarity - a.similarity);
    // <0.5 show low-ranked as-is (per spec)
    return withScore.slice(0, limit);
  } catch {
    return prisma.comment.findMany({
      where: { collegeId, parentId: null, content: { contains: query, mode: 'insensitive' } },
      include: { user: { select: { name: true } }, _count: { select: { replies: true } } },
      take: limit,
    });
  }
}

export async function fetchReplies(parentId: string, take = 4, cursor?: string) {
  const where: any = { parentId };
  if (cursor) {
    where.createdAt = { gt: new Date(cursor) };
  }
  return prisma.comment.findMany({
    where,
    include: { user: { select: { name: true } }, _count: { select: { replies: true } } },
    orderBy: { createdAt: 'asc' },
    take,
  });
}
