import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { User as SelectUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, UserCheck, Syringe, ClipboardList } from "lucide-react";

export default function DoctorPage() {
  const { user } = useAuth();

  const { data: patients, isLoading } = useQuery<SelectUser[]>({
    queryKey: ["/api/patients"],
  });

  if (!user?.isDoctor) {
    return <div>Access denied. Only doctors can view this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-500" />
                Doctor Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1">{user.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">License Number</label>
                  <p className="mt-1">{user.licenseNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Specialization</label>
                  <p className="mt-1">{user.specialization}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Hospital</label>
                  <p className="mt-1">{user.hospital}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  My Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading patients...</p>
                ) : patients?.length === 0 ? (
                  <p className="text-gray-500">No patients have granted you access yet.</p>
                ) : (
                  <div className="space-y-4">
                    {patients?.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{patient.fullName}</h4>
                            <p className="text-sm text-gray-500">
                              DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Blood Type: {patient.bloodType || "Not specified"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/medical-history/${patient.id}`}>
                              <Button variant="outline" size="sm">
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Medical History
                              </Button>
                            </Link>
                            <Link href={`/vaccines/${patient.id}`}>
                              <Button variant="outline" size="sm">
                                <Syringe className="h-4 w-4 mr-2" />
                                Vaccines
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
