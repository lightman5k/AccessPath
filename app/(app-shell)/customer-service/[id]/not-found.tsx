import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function CustomerServiceConversationNotFound() {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <EmptyState
        title="Conversation not found"
        description="The requested customer-service conversation does not exist or is no longer available."
      />
      <div className="flex justify-center">
        <Link
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          href="/customer-service"
        >
          Back to conversations
        </Link>
      </div>
    </div>
  );
}
