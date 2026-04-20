import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { ApiErrorResponse, withErrorHandling, requireFields } from '@/lib/errors';
import { DeliverySlot } from '@prisma/client';

interface RollupSettingsResponse {
  enabled: boolean;
  deliverySlot: DeliverySlot;
  timezone: string;
  digestName: string;
}

const DELIVERY_SLOT_TIMES: Record<DeliverySlot, string> = {
  MORNING: '08:00',
  AFTERNOON: '14:00',
  EVENING: '20:00',
};

export async function GET() {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    let settings = await db.rollupSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      settings = await db.rollupSettings.create({
        data: {
          userId: session.user.id,
          enabled: false,
          deliverySlot: 'MORNING',
          timezone: 'UTC',
          digestName: 'My Daily Rollup',
        },
      });
    }

    const response: RollupSettingsResponse = {
      enabled: settings.enabled,
      deliverySlot: settings.deliverySlot,
      timezone: settings.timezone,
      digestName: settings.digestName,
    };

    return NextResponse.json(response);
  }, 'Failed to fetch rollup settings');
}

export async function PUT(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    const body = await request.json();

    const { valid, missing } = requireFields(body, ['enabled', 'deliverySlot', 'timezone', 'digestName'] as const);
    if (!valid) {
      return ApiErrorResponse.missingFields(missing);
    }

    const { enabled, deliverySlot, timezone, digestName } = body;

    if (typeof enabled !== 'boolean') {
      return ApiErrorResponse.badRequest('enabled must be a boolean');
    }

    if (!['MORNING', 'AFTERNOON', 'EVENING'].includes(deliverySlot)) {
      return ApiErrorResponse.badRequest('deliverySlot must be one of: MORNING, AFTERNOON, EVENING');
    }

    if (typeof timezone !== 'string') {
      return ApiErrorResponse.badRequest('timezone must be a string');
    }

    if (typeof digestName !== 'string') {
      return ApiErrorResponse.badRequest('digestName must be a string');
    }

    const settings = await db.rollupSettings.upsert({
      where: { userId: session.user.id },
      update: {
        enabled,
        deliverySlot,
        timezone,
        digestName,
      },
      create: {
        userId: session.user.id,
        enabled,
        deliverySlot,
        timezone,
        digestName,
      },
    });

    const response: RollupSettingsResponse = {
      enabled: settings.enabled,
      deliverySlot: settings.deliverySlot,
      timezone: settings.timezone,
      digestName: settings.digestName,
    };

    return NextResponse.json(response);
  }, 'Failed to update rollup settings');
}
