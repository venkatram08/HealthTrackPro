import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Syringe, 
  ClipboardList, 
  Users, 
  LogOut,
  Calendar,
  User
} from "lucide-react";
import { useEffect } from "react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.isDoctor) {
      setLocation("/doctor");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Health Records Portal
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.fullName}</span>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/vaccines">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-blue-500" />
                  Vaccines
                </CardTitle>
                <CardDescription>Track your vaccination history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  View and manage your vaccine records, including upcoming doses and past immunizations.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-500" />
                  Profile
                </CardTitle>
                <CardDescription>Manage your health profile</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Update your personal information and medical history.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Family Members
              </CardTitle>
              <CardDescription>Manage family profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Add and manage health records for your family members.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-orange-500" />
                Medical History
              </CardTitle>
              <CardDescription>View your medical records</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Access your complete medical history and conditions.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-500" />
                Appointments
              </CardTitle>
              <CardDescription>Schedule medical visits</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Manage your upcoming medical appointments and reminders.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}