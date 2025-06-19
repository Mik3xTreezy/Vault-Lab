"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  BarChart3,
  Settings,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Plus,
  Clock,
  Shield,
  Activity,
  CreditCard,
  Wallet,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Globe,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e42', '#6366f1', '#f43f5e', '#a3e635', '#fbbf24', '#818cf8'];

export default function Admin() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [tasks, setTasks] = useState<any[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    adUrl: "",
    devices: [] as string[],
    completionTimeSeconds: 60, // Default 60 seconds
    excludedBrowsers: [] as string[], // Browsers to exclude this task from
    countryRates: {
      tier1: "$4.50",
      tier2: "$2.80",
      tier3: "$1.50"
    }
  });

  // CPM Rate Management
  const [bulkCpmRates, setBulkCpmRates] = useState({
    tier1: "",
    tier2: "",
    tier3: ""
  });
  const [selectedTasksForBulk, setSelectedTasksForBulk] = useState<number[]>([]);

  // Individual CPM rate editing state
  const [editingCpmTask, setEditingCpmTask] = useState<any>(null);
  const [tempCpmRates, setTempCpmRates] = useState({
    tier1: "",
    tier2: "",
    tier3: ""
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    
    async function initFetchUsers() {
      setLoadingUsers(true)
      try {
        const res = await fetch("/api/users")
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json()
        console.log('[ADMIN DEBUG] /api/users response:', data);
        setUsers(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('[ADMIN DEBUG] /api/users error:', err);
        setUsers([])
      }
      setLoadingUsers(false)
    }
    initFetchUsers()
  }, [isLoaded, isSignedIn, user])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    async function initFetchAnalytics() {
      setLoadingAnalytics(true)
      try {
        const res = await fetch("/api/dashboard-analytics")
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json()
        console.log('[ADMIN DEBUG] /api/dashboard-analytics response:', data);
        setAnalytics(data && typeof data === 'object' ? data : null)
      } catch (err) {
        console.error('[ADMIN DEBUG] /api/dashboard-analytics error:', err);
        setAnalytics(null)
      }
      setLoadingAnalytics(false)
    }
    initFetchAnalytics()
  }, [isLoaded, isSignedIn, user])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    async function initFetchTasks() {
      setLoadingTasks(true);
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        console.log('[ADMIN DEBUG] /api/tasks response:', data);
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('[ADMIN DEBUG] /api/tasks error:', err);
        setTasks([]);
      }
      setLoadingTasks(false);
    }
    initFetchTasks();
  }, [isLoaded, isSignedIn, user]);

  // Early return for loading state
  if (!isLoaded) {
    return <div className="text-white p-8">Loading...</div>;
  }

  // Early return for unauthorized access
  if (
    !isSignedIn ||
    !user ||
    !user.emailAddresses ||
    !user.emailAddresses[0] ||
    user.emailAddresses[0].emailAddress !== "ananthu9539@gmail.com"
  ) {
    return <div className="text-white p-8">Access denied.</div>;
  }

  // Task CRUD operations
  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const addTask = async (taskData: any) => {
    setIsAddingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          ad_url: taskData.adUrl,
          devices: taskData.devices,
          completion_time_seconds: taskData.completionTimeSeconds,
          excluded_browsers: taskData.excludedBrowsers,
          cpm_tier1: parseFloat(taskData.countryRates.tier1.replace("$", "")) || 0,
          cpm_tier2: parseFloat(taskData.countryRates.tier2.replace("$", "")) || 0,
          cpm_tier3: parseFloat(taskData.countryRates.tier3.replace("$", "")) || 0,
          status: "Active"
        })
      });
      if (!res.ok) throw new Error("Failed to add task");
      await fetchTasks();
      // Reset form
      setNewTask({
        title: "",
        description: "",
        adUrl: "",
        devices: [],
        completionTimeSeconds: 60,
        excludedBrowsers: [],
        countryRates: {
          tier1: "$4.50",
          tier2: "$2.80",
          tier3: "$1.50"
        }
      });
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task. Please try again.");
    } finally {
      setIsAddingTask(false);
    }
  };

  const updateTask = async (taskId: number, taskData: any) => {
    setIsEditingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          title: taskData.title,
          description: taskData.description,
          ad_url: taskData.ad_url || taskData.adUrl,
          devices: taskData.devices,
          completion_time_seconds: taskData.completion_time_seconds || 60,
          excluded_browsers: taskData.excluded_browsers || [],
          cpm_tier1: parseFloat(taskData.cpm_tier1) || 0,
          cpm_tier2: parseFloat(taskData.cpm_tier2) || 0,
          cpm_tier3: parseFloat(taskData.cpm_tier3) || 0,
          status: taskData.status
        })
      });
      if (!res.ok) throw new Error("Failed to update task");
      await fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task. Please try again.");
    } finally {
      setIsEditingTask(false);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      console.log('[DELETE TASK] Attempting to delete task ID:', taskId);
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[DELETE TASK] Server error:', errorText);
        throw new Error(`Failed to delete task: ${res.status} ${errorText}`);
      }
      
      const result = await res.json();
      console.log('[DELETE TASK] Success:', result);
      await fetchTasks();
      alert(result.message || 'Task deleted successfully!');
    } catch (error) {
      console.error("Error deleting task:", error);
      alert(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeviceChange = (device: string, checked: boolean) => {
    setNewTask(prev => ({
      ...prev,
      devices: checked 
        ? [...prev.devices, device]
        : prev.devices.filter((d: string) => d !== device)
    }));
  };

  const handleBrowserChange = (browser: string, checked: boolean) => {
    setNewTask(prev => ({
      ...prev,
      excludedBrowsers: checked 
        ? [...prev.excludedBrowsers, browser]
        : prev.excludedBrowsers.filter((b: string) => b !== browser)
    }));
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.description || newTask.devices.length === 0) {
      alert("Please fill in all required fields");
      return;
    }
    await addTask(newTask);
  };

  const handleBulkCpmUpdate = async () => {
    if (selectedTasksForBulk.length === 0) {
      alert("Please select at least one task to update.");
      return;
    }

    // Filter out empty rates
    const cpmRates: any = {};
    if (bulkCpmRates.tier1.trim()) cpmRates.tier1 = bulkCpmRates.tier1.replace("$", "");
    if (bulkCpmRates.tier2.trim()) cpmRates.tier2 = bulkCpmRates.tier2.replace("$", "");
    if (bulkCpmRates.tier3.trim()) cpmRates.tier3 = bulkCpmRates.tier3.replace("$", "");

    if (Object.keys(cpmRates).length === 0) {
      alert("Please enter at least one CPM rate to update.");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: selectedTasksForBulk,
          cpmRates
        })
      });

      if (!res.ok) throw new Error("Failed to update CPM rates");
      
      const result = await res.json();
      await fetchTasks();
      
      // Reset bulk update form
      setBulkCpmRates({ tier1: "", tier2: "", tier3: "" });
      setSelectedTasksForBulk([]);
      
      alert(`CPM rates updated successfully for ${result.updated} tasks!`);
    } catch (error) {
      console.error("Error updating bulk CPM rates:", error);
      alert("Failed to update CPM rates. Please try again.");
    }
  };

  const handleTaskSelectionForBulk = (taskId: number, checked: boolean) => {
    setSelectedTasksForBulk(prev => 
      checked 
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };

  const startEditingCpm = (task: any) => {
    setEditingCpmTask(task);
    setTempCpmRates({
      tier1: task.cpm_tier1?.toString() || "0",
      tier2: task.cpm_tier2?.toString() || "0",
      tier3: task.cpm_tier3?.toString() || "0"
    });
  };

  const saveCpmRates = async () => {
    if (!editingCpmTask) return;
    
    try {
      await updateTask(editingCpmTask.id, {
        ...editingCpmTask,
        cpm_tier1: tempCpmRates.tier1,
        cpm_tier2: tempCpmRates.tier2,
        cpm_tier3: tempCpmRates.tier3
      });
      setEditingCpmTask(null);
      setTempCpmRates({ tier1: "", tier2: "", tier3: "" });
    } catch (error) {
      console.error("Error saving CPM rates:", error);
    }
  };

  const cancelEditingCpm = () => {
    setEditingCpmTask(null);
    setTempCpmRates({ tier1: "", tier2: "", tier3: "" });
  };

  const fixLegacyTasks = async () => {
    if (!confirm("This will update all legacy tasks with default values (60s completion time, no excluded browsers). Continue?")) return;
    
    try {
      const legacyTasks = tasks.filter(task => !task.completion_time_seconds && !task.excluded_browsers);
      
      if (legacyTasks.length === 0) {
        alert("No legacy tasks found!");
        return;
      }
      
      console.log(`[FIX LEGACY] Fixing ${legacyTasks.length} legacy tasks`);
      
      const updatePromises = legacyTasks.map(task => 
        updateTask(task.id, {
          ...task,
          completion_time_seconds: 60,
          excluded_browsers: []
        })
      );
      
      await Promise.all(updatePromises);
      await fetchTasks();
      
      alert(`Successfully updated ${legacyTasks.length} legacy tasks!`);
    } catch (error) {
      console.error("Error fixing legacy tasks:", error);
      alert("Failed to fix legacy tasks. Please try again.");
    }
  };

  // Dashboard stats using real data
  const dashboardStats = [
    {
      title: "Total Users",
      value: users.length.toString(),
      change: "+0%", // You can calculate this if you add previous period data
      icon: <Users className="w-5 h-5 text-blue-400" />,
    },
    {
      title: "Task Completions",
      value: analytics?.overview?.taskCompletions?.toString() || "0",
      change: "+0%",
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: "Total Revenue",
      value: `$${analytics?.overview?.totalEarnings?.toFixed(2) || "0.00"}`,
      change: "+0%",
      icon: <DollarSign className="w-5 h-5 text-green-400" />,
    },
    {
      title: "Pending Withdrawals",
      value: `$${analytics?.overview?.pendingCashouts?.toFixed(2) || "0.00"}`,
      change: "+0%",
      icon: <Wallet className="w-5 h-5 text-orange-400" />,
    },
  ]

  const countryCpmRates = [
    { country: "United States", code: "US", cpm: "$4.50", tier: "Tier 1", multiplier: "1.8x" },
    { country: "United Kingdom", code: "GB", cpm: "$3.80", tier: "Tier 1", multiplier: "1.5x" },
    { country: "Germany", code: "DE", cpm: "$3.20", tier: "Tier 1", multiplier: "1.3x" },
    { country: "Canada", code: "CA", cpm: "$3.00", tier: "Tier 1", multiplier: "1.2x" },
    { country: "Australia", code: "AU", cpm: "$2.90", tier: "Tier 1", multiplier: "1.2x" },
    { country: "France", code: "FR", cpm: "$2.70", tier: "Tier 2", multiplier: "1.1x" },
    { country: "Japan", code: "JP", cpm: "$2.60", tier: "Tier 2", multiplier: "1.1x" },
    { country: "Other", code: "XX", cpm: "$2.50", tier: "Tier 3", multiplier: "1.0x" },
  ]

  const withdrawals = [
    {
      id: 1,
      user: "user1@example.com",
      amount: "$125.50",
      method: "PayPal",
      status: "Pending",
      date: "2024-06-14",
    },
    {
      id: 2,
      user: "user2@example.com",
      amount: "$89.30",
      method: "Bitcoin",
      status: "Processing",
      date: "2024-06-13",
    },
    {
      id: 3,
      user: "user3@example.com",
      amount: "$200.00",
      method: "USDC",
      status: "Completed",
      date: "2024-06-12",
    },
  ]

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <Activity className="w-4 h-4" /> },
    { id: "tasks", label: "Tasks", icon: <Settings className="w-4 h-4" /> },
    { id: "cpm", label: "CPM Rates", icon: <DollarSign className="w-4 h-4" /> },
    { id: "payments", label: "Payments", icon: <CreditCard className="w-4 h-4" /> },
  ]

  const refreshAllData = async () => {
    console.log('[ADMIN DEBUG] Manual refresh clicked');
    setLoadingUsers(true);
    setLoadingAnalytics(true);
    setLoadingTasks(true);
    
    try {
      // Refresh users
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        console.log('[ADMIN DEBUG] Refreshed users:', usersData);
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
      
      // Refresh analytics
      const analyticsRes = await fetch("/api/dashboard-analytics");
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        console.log('[ADMIN DEBUG] Refreshed analytics:', analyticsData);
        setAnalytics(analyticsData && typeof analyticsData === 'object' ? analyticsData : null);
      }
      
      // Refresh tasks
      const tasksRes = await fetch("/api/tasks");
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        console.log('[ADMIN DEBUG] Refreshed tasks:', tasksData);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      }
    } catch (error) {
      console.error('[ADMIN DEBUG] Refresh error:', error);
    }
    
    setLoadingUsers(false);
    setLoadingAnalytics(false);
    setLoadingTasks(false);
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          onClick={refreshAllData}
        >
          Refresh Data
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-300 text-sm">{stat.title}</span>
                {stat.icon}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <span
                  className={`text-sm font-medium ${stat.change.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}
                >
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-center relative">
              <svg width="100%" height="200" className="text-emerald-400">
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  points="50,150 100,120 150,130 200,100 250,110 300,80 350,95 400,70"
                  className="opacity-80"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-center relative">
              <svg width="100%" height="200" className="text-green-400">
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  points="50,160 100,140 150,145 200,120 250,125 300,100 350,115 400,85"
                  className="opacity-80"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "New user registered", user: "user@example.com", time: "2 minutes ago" },
              { action: "Withdrawal processed", user: "user2@example.com", time: "15 minutes ago" },
              { action: "Locker created", user: "user3@example.com", time: "1 hour ago" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-gray-400 text-sm">{activity.user}</p>
                </div>
                <span className="text-gray-400 text-sm">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderUsers = () => {
    const filteredUsers = users.filter(
      (user) =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return (
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
              />
            </div>
            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Email Address</Label>
                    <Input className="bg-white/5 border-white/10 text-white" placeholder="user@example.com" />
                  </div>
                  <div>
                    <Label>Initial Balance</Label>
                    <Input className="bg-white/5 border-white/10 text-white" placeholder="$0.00" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white">
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-black">
                    Create User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Balance</TableHead>
                  <TableHead className="text-gray-300">Lockers</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Joined</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>No users found.</TableCell></TableRow>
                ) : filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white">{user.email}</TableCell>
                    <TableCell className="text-white">{user.balance}</TableCell>
                    <TableCell className="text-white">{user.lockers}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-300">{user.joined ? new Date(user.joined).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/10">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/10">
                          <Edit className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/10">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAnalytics = () => (
    <div className="space-y-8">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Site Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics || !analytics ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Daily Active Users</span>
                  <span className="text-emerald-400 font-bold">{analytics.userAnalytics?.dau?.slice(-1)[0]?.count ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Monthly Growth</span>
                  <span className="text-emerald-400 font-bold">+{analytics.userAnalytics?.userDays?.slice(-1)[0]?.count ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Retention Rate</span>
                  <span className="text-emerald-400 font-bold">{analytics.userAnalytics?.retentionRate?.toFixed(1) ?? 0}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics || !analytics ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Avg. CPM</span>
                  <span className="text-green-400 font-bold">${analytics.overview?.cpm?.toFixed(2) ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Payouts</span>
                  <span className="text-green-400 font-bold">${analytics.overview?.totalPayouts?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Profit Margin</span>
                  <span className="text-green-400 font-bold">${analytics.overview?.profitMargin?.toLocaleString() ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Task Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics || !analytics ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Completion Rate</span>
                  <span className="text-blue-400 font-bold">{analytics.overview?.taskCompletions ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Unlock Rate</span>
                  <span className="text-blue-400 font-bold">{analytics.overview?.unlockRate?.toFixed(1) ?? 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Unlocks</span>
                  <span className="text-blue-400 font-bold">{analytics.overview?.unlocks ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics || !analytics ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(analytics.countryData || {}).map(([country, count]) => ({ country, count }))}>
                  <XAxis dataKey="country" stroke="#ccc" fontSize={12} />
                  <YAxis stroke="#ccc" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Task Completion Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics || !analytics ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics.chartData || []} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#ccc" fontSize={12} />
                  <YAxis stroke="#ccc" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} name="Views" />
                  <Line type="monotone" dataKey="unlocks" stroke="#3b82f6" strokeWidth={2} name="Unlocks" />
                  <Line type="monotone" dataKey="tasks" stroke="#f59e42" strokeWidth={2} name="Tasks" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Device & Browser Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics || !analytics ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(analytics.devices || {}).map(([label, value], idx) => ({ id: idx, value: Number(value), label }))}>
                  <XAxis dataKey="label" stroke="#ccc" fontSize={12} />
                  <YAxis stroke="#ccc" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Browser Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics || !analytics ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(analytics.browsers || {}).map(([label, value], idx) => ({ id: idx, value: Number(value), label }))}>
                  <XAxis dataKey="label" stroke="#ccc" fontSize={12} />
                  <YAxis stroke="#ccc" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Traffic Source Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Traffic Source Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics || !analytics ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(analytics.sources || {}).map(([label, value], idx) => ({ id: idx, value: Number(value), label }))}>
                  <XAxis dataKey="label" stroke="#ccc" fontSize={12} />
                  <YAxis stroke="#ccc" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderTasks = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Task Management</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            onClick={fixLegacyTasks}
          >
            🔧 Fix Legacy Tasks
          </Button>
          <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Task Title</Label>
                <Input 
                  className="bg-white/5 border-white/10 text-white" 
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  className="bg-white/5 border-white/10 text-white" 
                  placeholder="Enter task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Ad URL</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="https://example.com/ad"
                  value={newTask.adUrl}
                  onChange={(e) => setNewTask(prev => ({ ...prev, adUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label>Target Devices</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Windows", "Mac", "Android", "iOS"].map((device) => (
                    <label key={device} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="rounded bg-white/5 border-white/10"
                        checked={newTask.devices.includes(device)}
                        onChange={(e) => handleDeviceChange(device, e.target.checked)}
                      />
                      <span className="text-gray-300 text-sm">{device}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Task Completion Time</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input 
                    type="number"
                    className="bg-white/5 border-white/10 text-white flex-1" 
                    placeholder="60"
                    min="5"
                    max="300"
                    value={newTask.completionTimeSeconds}
                    onChange={(e) => setNewTask(prev => ({ ...prev, completionTimeSeconds: parseInt(e.target.value) || 60 }))}
                  />
                  <span className="text-gray-400 text-sm">seconds</span>
                </div>
                <p className="text-gray-500 text-xs mt-1">Time users must wait before task completion (5-300 seconds)</p>
              </div>

              <div>
                <Label>Exclude Browsers</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Chrome", "Firefox", "Safari", "Edge", "Opera", "Opera GX"].map((browser) => (
                    <label key={browser} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="rounded bg-white/5 border-white/10"
                        checked={newTask.excludedBrowsers.includes(browser)}
                        onChange={(e) => handleBrowserChange(browser, e.target.checked)}
                      />
                      <span className="text-gray-300 text-sm">{browser}</span>
                    </label>
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-1">This task will be hidden from users using these browsers</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tier 1 CPM</Label>
                  <Input 
                    className="bg-white/5 border-white/10 text-white" 
                    placeholder="$4.50"
                    value={newTask.countryRates.tier1}
                    onChange={(e) => setNewTask(prev => ({
                      ...prev,
                      countryRates: { ...prev.countryRates, tier1: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Tier 2 CPM</Label>
                  <Input 
                    className="bg-white/5 border-white/10 text-white" 
                    placeholder="$2.80"
                    value={newTask.countryRates.tier2}
                    onChange={(e) => setNewTask(prev => ({
                      ...prev,
                      countryRates: { ...prev.countryRates, tier2: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Tier 3 CPM</Label>
                  <Input 
                    className="bg-white/5 border-white/10 text-white" 
                    placeholder="$1.50"
                    value={newTask.countryRates.tier3}
                    onChange={(e) => setNewTask(prev => ({
                      ...prev,
                      countryRates: { ...prev.countryRates, tier3: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-black"
                onClick={handleAddTask}
                disabled={isAddingTask}
              >
                {isAddingTask ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Tasks Table */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">Task</TableHead>
                <TableHead className="text-gray-300">Settings</TableHead>
                <TableHead className="text-gray-300">CPM Rates</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTasks ? (
                <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
              ) : tasks.length === 0 ? (
                <TableRow><TableCell colSpan={5}>No tasks found.</TableCell></TableRow>
              ) : tasks.map((task) => (
                <TableRow key={task.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div>
                      <p className="text-white font-medium">{task.title}</p>
                      <p className="text-gray-400 text-sm">{task.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {task.devices.map((device: string) => (
                          <span key={device} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                            {device}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">⏱️ {task.completion_time_seconds || 60}s</span>
                        {task.excluded_browsers && Array.isArray(task.excluded_browsers) && task.excluded_browsers.length > 0 && (
                          <span className="text-orange-400">🚫 {task.excluded_browsers.length} browsers blocked</span>
                        )}
                        {!task.completion_time_seconds && !task.excluded_browsers && (
                          <span className="text-yellow-400 text-xs">⚠️ Legacy task</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="text-emerald-400 font-mono hover:bg-emerald-500/20 p-0"
                          onClick={() => startEditingCpm(task)}
                        >
                          <div className="text-left">
                            <div className="text-xs">T1: ${task.cpm_tier1 || 0}</div>
                            <div className="text-xs">T2: ${task.cpm_tier2 || 0}</div>
                            <div className="text-xs">T3: ${task.cpm_tier3 || 0}</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Manage CPM Rates for "{task.title}"</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          {/* Individual Task CPM Update */}
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Update CPM Rates</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card className="bg-emerald-500/10 border-emerald-500/20">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm text-emerald-400">Tier 1 Countries</CardTitle>
                                  <p className="text-xs text-gray-400">US, UK, CA, AU, DE, NL, SE, NO</p>
                                </CardHeader>
                                <CardContent>
                                  <Input
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="4.50"
                                    value={tempCpmRates.tier1}
                                    onChange={(e) => setTempCpmRates(prev => ({ ...prev, tier1: e.target.value }))}
                                  />
                                </CardContent>
                              </Card>
                              <Card className="bg-blue-500/10 border-blue-500/20">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm text-blue-400">Tier 2 Countries</CardTitle>
                                  <p className="text-xs text-gray-400">FR, IT, ES, JP, KR, SG, HK</p>
                                </CardHeader>
                                <CardContent>
                                  <Input
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="2.80"
                                    value={tempCpmRates.tier2}
                                    onChange={(e) => setTempCpmRates(prev => ({ ...prev, tier2: e.target.value }))}
                                  />
                                </CardContent>
                              </Card>
                              <Card className="bg-orange-500/10 border-orange-500/20">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm text-orange-400">Tier 3 Countries</CardTitle>
                                  <p className="text-xs text-gray-400">All other countries</p>
                                </CardHeader>
                                <CardContent>
                                  <Input
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="1.50"
                                    value={tempCpmRates.tier3}
                                    onChange={(e) => setTempCpmRates(prev => ({ ...prev, tier3: e.target.value }))}
                                  />
                                </CardContent>
                              </Card>
                            </div>
                            <div className="flex space-x-4 mt-4">
                              <Button 
                                onClick={saveCpmRates}
                                className="bg-gradient-to-r from-emerald-500 to-green-500 text-black"
                                disabled={isEditingTask}
                              >
                                {isEditingTask ? "Saving..." : "Save Changes"}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={cancelEditingCpm}
                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>

                          {/* Task Settings */}
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Task Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Completion Time */}
                              <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">Completion Time</label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="5"
                                    max="300"
                                    className="bg-white/5 border-white/10 text-white rounded-lg px-3 py-2 w-20"
                                    value={task.completion_time_seconds || 60}
                                    onChange={(e) => {
                                      const newTime = parseInt(e.target.value) || 60;
                                      updateTask(task.id, {
                                        ...task,
                                        completion_time_seconds: newTime
                                      });
                                    }}
                                  />
                                  <span className="text-gray-400 text-sm">seconds</span>
                                </div>
                                <p className="text-gray-500 text-xs">Time users wait before task completion (5-300s)</p>
                              </div>

                              {/* Excluded Browsers */}
                              <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">Excluded Browsers</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {["Chrome", "Firefox", "Safari", "Edge", "Opera", "Opera GX"].map((browser) => (
                                    <label key={browser} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        className="rounded bg-white/5 border-white/10"
                                        checked={task.excluded_browsers?.includes(browser) || false}
                                        onChange={(e) => {
                                          const currentExcluded = task.excluded_browsers || [];
                                          const newExcluded = e.target.checked
                                            ? [...currentExcluded, browser]
                                            : currentExcluded.filter((b: string) => b !== browser);
                                          updateTask(task.id, {
                                            ...task,
                                            excluded_browsers: newExcluded
                                          });
                                        }}
                                      />
                                      <span className="text-gray-300 text-xs">{browser}</span>
                                    </label>
                                  ))}
                                </div>
                                <p className="text-gray-500 text-xs">Hide this task from users using these browsers</p>
                              </div>
                            </div>
                          </div>

                          {/* Device Targeting */}
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Device Targeting</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {["Windows", "Mac", "Android", "iOS"].map((device) => (
                                <label key={device} className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
                                  <input
                                    type="checkbox"
                                    className="rounded bg-white/5 border-white/10"
                                    checked={task.devices.includes(device)}
                                    onChange={(e) => {
                                      const newDevices = e.target.checked
                                        ? [...task.devices, device]
                                        : task.devices.filter((d: string) => d !== device);
                                      updateTask(task.id, {
                                        ...task,
                                        devices: newDevices
                                      });
                                    }}
                                  />
                                  <span className="text-gray-300 text-sm">{device}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        task.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {task.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 hover:bg-white/10"
                        onClick={() => {
                          setCurrentTask(task);
                          setIsEditingTask(true);
                        }}
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 hover:bg-white/10"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderCpmRates = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">CPM Rate Management</h2>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black">
                <Settings className="w-4 h-4 mr-2" />
                Bulk Update
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Update CPM Rates by Tier</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-emerald-400">Tier 1 Countries</CardTitle>
                      <p className="text-xs text-gray-400">US, UK, CA, AU, DE, NL, SE, NO</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm">CPM Rate</Label>
                        <Input 
                          className="bg-white/5 border-white/10 text-white" 
                          placeholder="4.50"
                          value={bulkCpmRates.tier1}
                          onChange={(e) => setBulkCpmRates(prev => ({ ...prev, tier1: e.target.value }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-blue-400">Tier 2 Countries</CardTitle>
                      <p className="text-xs text-gray-400">FR, IT, ES, JP, KR, SG, HK</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm">CPM Rate</Label>
                        <Input 
                          className="bg-white/5 border-white/10 text-white" 
                          placeholder="2.80"
                          value={bulkCpmRates.tier2}
                          onChange={(e) => setBulkCpmRates(prev => ({ ...prev, tier2: e.target.value }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-orange-400">Tier 3 Countries</CardTitle>
                      <p className="text-xs text-gray-400">All other countries</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm">CPM Rate</Label>
                        <Input 
                          className="bg-white/5 border-white/10 text-white" 
                          placeholder="1.50"
                          value={bulkCpmRates.tier3}
                          onChange={(e) => setBulkCpmRates(prev => ({ ...prev, tier3: e.target.value }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <h4 className="text-emerald-400 font-medium text-sm mb-2">Apply to Tasks</h4>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <label key={task.id} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          className="rounded bg-white/5 border-white/10"
                          checked={selectedTasksForBulk.includes(task.id)}
                          onChange={(e) => handleTaskSelectionForBulk(task.id, e.target.checked)}
                        />
                        <span className="text-gray-300 text-sm">{task.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleBulkCpmUpdate}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-black"
                  disabled={selectedTasksForBulk.length === 0}
                >
                  Apply Bulk CPM Rates ({selectedTasksForBulk.length} tasks selected)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Rates
          </Button>
        </div>
      </div>

              {/* Geolocation Service Status */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Geolocation Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 font-medium">ip-api.com</span>
                </div>
                <p className="text-gray-300 text-sm">Active geolocation provider</p>
                <p className="text-white text-xs mt-1">86% accuracy • Proxy detection • €13/month unlimited</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white font-bold text-lg">3 Tiers</div>
                <p className="text-gray-300 text-sm">Country classification</p>
                <p className="text-white text-xs mt-1">Tier 1: 12 countries • Tier 2: 12 countries</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white font-bold text-lg">Fast & Reliable</div>
                <p className="text-gray-300 text-sm">Location detection</p>
                <p className="text-white text-xs mt-1">Under 50ms response • Unlimited requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Country CPM Rates */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Country-Specific CPM Rates</CardTitle>
          <p className="text-gray-400 text-sm">Powered by ip-api.com geolocation service</p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">Country</TableHead>
                <TableHead className="text-gray-300">Code</TableHead>
                <TableHead className="text-gray-300">Tier</TableHead>
                <TableHead className="text-gray-300">CPM Rate</TableHead>
                <TableHead className="text-gray-300">Multiplier</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countryCpmRates.map((country, index) => (
                <TableRow key={index} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white">{country.country}</TableCell>
                  <TableCell className="text-gray-300 font-mono">{country.code}</TableCell>
                  <TableCell className="text-cyan-400 font-medium">{country.tier}</TableCell>
                  <TableCell className="text-emerald-400 font-bold">{country.cpm}</TableCell>
                  <TableCell className="text-blue-400">{country.multiplier}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/10">
                      <Edit className="w-4 h-4 text-gray-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderPayments = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Payment Management</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Withdrawal Requests */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">User</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Method</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white">{withdrawal.user}</TableCell>
                  <TableCell className="text-white font-bold">{withdrawal.amount}</TableCell>
                  <TableCell className="text-gray-300">{withdrawal.method}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 w-fit ${
                        withdrawal.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : withdrawal.status === "Processing"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-orange-500/20 text-orange-400"
                      }`}
                    >
                      {withdrawal.status === "Completed" && <CheckCircle className="w-3 h-3" />}
                      {withdrawal.status === "Processing" && <Clock className="w-3 h-3" />}
                      {withdrawal.status === "Pending" && <AlertCircle className="w-3 h-3" />}
                      <span>{withdrawal.status}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-300">{withdrawal.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {withdrawal.status !== "Completed" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-blue-500/20 text-blue-400">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white">
                            <DialogHeader>
                              <DialogTitle>Update Payment Status</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>User: {withdrawal.user}</Label>
                                <p className="text-gray-400 text-sm">Amount: {withdrawal.amount}</p>
                                <p className="text-gray-400 text-sm">Method: {withdrawal.method}</p>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white">
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </div>
                              <div>
                                <Label>Admin Notes (Optional)</Label>
                                <Textarea
                                  className="bg-white/5 border-white/10 text-white"
                                  placeholder="Add notes about this transaction..."
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-black">
                                  Update Status
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/10">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Admin Panel</h1>
              <p className="text-gray-400 text-sm">Manage your platform and users</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-lg px-4 py-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Admin Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-white/10">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "users" && renderUsers()}
          {activeTab === "analytics" && renderAnalytics()}
          {activeTab === "tasks" && renderTasks()}
          {activeTab === "cpm" && renderCpmRates()}
          {activeTab === "payments" && renderPayments()}
        </div>
      </div>

      {/* Edit Task Modal */}
      {isEditingTask && currentTask && (
        <Dialog open={isEditingTask} onOpenChange={setIsEditingTask}>
          <DialogContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Task Title</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter task title"
                  value={currentTask.title || ''}
                  onChange={(e) => setCurrentTask((prev: any) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter task description"
                  value={currentTask.description || ''}
                  onChange={(e) => setCurrentTask((prev: any) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Ad URL</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="https://example.com/ad"
                  value={currentTask.adUrl || ''}
                  onChange={(e) => setCurrentTask((prev: any) => ({ ...prev, adUrl: e.target.value }))}
                />
                {!currentTask.adUrl && (
                  <div className="text-red-400 text-xs mt-1">Ad URL is required for this task.</div>
                )}
              </div>
              {/* Add other fields as needed (devices, CPM, etc.) */}
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-black"
                onClick={() => { updateTask(currentTask.id, currentTask); setIsEditingTask(false); }}
                disabled={!currentTask.adUrl}
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
