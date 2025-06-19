"use client"
import { getStudents, addStudent, updateStudent, syncStudent } from "@/lib/api";
import type { Student } from "@/types/student";
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Settings,
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  Clock,
  Mail,
  AlertTriangle,
  Users,
  Trophy,
  Target,
  Activity,
  RefreshCw,
} from "lucide-react"
import { useTheme } from "next-themes"
import StudentProfile from "@/components/student-profile"
import AddStudentDialog from "@/components/add-student-dialog"
import SettingsDialog from "@/components/settings-dialog"
import EditStudentDialog from "@/components/edit-student-dialog"
import { useQuery, useMutation } from "@tanstack/react-query"
import DeleteStudentDialog from "@/components/delete-student-dialog"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function getRatingColor(rating: number) {
  if (rating >= 2100) return "text-red-500"
  if (rating >= 1900) return "text-orange-500"
  if (rating >= 1600) return "text-purple-500"
  if (rating >= 1400) return "text-blue-500"
  if (rating >= 1200) return "text-green-500"
  return "text-gray-500"
}

function getRatingBadge(rating: number) {
  if (rating >= 2100) return { label: "Master", color: "bg-red-500" }
  if (rating >= 1900) return { label: "Candidate Master", color: "bg-orange-500" }
  if (rating >= 1600) return { label: "Expert", color: "bg-purple-500" }
  if (rating >= 1400) return { label: "Specialist", color: "bg-blue-500" }
  if (rating >= 1200) return { label: "Pupil", color: "bg-green-500" }
  return { label: "Newbie", color: "bg-gray-500" }
}

function formatLastUpdated(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

export default function StudentProgressDashboard() {
  // All hooks at the top
  const { data: students = [], isLoading, refetch } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => getStudents().then(res => res.students),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // All hooks must be called before any return!
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await import("@/lib/api").then(m => m.deleteStudent(id)),
    onSuccess: () => {
      toast.success("Student deleted successfully");
      setShowDeleteDialog(false);
      setStudentToDelete(null);
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete student");
    },
  });

  const syncMutation = useMutation({
    mutationFn: (cf_handle: string) => syncStudent(cf_handle),
    onSuccess: () => {
      toast.success("Student synced successfully");
      refetch();
    },
    onError: () => {
      toast.error("Failed to sync student");
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only return after all hooks are called
  if (isLoading || !mounted) return <div>Loading...</div>;

  const filteredStudents = students.filter((student: Student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cf_handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeStudents = students.filter((s: Student) => !s.email_opt_out).length;
  const inactiveStudents = students.length - activeStudents;
  const avgRating = students.length
    ? Math.round(students.reduce((sum: number, s: Student) => sum + (s.current_rating || 0), 0) / students.length)
    : 0;

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "CF Handle", "Current Rating", "Max Rating", "Last Updated", "Status"];
    const csvContent = [
      headers.join(","),
      ...students.map((student: Student) =>
        [
          student.name,
          student.email,
          student.phone,
          student.cf_handle,
          student.current_rating,
          student.max_rating,
          student.last_updated,
          student.email_opt_out ? "Inactive" : "Active",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_data.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const ratingBands = [
    { label: "<800", min: 0, max: 799 },
    { label: "800-999", min: 800, max: 999 },
    { label: "1000-1199", min: 1000, max: 1199 },
    { label: "1200-1399", min: 1200, max: 1399 },
    { label: "1400-1599", min: 1400, max: 1599 },
    { label: "1600-1799", min: 1600, max: 1799 },
    { label: "1800-2099", min: 1800, max: 2099 },
    { label: "2100+", min: 2100, max: Infinity },
  ];
  const ratingDistribution = ratingBands.map(band => ({
    rating: band.label,
    count: students.filter(s => (s.current_rating ?? 0) >= band.min && (s.current_rating ?? 0) <= band.max).length,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Student Progress System</h1>
                  <p className="text-sm text-muted-foreground">Codeforces Performance Tracker</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{activeStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Students</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{inactiveStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRatingColor(avgRating)}`}>{avgRating}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Number of students in each rating band</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <CardTitle>Students Overview</CardTitle>
                <CardDescription>Manage and track student progress on Codeforces</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-muted/50 rounded-lg font-medium text-sm">
                    <div className="col-span-3">Student</div>
                    <div className="col-span-2">Contact</div>
                    <div className="col-span-2">CF Handle</div>
                    <div className="col-span-2">Rating</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                  <div className="space-y-2 mt-4">
                    {filteredStudents.map((student: Student) => {
                      const ratingBadge = getRatingBadge(student.current_rating)
                      return (
                        <div
                          key={student.id}
                          className="grid grid-cols-12 gap-4 py-4 px-4 border rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="col-span-3 flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                              <AvatarFallback>
                                {student.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                            </div>
                          </div>
                          <div className="col-span-2 flex flex-col justify-center">
                            <div className="text-sm">{student.phone}</div>
                          </div>
                          <div className="col-span-2 flex flex-col justify-center">
                            <div className="font-mono text-sm">{student.cf_handle}</div>
                          </div>
                          <div className="col-span-2 flex flex-col justify-center">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className={`${ratingBadge.color} text-white`}>
                                {student.current_rating}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                Max: {student.max_rating}
                                {student.current_rating > student.max_rating ? (
                                  <TrendingUp className="inline h-3 w-3 ml-1 text-green-500" />
                                ) : student.current_rating < student.max_rating ? (
                                  <TrendingDown className="inline h-3 w-3 ml-1 text-red-500" />
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2 flex flex-col justify-center">
                            <div className="flex items-center space-x-2">
                              <Badge variant={student.email_opt_out ? "destructive" : "default"}>
                                {student.email_opt_out ? "Inactive" : "Active"}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {formatLastUpdated(student.last_updated)}
                            </div>
                          </div>
                          <div className="col-span-1 flex items-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedStudent(student)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setShowEditDialog(true); }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setStudentToDelete(student); setShowDeleteDialog(true); }}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => syncMutation.mutate(student.cf_handle)} disabled={syncMutation.isPending}>
                                  {syncMutation.isPending ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                  )}
                                  Sync
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {filteredStudents.map((student: Student) => {
                    const ratingBadge = getRatingBadge(student.current_rating)
                    return (
                      <Card key={student.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                              <AvatarFallback>
                                {student.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedStudent(student)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedStudent(student); setShowEditDialog(true); }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setStudentToDelete(student); setShowDeleteDialog(true); }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => syncMutation.mutate(student.cf_handle)} disabled={syncMutation.isPending}>
                                {syncMutation.isPending ? (
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Sync
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">CF Handle:</span>
                            <span className="font-mono text-sm">{student.cf_handle}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Rating:</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className={`${ratingBadge.color} text-white`}>
                                {student.current_rating}
                              </Badge>
                              <span className="text-xs text-muted-foreground">(Max: {student.max_rating})</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant={student.email_opt_out ? "destructive" : "default"}>
                                {student.email_opt_out ? "Inactive" : "Active"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Last Updated:</span>
                            <span className="text-xs text-muted-foreground">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {formatLastUpdated(student.last_updated)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddStudentDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <SettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />
      <EditStudentDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        student={selectedStudent}
      />
      <DeleteStudentDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setStudentToDelete(null);
        }}
        student={studentToDelete}
        onConfirm={() => {
          if (studentToDelete) deleteMutation.mutate(studentToDelete.id);
        }}
        loading={deleteMutation.isPending}
      />

      {selectedStudent && (
        <StudentProfile
          student={selectedStudent}
          open={!!selectedStudent}
          onOpenChange={() => setSelectedStudent(null)}
        />
      )}
    </div>
  )
}
