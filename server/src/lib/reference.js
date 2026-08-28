import { prisma } from '../config/prisma.js';

// Generates the next human property reference: "RE-<year>-<4 digits>", numbered
// sequentially within the year. A unique constraint on Property.reference is the
// real guard against duplicates; callers retry on the rare collision.
export const nextPropertyReference = async () => {
  const prefix = `RE-${new Date().getFullYear()}-`;

  const last = await prisma.property.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });

  const lastNumber = last ? Number.parseInt(last.reference.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
};
