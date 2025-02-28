import { useQuery, useMutation } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function NotificationList() {
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("POST", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  if (isLoading) return <p>Loading notifications...</p>;
  if (!notifications?.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <Bell className="h-5 w-5 text-blue-500" />
        Notifications
      </h3>
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`${notification.isRead ? 'bg-gray-50' : 'bg-white'}`}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{notification.title}</h4>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsReadMutation.mutate(notification.id)}
                >
                  <Check className="h-4 w-4" />
                  Mark as read
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
