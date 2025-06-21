"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, TrendingUp, TrendingDown, Trophy, Target, Clock, Hash } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { getContestHistory, getProblemStats } from "@/lib/api"

// Mock heatmap data (simplified)
const mockHeatmapData = Array.from({ length: 365 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toISOString().split("T")[0],
  count: Math.floor(Math.random() * 10),
}))

interface StudentProfileProps {
  student: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function StudentProfile({ student, open, onOpenChange }: StudentProfileProps) {
  const [contestFilter, setContestFilter] = useState("365")
  const [problemFilter, setProblemFilter] = useState("30")

  // Fetch contest history
  const { data: contestHistory = [], isLoading: loadingContests } = useQuery({
    queryKey: ["contestHistory", student?.id, contestFilter],
    queryFn: () => student ? getContestHistory(student.id, Number(contestFilter)).then(res => res.data) : Promise.resolve([]),
    enabled: !!student,
  });

  // Fetch problem stats
  const { data: problemStats, isLoading: loadingProblems } = useQuery({
    queryKey: ["problemStats", student?.id, problemFilter],
    queryFn: () => student ? getProblemStats(student.id, Number(problemFilter)).then(res => res.data) : Promise.resolve(null),
    enabled: !!student,
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 2100) return "text-red-500"
    if (rating >= 1900) return "text-orange-500"
    if (rating >= 1600) return "text-purple-500"
    if (rating >= 1400) return "text-blue-500"
    if (rating >= 1200) return "text-green-500"
    return "text-gray-500"
  }

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-muted"
    if (count <= 2) return "bg-green-200"
    if (count <= 4) return "bg-green-400"
    if (count <= 6) return "bg-green-600"
    return "bg-green-800"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Student Profile</DialogTitle>
          <DialogDescription>
            Detailed view of student's contest performance and problem solving statistics
          </DialogDescription>
          <div className="flex items-center space-x-4 mt-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={`/placeholder.svg?height=64&width=64`} />
              <AvatarFallback className="text-lg">
                {student?.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{student?.name}</h2>
              <p className="text-muted-foreground">{student?.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="font-mono">
                  {student?.cfHandle}
                </Badge>
                <Badge className={`${getRatingColor(student?.currentRating)} bg-opacity-10`}>
                  {student?.currentRating} Rating
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="contests" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contests">Contest History</TabsTrigger>
            <TabsTrigger value="problems">Problem Solving</TabsTrigger>
          </TabsList>

          <TabsContent value="contests" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Contest Performance</h3>
              <Select value={contestFilter} onValueChange={setContestFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last 365 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating Graph */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Progress</CardTitle>
                <CardDescription>Rating changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={contestHistory.map(contest => ({
                      ...contest,
                      date: formatDate(contest.date)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="new_rating"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Contest List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Contests</CardTitle>
                <CardDescription>Detailed contest performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contestHistory.map((contest, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{contest.contest_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center space-x-4">
                            <span className="flex items-center">
                              <CalendarDays className="h-4 w-4 mr-1" />
                              {formatDate(contest.date)}
                            </span>
                            <span className="flex items-center">
                              <Hash className="h-4 w-4 mr-1" />
                              Rank {contest.rank}
                            </span>
                            <span>{contest.solved_count} problems solved</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${getRatingColor(contest.new_rating)}`}>{contest.new_rating}</div>
                        <div
                          className={`text-sm flex items-center ${contest.rating_change > 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {contest.rating_change > 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {contest.rating_change > 0 ? "+" : ""}
                          {contest.rating_change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="problems" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Problem Solving Analytics</h3>
              <Select value={problemFilter} onValueChange={setProblemFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Solved</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{problemStats?.total_solved}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getRatingColor(problemStats?.average_rating ?? 0)}`}>
                    {problemStats?.average_rating}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Problems/Day</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{problemStats?.problems_per_day}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hardest Solved</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getRatingColor(problemStats?.hardest_solved_rating ?? 0)}`}>
                    {problemStats?.hardest_solved_rating}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Hardest Solved</p>
                </CardContent>
              </Card>
            </div>

            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Problems by Rating</CardTitle>
                <CardDescription>Distribution of solved problems by difficulty</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={problemStats ? Object.entries(problemStats.solved_by_rating).map(([rating, count]) => ({ rating, count })) : []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Submission Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Heatmap</CardTitle>
                <CardDescription>Daily submission activity over the past year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-53 gap-1 text-xs">
                  {problemStats?.submissions.slice(0, 371).map((day, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.count)}`}
                      title={`${day.date}: ${day.count} submissions`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>Less</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-sm bg-muted" />
                    <div className="w-3 h-3 rounded-sm bg-green-200" />
                    <div className="w-3 h-3 rounded-sm bg-green-400" />
                    <div className="w-3 h-3 rounded-sm bg-green-600" />
                    <div className="w-3 h-3 rounded-sm bg-green-800" />
                  </div>
                  <span>More</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
