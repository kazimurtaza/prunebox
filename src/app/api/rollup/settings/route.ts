import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { ApiErrorResponse, withErrorHandling, requireFields } from '@/lib/errors';

interface RollupSettingsResponse {
  enabled: boolean;
  deliveryTime: string;
  timezone: string;
  digestName: string;
}

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
          deliveryTime: '08:00',
          timezone: 'UTC',
          digestName: 'My Daily Rollup',
        },
      });
    }

    const response: RollupSettingsResponse = {
      enabled: settings.enabled,
      deliveryTime: settings.deliveryTime,
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

    const { valid, missing } = requireFields(body, ['enabled', 'deliveryTime', 'timezone', 'digestName'] as const);
    if (!valid) {
      return ApiErrorResponse.missingFields(missing);
    }

    const { enabled, deliveryTime, timezone, digestName } = body;

    if (typeof enabled !== 'boolean') {
      return ApiErrorResponse.badRequest('enabled must be a boolean');
    }

    if (typeof deliveryTime !== 'string' || !/^\d{2}:\d{2}$/.test(deliveryTime)) {
      return ApiErrorResponse.badRequest('deliveryTime must be in HH:MM format');
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
        deliveryTime,
        timezone,
        digestName,
      },
      create: {
        userId: session.user.id,
        enabled,
        deliveryTime,
        timezone,
        digestName,
      },
    });

    const response: RollupSettingsResponse = {
      enabled: settings.enabled,
      deliveryTime: settings.deliveryTime,
      timezone: settings.timezone,
      digestName: settings.digestName,
    };

    return NextResponse.json(response);
  }, 'Failed to update rollup settings');
}
