import { notFound } from "next/navigation";
import { customerServiceConversationById } from "@/lib/mock";
import { ConversationDetailClient } from "@/app/(app-shell)/customer-service/[id]/conversation-detail-client";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = customerServiceConversationById[id];

  if (!conversation) {
    notFound();
  }

  return <ConversationDetailClient conversation={conversation} />;
}
