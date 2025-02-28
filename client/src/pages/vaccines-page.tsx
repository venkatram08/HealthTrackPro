import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Vaccine, insertVaccineSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Syringe, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function VaccinesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const userId = location.split('/')[2]; // Get userId from URL if present

  const { data: vaccines, isLoading } = useQuery<Vaccine[]>({
    queryKey: ["/api/vaccines", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", userId ? `/api/vaccines/${userId}` : "/api/vaccines");
      return res.json();
    },
  });

  const form = useForm({
    resolver: zodResolver(insertVaccineSchema),
    defaultValues: {
      name: "",
      dateAdministered: new Date().toISOString().split("T")[0],
      provider: "",
      batchNumber: "",
      nextDueDate: "",
    },
  });

  const addVaccineMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/vaccines", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vaccines"] });
      form.reset();
      toast({
        title: "Success",
        description: "Vaccine record added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const upcomingVaccines = vaccines?.filter(
    (vaccine) => vaccine.nextDueDate && new Date(vaccine.nextDueDate) > new Date()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href={user?.isDoctor ? "/doctor" : "/"}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Vaccine Records</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {!userId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Syringe className="h-5 w-5 text-blue-500" />
                    Add New Vaccine Record
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => addVaccineMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vaccine Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dateAdministered"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date Administered</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="provider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Healthcare Provider</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="batchNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Batch Number</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="nextDueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next Due Date (if applicable)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={addVaccineMutation.isPending}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Vaccine Record
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Vaccination History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading...</p>
                ) : !vaccines?.length ? (
                  <p className="text-gray-500">No vaccine records found.</p>
                ) : (
                  <div className="space-y-4">
                    {vaccines.map((vaccine) => (
                      <div
                        key={vaccine.id}
                        className="p-4 rounded-lg border bg-white"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{vaccine.name}</h4>
                            <p className="text-sm text-gray-500">
                              Administered:{" "}
                              {new Date(vaccine.dateAdministered).toLocaleDateString()}
                            </p>
                            {vaccine.provider && (
                              <p className="text-sm text-gray-500">
                                Provider: {vaccine.provider}
                              </p>
                            )}
                          </div>
                          {vaccine.batchNumber && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Batch: {vaccine.batchNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  Upcoming Vaccinations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!upcomingVaccines?.length ? (
                  <p className="text-gray-500">No upcoming vaccinations scheduled.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingVaccines.map((vaccine) => (
                      <div
                        key={vaccine.id}
                        className="p-4 rounded-lg border bg-white"
                      >
                        <h4 className="font-medium">{vaccine.name}</h4>
                        <p className="text-sm text-gray-500">
                          Due: {new Date(vaccine.nextDueDate!).toLocaleDateString()}
                        </p>
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