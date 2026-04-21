import { auth, signOut } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Perform explicit cascade deletion of all related data
    await db.account.deleteMany({
      where: { userId: session.user.id },
    });

    await db.session.deleteMany({
      where: { userId: session.user.id },
    });

    await db.subscription.deleteMany({
      where: { userId: session.user.id },
    });

    await db.subscriptionPreference.deleteMany({
      where: { userId: session.user.id },
    });

    await db.unsubscriptionAttempt.deleteMany({
      where: { userId: session.user.id },
    });

    await db.bulkDeletionJob.deleteMany({
      where: { userId: session.user.id },
    });

    await db.gmailSyncState.delete({
      where: { userId: session.user.id },
    });

    await db.rollupSettings.delete({
      where: { userId: session.user.id },
    });

    // Delete the user record itself
    await db.user.delete({
      where: { id: session.user.id },
    });

    // Clear the user's session
    await signOut({ redirect: false });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
