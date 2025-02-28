import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, UserPlus } from "lucide-react";

export function DoctorSearch() {
  const [licenseNumber, setLicenseNumber] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const { toast } = useToast();

  const { data: doctor, isLoading } = useQuery<User>({
    queryKey: ["/api/doctors/search", licenseNumber],
    queryFn: async () => {
      if (!licenseNumber) return null;
      const res = await apiRequest("GET", `/api/doctors/search/${licenseNumber}`);
      return res.json();
    },
    enabled: searchTriggered && !!licenseNumber,
  });

  const requestAccessMutation = useMutation({
    mutationFn: async (licenseNumber: string) => {
      const res = await apiRequest("POST", "/api/doctor-access", { licenseNumber });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Access request sent to doctor",
      });
      setSearchTriggered(false);
      setLicenseNumber("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTriggered(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-purple-500" />
          Grant Doctor Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            placeholder="Enter doctor's license number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
          <Button type="submit" disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>

        {isLoading && <p>Searching...</p>}
        
        {doctor && (
          <div className="p-4 border rounded-lg bg-white">
            <h4 className="font-medium">{doctor.fullName}</h4>
            <p className="text-sm text-gray-600">
              Specialization: {doctor.specialization}
            </p>
            <p className="text-sm text-gray-600">
              Hospital: {doctor.hospital}
            </p>
            <Button
              onClick={() => requestAccessMutation.mutate(licenseNumber)}
              disabled={requestAccessMutation.isPending}
              className="mt-4"
            >
              Request Access
            </Button>
          </div>
        )}

        {searchTriggered && !isLoading && !doctor && (
          <p className="text-red-500">No doctor found with this license number.</p>
        )}
      </CardContent>
    </Card>
  );
}
