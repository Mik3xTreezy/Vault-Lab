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
  Loader2,
  Upload,
  FileText,
  X,
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
    },
    targetTiers: ["tier1", "tier2", "tier3"] as string[], // Default: show to all tiers
    taskType: "adult" as string // Default task type
  });

  // CPM Rate Management
  const [bulkCpmRates, setBulkCpmRates] = useState({
    tier1: "",
    tier2: "",
    tier3: ""
  });
  const [selectedTasksForBulk, setSelectedTasksForBulk] = useState<string[]>([]);

  // Individual CPM rate editing state
  const [editingCpmTask, setEditingCpmTask] = useState<any>(null);
  const [tempCpmRates, setTempCpmRates] = useState({
    tier1: "",
    tier2: "",
    tier3: ""
  });

  // Device targeting state
  const [activeDeviceTab, setActiveDeviceTab] = useState("Windows");
  const [deviceTargeting, setDeviceTargeting] = useState<any>({});
  const [loadingDeviceTargeting, setLoadingDeviceTargeting] = useState(false);
  const [savingDeviceTargeting, setSavingDeviceTargeting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // CSV Upload state
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [selectedTaskForCsv, setSelectedTaskForCsv] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvError, setCsvError] = useState("");

  // CPM Viewer state
  const [selectedTaskForViewer, setSelectedTaskForViewer] = useState<string | null>(null);
  const [cpmViewerData, setCpmViewerData] = useState<any[]>([]);
  const [loadingCpmViewer, setLoadingCpmViewer] = useState(false);

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
      console.log('[INIT FETCH TASKS] Starting initial task fetch...');
      await fetchTasks();
    }
    initFetchTasks();
  }, [isLoaded, isSignedIn, user]);

  // Load device targeting data
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    async function fetchDeviceTargeting() {
      setLoadingDeviceTargeting(true);
      try {
        const res = await fetch("/api/device-targeting");
        if (res.ok) {
          const data = await res.json();
          setDeviceTargeting(data || {});
        }
      } catch (error) {
        console.error("Error fetching device targeting:", error);
      } finally {
        setLoadingDeviceTargeting(false);
      }
    }
    
    fetchDeviceTargeting();
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
      console.log('[FETCH TASKS] Starting task fetch...');
      const res = await fetch("/api/tasks");
      console.log('[FETCH TASKS] Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[FETCH TASKS] Error response:', errorText);
        throw new Error(`Failed to fetch tasks: ${res.status} ${errorText}`);
      }
      
      const rawText = await res.text();
      console.log('[FETCH TASKS] Raw response:', rawText.substring(0, 200) + '...');
      
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('[FETCH TASKS] JSON parse error:', parseError);
        console.error('[FETCH TASKS] Raw text that failed to parse:', rawText);
        throw new Error('Invalid JSON response from tasks API');
      }
      
      console.log('[FETCH TASKS] Parsed data:', data);
      
      if (Array.isArray(data)) {
        setTasks(data);
        console.log('[FETCH TASKS] Successfully set', data.length, 'tasks');
      } else {
        console.warn('[FETCH TASKS] Data is not an array:', typeof data, data);
        setTasks([]);
      }
    } catch (error) {
      console.error("[FETCH TASKS] Error fetching tasks:", error);
      setTasks([]);
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
          target_tiers: taskData.targetTiers || ["tier1", "tier2", "tier3"],
          task_type: taskData.taskType || "adult",
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
        },
        targetTiers: ["tier1", "tier2", "tier3"],
        taskType: "adult"
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

  const handleTierChange = (tier: string, checked: boolean) => {
    setNewTask(prev => ({
      ...prev,
      targetTiers: checked 
        ? [...prev.targetTiers, tier]
        : prev.targetTiers.filter((t: string) => t !== tier)
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

  const handleTaskSelectionForBulk = (taskId: string, checked: boolean) => {
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

  // Device targeting functions
  const updateDeviceTargeting = async (device: string, country: string, field: string, value: any) => {
    try {
      const key = `${device}_${country}`;
      const currentData = deviceTargeting[key] || {};
      const updatedData = { ...currentData, device, country, [field]: value };
      
      setDeviceTargeting((prev: any) => ({
        ...prev,
        [key]: updatedData
      }));
      
      setHasUnsavedChanges(true);
      console.log(`[DEVICE TARGETING] Updated ${device} ${country} ${field}:`, value);
    } catch (error) {
      console.error("Error updating device targeting:", error);
    }
  };

  const getDeviceTargetingValue = (device: string, country: string, field: string) => {
    const key = `${device}_${country}`;
    return deviceTargeting[key]?.[field] || "";
  };

  const saveDeviceTargeting = async () => {
    setSavingDeviceTargeting(true);
    try {
      const res = await fetch("/api/device-targeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deviceTargeting)
      });

      if (!res.ok) throw new Error("Failed to save device targeting");
      
      const result = await res.json();
      setHasUnsavedChanges(false);
      alert("Device targeting configurations saved successfully!");
      console.log("[DEVICE TARGETING] Saved successfully:", result);
    } catch (error) {
      console.error("Error saving device targeting:", error);
      alert("Failed to save device targeting. Please try again.");
    } finally {
      setSavingDeviceTargeting(false);
    }
  };

  // CSV Upload functions
  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvError("");
      parseCsvFile(file);
    }
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setCsvError("CSV file must have at least a header row and one data row");
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Check for required columns
        const requiredColumns = ['country', 'cpm'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          setCsvError(`Missing required columns: ${missingColumns.join(', ')}. Required: country, cpm`);
          return;
        }

        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });

          // Validate CPM value
          const cpmValue = parseFloat(row.cpm);
          if (isNaN(cpmValue) || cpmValue < 0) {
            throw new Error(`Invalid CPM value "${row.cpm}" on row ${index + 2}`);
          }

          return {
            country: row.country,
            cpm: cpmValue,
            countryCode: row.country_code || row.code || '', // Optional country code
            originalRow: index + 2
          };
        });

        setCsvData(data);
        setCsvPreview(data.slice(0, 10)); // Show first 10 rows for preview
        setCsvError("");
      } catch (error) {
        setCsvError(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setCsvData([]);
        setCsvPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const uploadCsvRates = async () => {
    if (!selectedTaskForCsv || csvData.length === 0) {
      setCsvError("Please select a task and upload a valid CSV file");
      return;
    }

    console.log('[CSV UPLOAD] Starting upload with:', {
      selectedTaskForCsv,
      selectedTaskType: typeof selectedTaskForCsv,
      csvDataLength: csvData.length,
      availableTasks: tasks.map(t => ({ id: t.id, title: t.title }))
    });

    setUploadingCsv(true);
    setCsvError("");

    try {
      const requestBody = {
        taskId: selectedTaskForCsv,
        cpmData: csvData
      };
      
      console.log('[CSV UPLOAD] Request body:', requestBody);

      const response = await fetch('/api/tasks/csv-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[CSV UPLOAD] Response status:', response.status);
      
      // Get response text first to debug JSON parsing issues
      const responseText = await response.text();
      console.log('[CSV UPLOAD] Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to upload CSV data';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('[CSV UPLOAD] Failed to parse error response:', parseError);
          errorMessage = `Server error: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[CSV UPLOAD] Failed to parse success response:', parseError);
        throw new Error(`Invalid response format: ${responseText}`);
      }
      
      // Refresh tasks and device targeting data
      await fetchTasks();
      
      // Refresh device targeting to show updated CPM rates
      const deviceRes = await fetch("/api/device-targeting");
      if (deviceRes.ok) {
        const deviceData = await deviceRes.json();
        setDeviceTargeting(deviceData || {});
      }

      alert(`Successfully updated CPM rates for ${result.updatedCount} countries!`);
      
      // Reset CSV upload state
      setCsvUploadOpen(false);
      setSelectedTaskForCsv(null);
      setCsvFile(null);
      setCsvData([]);
      setCsvPreview([]);
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : 'Failed to upload CSV data');
    } finally {
      setUploadingCsv(false);
    }
  };

  const resetCsvUpload = () => {
    setCsvFile(null);
    setCsvData([]);
    setCsvPreview([]);
    setCsvError("");
    // Don't reset selected task when opening dialog - let user keep their selection
    // setSelectedTaskForCsv(null);
  };

  // CPM Viewer functions
  const fetchCpmDataForTask = async (taskId: string) => {
    if (!taskId) return;
    
    setLoadingCpmViewer(true);
    try {
      console.log('[CPM VIEWER] Fetching CPM data for task:', taskId);
      
      const response = await fetch(`/api/device-targeting?taskId=${taskId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch CPM data');
      }
      
      const data = await response.json();
      console.log('[CPM VIEWER] Raw device targeting data:', data);
      
      // Transform the data to group by country
      const countryData: { [key: string]: any } = {};
      
      Object.entries(data || {}).forEach(([key, value]: [string, any]) => {
        // Only show CSV uploaded data, not manually set data
        if (value && value.country && value.cpm && value.task_id === taskId && value.source === 'csv_upload') {
          const country = value.country;
          if (!countryData[country]) {
            countryData[country] = {
              country: country,
              devices: {},
              averageCpm: 0,
              totalDevices: 0
            };
          }
          
          countryData[country].devices[value.device] = {
            cpm: value.cpm,
            adUrl: value.ad_url || '',
            updatedAt: value.updated_at
          };
          countryData[country].totalDevices++;
        }
      });
      
      // Calculate average CPM for each country
      Object.values(countryData).forEach((country: any) => {
        const cpms = Object.values(country.devices).map((device: any) => parseFloat(device.cpm) || 0);
        country.averageCpm = cpms.length > 0 ? cpms.reduce((sum, cpm) => sum + cpm, 0) / cpms.length : 0;
      });
      
      const sortedData = Object.values(countryData).sort((a: any, b: any) => b.averageCpm - a.averageCpm);
      
      console.log('[CPM VIEWER] Processed data:', sortedData);
      setCpmViewerData(sortedData);
      
    } catch (error) {
      console.error('[CPM VIEWER] Error fetching CPM data:', error);
      setCpmViewerData([]);
    } finally {
      setLoadingCpmViewer(false);
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

  // Device targeting countries
  const targetingCountries = [
    { country: "United States", code: "US", tier: "Tier 1" },
    { country: "United Kingdom", code: "GB", tier: "Tier 1" },
    { country: "Canada", code: "CA", tier: "Tier 1" },
    { country: "Australia", code: "AU", tier: "Tier 1" },
    { country: "Germany", code: "DE", tier: "Tier 1" },
    { country: "Netherlands", code: "NL", tier: "Tier 1" },
    { country: "Sweden", code: "SE", tier: "Tier 1" },
    { country: "Norway", code: "NO", tier: "Tier 1" },
    { country: "France", code: "FR", tier: "Tier 2" },
    { country: "Italy", code: "IT", tier: "Tier 2" },
    { country: "Spain", code: "ES", tier: "Tier 2" },
    { country: "Japan", code: "JP", tier: "Tier 2" },
    { country: "South Korea", code: "KR", tier: "Tier 2" },
    { country: "Singapore", code: "SG", tier: "Tier 2" },
    { country: "India", code: "IN", tier: "Tier 3" },
    { country: "Brazil", code: "BR", tier: "Tier 3" },
    { country: "Mexico", code: "MX", tier: "Tier 3" },
    { country: "Philippines", code: "PH", tier: "Tier 3" },
    { country: "Indonesia", code: "ID", tier: "Tier 3" },
    { country: "Other", code: "XX", tier: "Tier 3" },
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
    { id: "device-targeting", label: "Device Targeting", icon: <Globe className="w-4 h-4" /> },
    { id: "cpm-viewer", label: "CPM Viewer", icon: <Eye className="w-4 h-4" /> },
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
                <Label>Task Type</Label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 mt-2"
                  value={newTask.taskType}
                  onChange={(e) => setNewTask(prev => ({ ...prev, taskType: e.target.value }))}
                >
                  <option value="adult" className="bg-gray-800 text-white">🔞 Adult Tasks</option>
                  <option value="game" className="bg-gray-800 text-white">🎮 Game Tasks</option>
                  <option value="minecraft" className="bg-gray-800 text-white">⛏️ Minecraft Tasks</option>
                  <option value="roblox" className="bg-gray-800 text-white">🟦 Roblox Tasks</option>
                </select>
                <p className="text-gray-500 text-xs mt-1">Select the category for this task</p>
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

              <div>
                <Label>Target Country Tiers</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { tier: "tier1", label: "Tier 1", desc: "US, UK, CA, AU, DE, NL, SE, NO", color: "emerald" },
                    { tier: "tier2", label: "Tier 2", desc: "FR, IT, ES, JP, KR, SG, HK", color: "blue" },
                    { tier: "tier3", label: "Tier 3", desc: "All other countries", color: "orange" }
                  ].map(({ tier, label, desc, color }) => (
                    <label key={tier} className={`flex items-start space-x-2 p-3 bg-${color}-500/10 border border-${color}-500/20 rounded-lg cursor-pointer hover:bg-${color}-500/20 transition-colors`}>
                      <input 
                        type="checkbox" 
                        className="rounded bg-white/5 border-white/10 mt-0.5"
                        checked={newTask.targetTiers.includes(tier)}
                        onChange={(e) => handleTierChange(tier, e.target.checked)}
                      />
                      <div className="flex-1">
                        <span className={`text-${color}-400 text-sm font-medium`}>{label}</span>
                        <p className="text-gray-400 text-xs mt-1">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-2">This task will only be shown to users from selected country tiers</p>
                {newTask.targetTiers.length === 0 && (
                  <p className="text-red-400 text-xs mt-1">⚠️ Warning: Task will not be visible to any users if no tiers are selected</p>
                )}
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

  const renderDeviceTargeting = () => {
    const devices = ["Windows", "MacOS", "Android", "iOS"];
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Device-Specific Targeting</h2>
            <p className="text-gray-400 text-sm">Manage tasks, ad URLs, and CPM rates by device and country</p>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="text-yellow-400 text-sm flex items-center gap-1">
                ⚠️ Unsaved changes
              </span>
            )}
            <Dialog open={csvUploadOpen} onOpenChange={setCsvUploadOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  onClick={async () => {
                    setCsvUploadOpen(true);
                    // Reset CSV state when opening dialog
                    resetCsvUpload();
                    // Force refresh tasks if none are loaded
                    if (!Array.isArray(tasks) || tasks.length === 0) {
                      console.log('Force refreshing tasks for CSV dialog...');
                      await fetchTasks();
                    }
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  CSV Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Bulk CPM Upload via CSV
                  </DialogTitle>
                  <p className="text-gray-400 text-sm">Upload a CSV file to set CPM rates for multiple countries at once</p>
                  <p className="text-xs text-blue-400">Available tasks: {Array.isArray(tasks) ? tasks.filter(t => t && t.id && t.title).length : 0}</p>
                </DialogHeader>
                
                <div className="space-y-6 max-h-[80vh] overflow-y-auto">
                  {/* Task Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Select Task</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          console.log('Refreshing tasks...');
                          await fetchTasks();
                        }}
                        className="text-xs text-blue-400 hover:bg-blue-500/10"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                      </Button>
                    </div>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                      value={selectedTaskForCsv || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setSelectedTaskForCsv(null);
                          console.log('Task selection cleared');
                          return;
                        }
                        
                        // Task IDs are UUIDs (strings), not integers
                        setSelectedTaskForCsv(value);
                        console.log('Selected task ID:', value, 'type:', typeof value);
                      }}
                    >
                      <option value="" className="bg-gray-800 text-gray-300">Choose a task to update CPM rates for...</option>
                      {loadingTasks ? (
                        <option value="" className="bg-gray-800 text-gray-400" disabled>Loading tasks...</option>
                      ) : !Array.isArray(tasks) || tasks.length === 0 ? (
                        <option value="" className="bg-gray-800 text-gray-400" disabled>No tasks available</option>
                      ) : (
                        tasks.filter(task => task && task.id && task.title).map((task) => (
                          <option key={task.id} value={task.id} className="bg-gray-800 text-white">
                            {task.title} (ID: {task.id})
                          </option>
                        ))
                      )}
                    </select>
                    {selectedTaskForCsv && (
                      <div className="text-emerald-400 text-sm">
                        <p>✓ Selected: {tasks.find(t => t.id === selectedTaskForCsv)?.title || 'Unknown Task'}</p>
                      </div>
                    )}
                    
                    {/* Available tasks count */}
                    <div className="text-xs text-gray-500 mt-1">
                      Available tasks: {Array.isArray(tasks) ? tasks.filter(t => t && t.id && t.title).length : 0}
                      {loadingTasks && " (Loading...)"}
                    </div>
                  </div>

                  {/* CSV Format Instructions */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-blue-400 font-medium text-sm">📋 CSV Format Requirements</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs"
                        onClick={() => {
                          const csvContent = `country,cpm,country_code
United States,4.50,US
United Kingdom,4.20,GB
Germany,3.80,DE
France,3.50,FR
Italy,3.20,IT
Spain,3.00,ES
Netherlands,3.80,NL
Sweden,3.60,SE
Norway,3.70,NO
Denmark,3.60,DK
Canada,4.00,CA
Australia,3.90,AU
Japan,3.40,JP
South Korea,3.20,KR
Singapore,3.50,SG`;
                          
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'cpm_rates_template.csv';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download Template
                      </Button>
                    </div>
                    <div className="text-gray-300 text-sm space-y-1">
                      <p>• <strong>Required columns:</strong> country, cpm</p>
                      <p>• <strong>Optional columns:</strong> country_code (or code)</p>
                      <p>• <strong>Example:</strong></p>
                      <div className="bg-black/50 rounded p-2 mt-2 font-mono text-xs">
                        country,cpm,country_code<br/>
                        United States,4.50,US<br/>
                        United Kingdom,4.20,GB<br/>
                        Germany,3.80,DE
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Upload CSV File</Label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/30 transition-colors">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-300">Click to upload CSV file</p>
                        <p className="text-gray-500 text-sm">Supports .csv files only</p>
                      </label>
                    </div>
                    
                    {csvFile && (
                      <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="text-white text-sm">{csvFile.name}</span>
                          <span className="text-gray-400 text-xs">({csvData.length} rows)</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={resetCsvUpload}
                          className="w-6 h-6 hover:bg-red-500/20 text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Error Display */}
                  {csvError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{csvError}</p>
                    </div>
                  )}

                  {/* Preview */}
                  {csvPreview.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-gray-300">Preview (First 10 rows)</Label>
                      <div className="bg-white/5 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-white/10">
                            <TableRow className="border-white/10">
                              <TableHead className="text-gray-300">Country</TableHead>
                              <TableHead className="text-gray-300">CPM Rate</TableHead>
                              <TableHead className="text-gray-300">Country Code</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csvPreview.map((row, index) => (
                              <TableRow key={index} className="border-white/10 hover:bg-white/5">
                                <TableCell className="text-white">{row.country}</TableCell>
                                <TableCell className="text-emerald-400 font-mono">${row.cpm.toFixed(2)}</TableCell>
                                <TableCell className="text-gray-300">{row.countryCode || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {csvData.length > 10 && (
                        <p className="text-gray-400 text-sm">... and {csvData.length - 10} more rows</p>
                      )}
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-400 text-sm">
                          📊 Ready to upload: <strong>{csvData.length} countries</strong> will be updated for the selected task
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                    <Button
                      variant="outline"
                      onClick={() => setCsvUploadOpen(false)}
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={uploadCsvRates}
                      disabled={!selectedTaskForCsv || csvData.length === 0 || uploadingCsv}
                      className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium disabled:from-gray-500 disabled:to-gray-600 disabled:text-gray-300"
                    >
                      {uploadingCsv ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload CPM Rates ({csvData.length} countries)
                        </>
                      )}
                    </Button>
                    
                    {/* Upload requirements */}
                    {(!selectedTaskForCsv || csvData.length === 0) && (
                      <p className="text-yellow-400 text-sm mt-2">
                        {!selectedTaskForCsv && "⚠️ Please select a task first"}
                        {selectedTaskForCsv && csvData.length === 0 && "⚠️ Please upload a valid CSV file"}
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => {
                console.log('Device targeting data:', deviceTargeting);
                alert('Device targeting data logged to console');
              }}
            >
              📊 Export Data
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black"
              onClick={saveDeviceTargeting}
              disabled={savingDeviceTargeting || !hasUnsavedChanges}
            >
              {savingDeviceTargeting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  💾 Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Device Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {devices.map((device) => (
            <button
              key={device}
              onClick={() => setActiveDeviceTab(device)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeDeviceTab === device
                  ? "bg-emerald-500 text-black"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {device}
            </button>
          ))}
        </div>

        {/* Device-specific content */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {activeDeviceTab === "Windows" && "🖥️"}
              {activeDeviceTab === "MacOS" && "🍎"}
              {activeDeviceTab === "Android" && "🤖"}
              {activeDeviceTab === "iOS" && "📱"}
              {activeDeviceTab} Targeting Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-300 w-48">Country</TableHead>
                    <TableHead className="text-gray-300 w-64">Task</TableHead>
                    <TableHead className="text-gray-300 w-96">Ad URL</TableHead>
                    <TableHead className="text-gray-300 w-32">CPM Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetingCountries.map((country) => (
                    <TableRow key={country.code} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{country.country}</span>
                            <span className="text-xs text-gray-400">({country.code})</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            country.tier === "Tier 1" ? "bg-emerald-500/20 text-emerald-400" :
                            country.tier === "Tier 2" ? "bg-blue-500/20 text-blue-400" :
                            "bg-orange-500/20 text-orange-400"
                          }`}>
                            {country.tier}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                          value={getDeviceTargetingValue(activeDeviceTab, country.code, "taskId")}
                          onChange={(e) => updateDeviceTargeting(activeDeviceTab, country.code, "taskId", e.target.value)}
                        >
                          <option value="">Select Task</option>
                          {tasks.map((task) => (
                            <option key={task.id} value={task.id} className="bg-gray-800">
                              {task.title}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input
                          className="bg-white/5 border-white/10 text-white text-sm"
                          placeholder="https://example.com/ad"
                          value={getDeviceTargetingValue(activeDeviceTab, country.code, "adUrl")}
                          onChange={(e) => updateDeviceTargeting(activeDeviceTab, country.code, "adUrl", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-400 text-sm">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className={`bg-white/5 border-white/10 text-white text-sm w-20 ${
                              getDeviceTargetingValue(activeDeviceTab, country.code, "cpm") ? 
                              'ring-1 ring-emerald-500/50 bg-emerald-500/10' : ''
                            }`}
                            placeholder="2.50"
                            value={getDeviceTargetingValue(activeDeviceTab, country.code, "cpm")}
                            onChange={(e) => updateDeviceTargeting(activeDeviceTab, country.code, "cpm", e.target.value)}
                          />
                          {getDeviceTargetingValue(activeDeviceTab, country.code, "cpm") && (
                            <div className="flex items-center">
                              <span className="text-emerald-400 text-xs ml-1">✓</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="text-emerald-400 font-bold text-lg">
                {targetingCountries.filter(c => getDeviceTargetingValue(activeDeviceTab, c.code, "taskId")).length}
              </div>
              <div className="text-gray-300 text-sm">Configured Countries</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="text-blue-400 font-bold text-lg">
                {targetingCountries.filter(c => getDeviceTargetingValue(activeDeviceTab, c.code, "adUrl")).length}
              </div>
              <div className="text-gray-300 text-sm">With Ad URLs</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/10 border-orange-500/20">
            <CardContent className="p-4">
              <div className="text-orange-400 font-bold text-lg">
                {targetingCountries.filter(c => getDeviceTargetingValue(activeDeviceTab, c.code, "cpm")).length}
              </div>
              <div className="text-gray-300 text-sm">Custom CPM Rates</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="text-purple-400 font-bold text-lg">
                ${targetingCountries.reduce((sum, c) => {
                  const cpm = parseFloat(getDeviceTargetingValue(activeDeviceTab, c.code, "cpm")) || 0;
                  return sum + cpm;
                }, 0).toFixed(2)}
              </div>
              <div className="text-gray-300 text-sm">Total CPM Value</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

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

  const renderCpmViewer = () => {
    const countryCodeToName: { [key: string]: string } = {
      'US': 'United States',
      'GB': 'United Kingdom', 
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'SE': 'Sweden',
      'NO': 'Norway',
      'DK': 'Denmark',
      'FI': 'Finland',
      'CA': 'Canada',
      'AU': 'Australia',
      'JP': 'Japan',
      'KR': 'South Korea',
      'SG': 'Singapore',
      'HK': 'Hong Kong',
      'CH': 'Switzerland',
      'AT': 'Austria',
      'BE': 'Belgium',
      'IE': 'Ireland',
      'NZ': 'New Zealand',
      'IL': 'Israel',
      'AE': 'UAE',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'IN': 'India',
      'CN': 'China',
      'RU': 'Russia',
      'TR': 'Turkey',
      'PL': 'Poland',
      'CZ': 'Czech Republic',
      'HU': 'Hungary',
      'PT': 'Portugal',
      'GR': 'Greece',
      'ZA': 'South Africa',
      'AR': 'Argentina',
      'CL': 'Chile',
      'CO': 'Colombia',
      'PE': 'Peru',
      'TH': 'Thailand',
      'MY': 'Malaysia',
      'ID': 'Indonesia',
      'PH': 'Philippines',
      'VN': 'Vietnam',
      'TW': 'Taiwan'
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">CPM Rates Viewer</h2>
          <div className="text-sm text-gray-400">
            View CPM rates set via CSV upload only (excludes manually configured rates)
          </div>
        </div>

        {/* Task Selection */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
                         <CardTitle className="text-white flex items-center gap-2">
               <Eye className="w-5 h-5 text-blue-400" />
               Select Task to View CSV-Uploaded CPM Rates
               <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">CSV Only</span>
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-gray-300">Choose Task</Label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 mt-1"
                  value={selectedTaskForViewer || ""}
                  onChange={(e) => {
                    const taskId = e.target.value;
                    setSelectedTaskForViewer(taskId || null);
                    if (taskId) {
                      fetchCpmDataForTask(taskId);
                    } else {
                      setCpmViewerData([]);
                    }
                  }}
                >
                  <option value="" className="bg-gray-800 text-gray-300">Select a task to view CPM rates...</option>
                  {tasks.filter(task => task && task.id && task.title).map((task) => (
                    <option key={task.id} value={task.id} className="bg-gray-800 text-white">
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedTaskForViewer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCpmDataForTask(selectedTaskForViewer)}
                  disabled={loadingCpmViewer}
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 mt-6"
                >
                  {loadingCpmViewer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {selectedTaskForViewer && (
              <div className="text-sm text-emerald-400">
                ✓ Viewing CPM rates for: {tasks.find(t => t.id === selectedTaskForViewer)?.title}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CPM Data Display */}
        {selectedTaskForViewer && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  CPM Rates by Country
                </div>
                <div className="text-sm text-gray-400">
                  {cpmViewerData.length} countries configured
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingCpmViewer ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                  <p className="text-gray-400">Loading CPM data...</p>
                </div>
              ) : cpmViewerData.length === 0 ? (
                                 <div className="p-8 text-center">
                   <Globe className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                   <p className="text-gray-400 text-lg mb-2">No CSV-uploaded CPM rates found</p>
                   <p className="text-gray-500 text-sm">
                     This task doesn't have any CPM rates set via CSV upload yet.<br/>
                     Use the "Device Targeting" tab to upload CPM rates via CSV.
                   </p>
                 </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-300">Country</TableHead>
                        <TableHead className="text-gray-300">Average CPM</TableHead>
                        <TableHead className="text-gray-300">Windows</TableHead>
                        <TableHead className="text-gray-300">MacOS</TableHead>
                        <TableHead className="text-gray-300">Android</TableHead>
                        <TableHead className="text-gray-300">iOS</TableHead>
                                                 <TableHead className="text-gray-300">Devices Configured</TableHead>
                         <TableHead className="text-gray-300">Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cpmViewerData.map((countryData: any) => (
                        <TableRow key={countryData.country} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium">
                                {countryCodeToName[countryData.country] || countryData.country}
                              </span>
                              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                                {countryData.country}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-emerald-400 font-bold">
                              ${countryData.averageCpm.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {countryData.devices.Windows ? (
                              <span className="text-blue-400 font-mono">
                                ${parseFloat(countryData.devices.Windows.cpm).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {countryData.devices.MacOS ? (
                              <span className="text-blue-400 font-mono">
                                ${parseFloat(countryData.devices.MacOS.cpm).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {countryData.devices.Android ? (
                              <span className="text-blue-400 font-mono">
                                ${parseFloat(countryData.devices.Android.cpm).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {countryData.devices.iOS ? (
                              <span className="text-blue-400 font-mono">
                                ${parseFloat(countryData.devices.iOS.cpm).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                                                     <TableCell>
                             <div className="flex items-center space-x-1">
                               <span className="text-gray-300">{countryData.totalDevices}/4</span>
                               <div className="w-16 bg-gray-700 rounded-full h-2">
                                 <div 
                                   className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                   style={{ width: `${(countryData.totalDevices / 4) * 100}%` }}
                                 />
                               </div>
                             </div>
                           </TableCell>
                           <TableCell>
                             <span className="text-gray-400 text-xs">
                               {(() => {
                                 const latestUpdate = Object.values(countryData.devices)
                                   .map((device: any) => device.updatedAt)
                                   .filter(Boolean)
                                   .sort()
                                   .pop();
                                 return latestUpdate ? new Date(latestUpdate).toLocaleDateString() : '-';
                               })()}
                             </span>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {cpmViewerData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="text-emerald-400 font-bold text-lg">
                  {cpmViewerData.length}
                </div>
                <div className="text-gray-300 text-sm">Countries Configured</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="text-blue-400 font-bold text-lg">
                  ${(cpmViewerData.reduce((sum, country) => sum + country.averageCpm, 0) / cpmViewerData.length).toFixed(2)}
                </div>
                <div className="text-gray-300 text-sm">Average CPM</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/10 border-orange-500/20">
              <CardContent className="p-4">
                <div className="text-orange-400 font-bold text-lg">
                  ${Math.max(...cpmViewerData.map(c => c.averageCpm)).toFixed(2)}
                </div>
                <div className="text-gray-300 text-sm">Highest CPM</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="text-purple-400 font-bold text-lg">
                  {cpmViewerData.reduce((sum, country) => sum + country.totalDevices, 0)}
                </div>
                <div className="text-gray-300 text-sm">Total Device Configs</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

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
        {activeTab === "device-targeting" && renderDeviceTargeting()}
        {activeTab === "cpm-viewer" && renderCpmViewer()}
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
