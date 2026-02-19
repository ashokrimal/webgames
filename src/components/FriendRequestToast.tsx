import { Check, UserPlus, X } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

export const FriendRequestToast = () => {
  const { friendRequestNotification, respondFriendRequest } = useSocket();

  if (!friendRequestNotification) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] w-[320px]">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-4 animate-[fadeIn_.2s_ease-out]">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-semibold text-gray-900">Friend request</div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{friendRequestNotification.fromUsername}</span> wants to add you.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 btn-primary px-3 py-2 inline-flex items-center justify-center"
            onClick={() => respondFriendRequest(friendRequestNotification.id, true)}
          >
            <Check className="h-4 w-4 mr-2" />
            Accept
          </button>
          <button
            className="flex-1 btn-outline px-3 py-2 inline-flex items-center justify-center"
            onClick={() => respondFriendRequest(friendRequestNotification.id, false)}
          >
            <X className="h-4 w-4 mr-2" />
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};
